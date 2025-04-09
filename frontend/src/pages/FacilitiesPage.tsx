// frontend/src/pages/FacilitiesPage.tsx
import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
// Import the function to get distinct statuses - NO LONGER NEEDED FOR TABS
import { getFacilities, getFacilitiesByStatus, deleteFacility, Facility /*, getDistinctOperationalStatuses */ } from '../supabaseDataService';
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
  key: keyof Facility | 'Actions' | 'Annual Processing Capacity (tonnes/year)' | 'Facility Name/Site' | 'Primary Recycling Technology' | 'Operational Status' | 'Key Sources/Notes' | 'capacity_tonnes_per_year';
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
  { key: 'Primary Recycling Technology', label: 'Primary Technology', defaultVisible: true },
  { key: 'technology_category', label: 'Technology', defaultVisible: true },
  { key: 'Operational Status', label: 'Status', defaultVisible: true },
  { key: 'Latitude', label: 'Latitude', defaultVisible: false },
  { key: 'Longitude', label: 'Longitude', defaultVisible: false },
  { key: 'Key Sources/Notes', label: 'Sources/Notes', defaultVisible: false },
  { key: 'Actions', label: 'Actions', defaultVisible: true },
];


const FacilitiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  // Revert activeFilter to use CanonicalStatus type
  const [activeFilter, setActiveFilter] = useState<CanonicalStatus | 'all'>('all');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err: any) {
      console.error("Error fetching facilities:", err);
      setError(`Failed to load facilities: ${err.message}`);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, []); // Dependency removed as it uses the filter argument directly

  // Realtime update handler with type
  const handleRealtimeUpdate = (payload: RealtimePostgresChangesPayload<Facility>) => {
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
  };

  // Initial fetch and Realtime subscription setup
  useEffect(() => {
    fetchFacilitiesData(activeFilter);

    const channel = supabase
      .channel('public:facilities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'facilities' },
        (payload: RealtimePostgresChangesPayload<Facility>) => handleRealtimeUpdate(payload)
      )
      .subscribe((status: string, err?: Error) => {
         if (status === 'SUBSCRIBED') {
           console.log('Subscribed to facilities changes!');
         }
         if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
           console.error(`Realtime subscription error: ${status}`, err);
           setError(`Realtime connection error: ${err?.message || status}. Data may not be live.`);
         }
      });

    return () => {
      console.log('Unsubscribing from facilities changes.');
      supabase.removeChannel(channel);
    };
  }, [activeFilter, fetchFacilitiesData]);

  const handleFilterClick = (filter: CanonicalStatus | 'all'): void => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const searchFilteredFacilities = facilities.filter(facility => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;

    const company = facility.Company?.toLowerCase() || '';
    const location = facility.Location?.toLowerCase() || '';
    const category = facility.technology_category?.toLowerCase() || '';
    const facilityName = facility["Facility Name/Site"]?.toLowerCase() || '';

    return company.includes(term) || location.includes(term) || category.includes(term) || facilityName.includes(term);
  });

  const renderStatusBadge = (statusName: string | undefined | null): React.ReactNode => {
    const canonicalStatus = getCanonicalStatus(statusName);
    const className = `status-badge ${getStatusClass(canonicalStatus)}`;
    const label = statusName || getStatusLabel(canonicalStatus);
    return <span className={className}>{label}</span>;
  };


  const handleDelete = async (facilityId: string): Promise<void> => {
    if (!facilityId) {
        console.error("Delete error: facilityId is missing.");
        alert('Cannot delete facility: ID is missing.');
        return;
    }
    if (window.confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      try {
        await deleteFacility(facilityId);
        console.log(`Facility ${facilityId} delete initiated.`);
      } catch (error: any) {
        console.error(`Error deleting facility ${facilityId}:`, error);
        alert(`Failed to delete facility: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  return (
    <div className="row mt-4 fade-in">
      <div className="col-12">
        <div className="facilities-list">
          {/* Tabs Container - Use VALID_CANONICAL_STATUSES */}
          <div className="tabs-container d-flex flex-wrap justify-content-center mb-3">
            <button
              key="all"
              className={`tab-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              All
            </button>
            {VALID_CANONICAL_STATUSES.map(filterKey => (
                 <button
                    key={filterKey}
                    className={`tab-button ${activeFilter === filterKey ? 'active' : ''}`}
                    onClick={() => handleFilterClick(filterKey)}
                 >
                    {getStatusLabel(filterKey)}
                 </button>
            ))}
          </div>

          {/* Add New Facility Button, Search, and Column Toggle */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
             <div className="input-group search-bar me-2 mb-2 mb-md-0" style={{ maxWidth: '300px' }}>
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                 <input
                     type="text"
                     className="form-control form-control-sm"
                     placeholder="Search company, location, category..."
                     value={searchTerm}
                     onChange={handleSearchChange}
                 />
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
                  {/* Render headers based on visibility */}
                  {columnsConfig.map(col => (
                    // Exclude the old text capacity column header
                    col.key !== 'Annual Processing Capacity (tonnes/year)' &&
                    visibleColumns.hasOwnProperty(col.key) && visibleColumns[col.key] && (col.key !== 'Actions' || currentUser)
                      ? <th key={col.key}>{col.label}</th>
                      : null
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center p-5">
                      <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </td>
                  </tr>
                ) : !error && searchFilteredFacilities.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center text-muted p-4">
                      No facilities found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  searchFilteredFacilities.map(facility => (
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
                        } else if (col.key === 'Key Sources/Notes') {
                          const notes = facility["Key Sources/Notes"];
                          cellContent = (notes || 'N/A').substring(0, 50) + (notes && notes.length > 50 ? '...' : '');
                          return <td key={col.key} title={notes || ''}>{cellContent}</td>;
                        }

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
  );
}

export default FacilitiesPage;
