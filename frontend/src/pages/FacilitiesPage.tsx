// frontend/src/pages/FacilitiesPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';
import LoadingSpinner from '../components/LoadingSpinner';
import AdvancedSearchFilter from '../components/AdvancedSearchFilter';
import { getFacilities, getFacilitiesByStatus, deleteFacility, searchFacilities, Facility, FacilitySearchFilters } from '../services';
import {
  CanonicalStatus, // Use canonical status type again
  getCanonicalStatus,
  getStatusLabel,
  STATUS_LABELS, // Add STATUS_LABELS back for fetching logic
  getStatusClass,
  VALID_CANONICAL_STATUSES // Use the predefined list for tabs again
} from '../utils/statusUtils';
import './FacilitiesPage.css';

// Define an interface for column configuration
interface ColumnConfig {
  // Adjusted keyof Facility to include the new numeric capacity column if it's added to the interface
  key: keyof Facility | 'Actions' | 'Annual Processing Capacity (tonnes/year)' | 'Facility Name/Site' | 'Operational Status' | 'Key Sources/Notes' | 'capacity_tonnes_per_year';
  label: string;
  defaultVisible: boolean;
}

// Define the columns configuration using correct keys from Facility interface
const columnsConfig: ColumnConfig[] = [
  { key: 'Company', label: 'Company', defaultVisible: true },
  { key: 'Facility Name/Site', label: 'Facility Name/Site', defaultVisible: true },
  { key: 'Location', label: 'Location', defaultVisible: true },
  // Use the new numeric column key and update the label
  { key: 'capacity_tonnes_per_year', label: 'Capacity (t/yr)', defaultVisible: true },
  { key: 'technology_category', label: 'Technology', defaultVisible: true },
  { key: 'Operational Status', label: 'Status', defaultVisible: true },
  { key: 'Latitude', label: 'Latitude', defaultVisible: false },
  { key: 'Longitude', label: 'Longitude', defaultVisible: false },
  // Removed 'Key Sources/Notes' as it's not fetched in the list view
  { key: 'Actions', label: 'Actions', defaultVisible: true },
];


const FacilitiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  // Revert activeFilter to use CanonicalStatus type
  const [activeFilter, setActiveFilter] = useState<CanonicalStatus | 'all'>('all');
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]); // Store all facilities for client-side filtering
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  // Default sort by Company ascending
  const [sortColumn, setSortColumn] = useState<keyof Facility | null>('Company'); // State for sort column
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // State for sort direction
  // No longer need state for availableStatuses
  // const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnsConfig.reduce((acc, col) => {
      if (col.key) {
         // Ensure we don't try to access a key that might not exist (like the old capacity key if removed)
         if (columnsConfig.find(c => c.key === col.key)) {
            acc[col.key] = col.defaultVisible;
         }
      }
      return acc;
    }, {} as Record<string, boolean>)
  );

  // Handler for toggling column visibility
  const handleColumnToggle = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate the number of visible columns for colSpan dynamically
  const visibleColumnCount = columnsConfig.filter(col => {
    if (col.key === 'Actions') {
      return currentUser && visibleColumns[col.key];
    }
    // Check if the key exists in visibleColumns before accessing it
    return col.key && visibleColumns.hasOwnProperty(col.key) && visibleColumns[col.key];
  }).length;



  const { showError, showSuccess } = useToastContext();

  // Centralized fetch function - accepts CanonicalStatus or 'all'
  const fetchFacilitiesData = useCallback(async (filter: CanonicalStatus | 'all') => {
    setLoading(true);
    setError(null);
    try {
      let facilitiesData: Facility[];
      if (filter === 'all') {
        facilitiesData = await getFacilities();
      } else {
        // Need the actual DB status string that maps to the canonical key
        const dbStatusString = STATUS_LABELS[filter];
        facilitiesData = await getFacilitiesByStatus(dbStatusString);
      }
      setFacilities(facilitiesData);
      setAllFacilities(facilitiesData); // Store for client-side filtering
    } catch (err: any) {
      console.error("Error fetching facilities:", err);
      const errorMessage = `Failed to load facilities: ${err.message}`;
      setError(errorMessage);
      showError('Failed to Load Data', errorMessage);
      setFacilities([]);
      setAllFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [showError]); // Dependency removed as it uses the filter argument directly

  // Handle advanced search
  const handleAdvancedSearch = useCallback(async (filters: FacilitySearchFilters) => {
    setIsSearching(true);
    setError(null);
    try {
      const results = await searchFacilities(filters);
      setFacilities(results);
      setActiveFilter('all'); // Reset status filter when using advanced search
    } catch (err: any) {
      console.error("Error searching facilities:", err);
      const errorMessage = `Search failed: ${err.message}`;
      setError(errorMessage);
      showError('Search Failed', errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [showError]);

  // Realtime update handler with type
  const handleRealtimeUpdate = useCallback((payload: RealtimePostgresChangesPayload<Facility>) => {
    console.log('Realtime change received:', payload);
    const { eventType, new: newRecord, old: oldRecord } = payload;

    setFacilities(currentFacilities => {
      let updatedFacilities = [...currentFacilities];
      let facilityMatchesFilter = true;

      switch (eventType) {
        case 'INSERT':
          if (!updatedFacilities.some(f => f.ID === newRecord.ID)) {
            updatedFacilities.push(newRecord as Facility);
          }
          facilityMatchesFilter = activeFilter === 'all' || getCanonicalStatus(newRecord['Operational Status']) === activeFilter;
          break;
        case 'UPDATE':
          const oldCanonicalStatus = oldRecord ? getCanonicalStatus(oldRecord['Operational Status']) : 'unknown';
          const newCanonicalStatus = newRecord ? getCanonicalStatus(newRecord['Operational Status']) : 'unknown';

          updatedFacilities = updatedFacilities.map(f =>
            f.ID === newRecord.ID ? { ...f, ...newRecord } : f
          );

          if (activeFilter !== 'all') {
            facilityMatchesFilter = newCanonicalStatus === activeFilter;
          }
          break;
        case 'DELETE':
           if (oldRecord && 'ID' in oldRecord) {
             updatedFacilities = updatedFacilities.filter(f => f.ID !== oldRecord.ID);
             facilityMatchesFilter = false;
           } else {
             console.warn("Realtime DELETE event received without old record ID:", payload);
             facilityMatchesFilter = false;
           }
          break;
        default:
          console.warn('Unhandled realtime event type:', eventType);
          facilityMatchesFilter = false;
      }

      if ((eventType === 'INSERT' || eventType === 'UPDATE') && !facilityMatchesFilter && activeFilter !== 'all') {
          const indexToRemove = updatedFacilities.findIndex(f => f.ID === newRecord.ID);
          if (indexToRemove > -1) {
              updatedFacilities.splice(indexToRemove, 1);
          }
      }

      return updatedFacilities;
    });
  }, [activeFilter]);

  // Create stable callback references for realtime subscription
  const handleRealtimeInsert = useCallback((payload: RealtimePostgresChangesPayload<Facility>) => {
    handleRealtimeUpdate({ ...payload, eventType: 'INSERT' });
  }, [handleRealtimeUpdate]);

  const handleRealtimeUpdate2 = useCallback((payload: RealtimePostgresChangesPayload<Facility>) => {
    handleRealtimeUpdate({ ...payload, eventType: 'UPDATE' });
  }, [handleRealtimeUpdate]);

  const handleRealtimeDelete = useCallback((payload: RealtimePostgresChangesPayload<Facility>) => {
    handleRealtimeUpdate({ ...payload, eventType: 'DELETE' });
  }, [handleRealtimeUpdate]);

  const handleReconnect = useCallback(() => {
    // Refetch data on reconnection to ensure consistency
    fetchFacilitiesData(activeFilter);
  }, [fetchFacilitiesData, activeFilter]);

  // Use the new realtime subscription hook
  const { connectionState, error: realtimeError, reconnect } = useRealtimeSubscription<Facility>({
    tableName: 'facilities',
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate2,
    onDelete: handleRealtimeDelete,
    onReconnect: handleReconnect,
    enabled: true
  });

  // Set error state based on realtime connection errors
  useEffect(() => {
    if (realtimeError) {
      setError(realtimeError);
    } else if (connectionState === 'connected' && error?.includes('Realtime connection error')) {
      // Clear the error if it was a realtime error and we're now connected
      setError(null);
    }
  }, [realtimeError, connectionState, error]);

  // Fetch facilities data on mount and when filter changes
  useEffect(() => {
    fetchFacilitiesData(activeFilter);
  }, [activeFilter, fetchFacilitiesData]);

  const handleFilterClick = (filter: CanonicalStatus | 'all'): void => {
    setActiveFilter(filter);
  };


  // Use facilities directly since advanced search handles all filtering
  const searchFilteredFacilities = facilities;

  // Sorting Logic
  const sortedFacilities = useMemo(() => {
    if (!sortColumn) return searchFilteredFacilities;

    return [...searchFilteredFacilities].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined values - place them at the end for asc, beginning for desc
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Type-specific comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Fallback comparison (treat as strings)
      const stringA = String(aValue).toLowerCase();
      const stringB = String(bValue).toLowerCase();
      return sortDirection === 'asc'
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });
  }, [searchFilteredFacilities, sortColumn, sortDirection]);


  const handleSort = (columnKey: keyof Facility) => {
    if (sortColumn === columnKey) {
      // If clicking the same column, reverse the direction
      setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      // If clicking a new column, set it and default to ascending
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (columnKey: keyof Facility) => {
    if (sortColumn !== columnKey) {
      return <i className="fas fa-sort ms-1 text-muted"></i>; // Default sort icon
    }
    return sortDirection === 'asc'
      ? <i className="fas fa-sort-up ms-1"></i> // Ascending icon
      : <i className="fas fa-sort-down ms-1"></i>; // Descending icon
  };


  const renderStatusBadge = (statusName: string | undefined | null): React.ReactNode => {
    const canonicalStatus = getCanonicalStatus(statusName);
    const className = `status-badge ${getStatusClass(canonicalStatus)}`;
    const label = statusName || getStatusLabel(canonicalStatus);
    return <span className={className}>{label}</span>;
  };


  const handleDelete = async (facilityId: string): Promise<void> => {
    if (!facilityId) {
      console.error("Delete error: facilityId is missing.");
      showError('Delete Error', 'Cannot delete facility: ID is missing.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      try {
        await deleteFacility(facilityId);
        console.log(`Facility ${facilityId} delete initiated.`);
        // Manually update state immediately for faster UI feedback
        setFacilities(currentFacilities => currentFacilities.filter(f => f.ID !== facilityId));
        showSuccess('Facility Deleted', 'The facility has been successfully deleted.');
      } catch (error: any) {
        console.error(`Error deleting facility ${facilityId}:`, error);
        showError('Delete Failed', `Failed to delete facility: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  // Early return for loading state
  if (loading) {
    return (
      <div className="row mt-4">
        <div className="col-12">
          <LoadingSpinner 
            size="lg" 
            text={`Loading ${activeFilter === 'all' ? 'all' : getStatusLabel(activeFilter)} facilities...`}
            className="justify-content-center"
          />
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error) {
    const isRealtimeError = error.includes('Connection error') || error.includes('Realtime');
    
    return (
      <div className="row mt-4">
        <div className="col-12">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Error Loading Facilities
            </h4>
            <p className="mb-3">{error}</p>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-danger"
                onClick={() => fetchFacilitiesData(activeFilter)}
              >
                <i className="fas fa-redo me-1"></i>
                Reload Data
              </button>
              {isRealtimeError && connectionState === 'error' && (
                <button 
                  className="btn btn-outline-warning"
                  onClick={reconnect}
                >
                  <i className="fas fa-plug me-1"></i>
                  Reconnect Live Updates
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="facilities-page">
      <div className="row mt-4 fade-in">
        <div className="col-12">
        {/* Advanced Search and Filter Component */}
        <AdvancedSearchFilter 
          onSearch={handleAdvancedSearch}
          isSearching={isSearching}
          resultCount={sortedFacilities.length}
        />
        
        <div className="facilities-list">
          {/* Add New Facility Button and Column Toggle */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <div className="d-flex align-items-center">
              {/* Connection Status Indicator */}
              <div className={`badge ${
                connectionState === 'connected' ? 'bg-success' : 
                connectionState === 'error' ? 'bg-danger' : 
                connectionState === 'connecting' ? 'bg-warning' : 
                'bg-secondary'
              } me-2`}>
                <i className={`fas ${
                  connectionState === 'connected' ? 'fa-check-circle' : 
                  connectionState === 'error' ? 'fa-exclamation-circle' : 
                  connectionState === 'connecting' ? 'fa-spinner fa-spin' : 
                  'fa-times-circle'
                } me-1`}></i>
                {connectionState === 'connected' ? 'Live Updates Active' : 
                 connectionState === 'error' ? 'Connection Error' : 
                 connectionState === 'connecting' ? 'Connecting...' : 
                 'Disconnected'}
              </div>
            </div>
            <div className="d-flex align-items-center">
                {/* Column Visibility Dropdown */}
                <div className="dropdown me-2">
                  <button className="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" id="columnToggleDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fas fa-columns me-1"></i> Columns
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="columnToggleDropdown">
                    {columnsConfig.map(col => (
                      // Exclude the old text capacity column from the toggle list
                      col.key !== 'Annual Processing Capacity (tonnes/year)' && (col.key !== 'Actions' || !currentUser) && (
                        <li key={col.key}>
                          <div className="dropdown-item">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`col-toggle-${col.key}`}
                                checked={visibleColumns[col.key] ?? false}
                                onChange={() => handleColumnToggle(col.key)}
                              />
                              <label className="form-check-label" htmlFor={`col-toggle-${col.key}`}>
                                {col.label}
                              </label>
                            </div>
                          </div>
                        </li>
                      )
                    ))}
                  </ul>
                </div>
                {/* Add New Facility Button */}
                {currentUser && (
                  <button className="btn btn-success btn-sm" onClick={() => navigate('/facilities/new')}>
                      <i className="fas fa-plus me-1"></i> Add New Facility
                  </button>
                )}
              </div>
           </div>

           {/* Display error message if fetching failed */}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Facilities Table */}
          <div className="table-responsive">
            <table className="table table-hover facilities-table">
              <thead className="table-light">
                <tr>
                  {/* Render headers based on visibility and add sorting */}
                  {columnsConfig.map(col => {
                    // Exclude the old text capacity column header and non-sortable columns like Actions
                    if (col.key === 'Annual Processing Capacity (tonnes/year)' || !visibleColumns.hasOwnProperty(col.key) || !visibleColumns[col.key] || (col.key === 'Actions' && !currentUser)) {
                      return null;
                    }

                    // Check if the column is sortable (exclude 'Actions')
                    const isSortable = col.key !== 'Actions'; // Add other non-sortable keys if needed

                    return (
                      <th
                        key={col.key}
                        onClick={isSortable ? () => handleSort(col.key as keyof Facility) : undefined}
                        style={isSortable ? { cursor: 'pointer' } : {}}
                        className={isSortable ? 'sortable-header' : ''}
                      >
                        {col.label}
                        {isSortable && renderSortIcon(col.key as keyof Facility)}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center p-5">
                      <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </td>
                  </tr>
                ) : !error && sortedFacilities.length === 0 ? ( // Use sortedFacilities here
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center text-muted p-4">
                      No facilities found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  sortedFacilities.map(facility => ( // Use sortedFacilities here
                    <tr key={facility.ID}>
                      {/* Render cells based on visibility */}
                      {columnsConfig.map(col => {
                        // Skip old text capacity column and hidden columns
                        if (col.key === 'Annual Processing Capacity (tonnes/year)' || !visibleColumns.hasOwnProperty(col.key) || !visibleColumns[col.key]) return null;

                        if (col.key === 'Actions') {
                          return currentUser ? (
                            <td key={col.key} className="text-end">
                              <button
                                className="btn btn-sm btn-outline-danger delete-button me-1"
                                onClick={() => handleDelete(facility.ID)}
                                title="Delete Facility"
                              >
                                <i className="fas fa-trash-alt"></i>
                              </button>
                              <Link
                                to={`/facilities/${facility.ID}`}
                                state={{ activeTab: 'overview' }}
                                className="btn btn-sm btn-outline-primary"
                                title="Edit Facility"
                              >
                                <i className="fas fa-edit"></i>
                              </Link>
                            </td>
                          ) : null;
                        }

                        // Use specific key type assertion for safety
                        let cellContent: React.ReactNode = facility[col.key as keyof Omit<Facility, 'ID' | 'Annual Processing Capacity (tonnes/year)'>] ?? 'N/A';
                        let cellClass = '';

                        if (col.key === 'Company') {
                          cellContent = <Link to={`/facilities/${facility.ID}`} className="fw-bold">{facility.Company || 'N/A'}</Link>;
                        } else if (col.key === 'Location') {
                          cellClass = "text-muted";
                        // Use the new numeric column for display and formatting
                        } else if (col.key === 'capacity_tonnes_per_year') {
                          cellContent = facility.capacity_tonnes_per_year?.toLocaleString() ?? 'N/A';
                        } else if (col.key === 'Operational Status') {
                          cellContent = renderStatusBadge(facility["Operational Status"]);
                        }
                        // Removed rendering logic for 'Key Sources/Notes'

                        return <td key={col.key} className={cellClass}>{cellContent}</td>;
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default FacilitiesPage;
