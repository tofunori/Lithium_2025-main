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
  CanonicalStatus,
  getCanonicalStatus,
  getStatusLabel,
  STATUS_LABELS,
  getStatusClass,
  VALID_CANONICAL_STATUSES
} from '../utils/statusUtils';
import './FacilitiesPage.css';

interface ColumnConfig {
  key: keyof Facility | 'Actions' | 'Annual Processing Capacity (tonnes/year)' | 'Facility Name/Site' | 'Operational Status' | 'Key Sources/Notes' | 'capacity_tonnes_per_year';
  label: string;
  defaultVisible: boolean;
}

const columnsConfig: ColumnConfig[] = [
  { key: 'Company', label: 'Company', defaultVisible: true },
  { key: 'Facility Name/Site', label: 'Facility Name/Site', defaultVisible: true },
  { key: 'Location', label: 'Location', defaultVisible: true },
  { key: 'capacity_tonnes_per_year', label: 'Capacity (t/yr)', defaultVisible: true },
  { key: 'technology_category', label: 'Technology', defaultVisible: true },
  { key: 'Operational Status', label: 'Status', defaultVisible: true },
  { key: 'Latitude', label: 'Latitude', defaultVisible: false },
  { key: 'Longitude', label: 'Longitude', defaultVisible: false },
  { key: 'Actions', label: 'Actions', defaultVisible: true },
];

const FacilitiesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<CanonicalStatus | 'all'>('all');
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResultCount, setSearchResultCount] = useState<number | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const { showToast } = useToastContext();
  
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columnsConfig.filter(col => col.defaultVisible).map(col => col.key as string))
  );
  
  const [currentFilters, setCurrentFilters] = useState<FacilitySearchFilters | null>(null);

  const loadFacilities = useCallback(async (statusFilter: CanonicalStatus | 'all' = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      let data: Facility[];
      
      if (statusFilter === 'all') {
        data = await getFacilities();
      } else {
        const statusLabelsToFetch = Object.keys(STATUS_LABELS).filter(canonicalKey => {
          return canonicalKey === statusFilter;
        }).map(canonicalKey => STATUS_LABELS[canonicalKey as CanonicalStatus]);
        
        data = await getFacilitiesByStatus(statusLabelsToFetch);
      }
      
      setFacilities(data);
      setSearchResultCount(undefined);
      setCurrentFilters(null);
    } catch (err) {
      console.error('Error loading facilities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load facilities');
      showToast('Failed to load facilities', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleSearch = useCallback(async (filters: FacilitySearchFilters) => {
    try {
      setIsSearching(true);
      setError(null);
      
      const results = await searchFacilities(filters);
      setFacilities(results);
      setSearchResultCount(results.length);
      setCurrentFilters(filters);
      setActiveFilter('all');
    } catch (err) {
      console.error('Error searching facilities:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      showToast('Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  }, [showToast]);

  const handleTabClick = useCallback((filter: CanonicalStatus | 'all') => {
    if (filter !== activeFilter) {
      setActiveFilter(filter);
      loadFacilities(filter);
    }
  }, [activeFilter, loadFacilities]);

  const handleDeleteFacility = useCallback(async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) {
      return;
    }

    try {
      await deleteFacility(id);
      showToast('Facility deleted successfully', 'success');
      
      if (currentFilters) {
        handleSearch(currentFilters);
      } else {
        loadFacilities(activeFilter);
      }
    } catch (error) {
      console.error('Error deleting facility:', error);
      showToast('Failed to delete facility', 'error');
    }
  }, [activeFilter, currentFilters, handleSearch, loadFacilities, showToast]);

  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    console.log('Realtime change:', payload);
    
    if (currentFilters) {
      handleSearch(currentFilters);
    } else {
      loadFacilities(activeFilter);
    }
  }, [activeFilter, currentFilters, handleSearch, loadFacilities]);

  useRealtimeSubscription('facilities_master', handleRealtimeChange);

  useEffect(() => {
    loadFacilities(activeFilter);
  }, []);

  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const sortedFacilities = useMemo(() => {
    if (!sortConfig) return facilities;

    return [...facilities].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Facility];
      const bValue = b[sortConfig.key as keyof Facility];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [facilities, sortConfig]);

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <i className="fas fa-sort text-muted ms-1"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up text-primary ms-1"></i>
      : <i className="fas fa-sort-down text-primary ms-1"></i>;
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const getColumnValue = (facility: Facility, columnKey: string): any => {
    switch (columnKey) {
      case 'Facility Name/Site':
        return facility['Facility Name/Site'] || facility.facility_name || 'Unknown';
      case 'Annual Processing Capacity (tonnes/year)':
        return facility.capacity_tonnes_per_year || facility['Annual Processing Capacity (tonnes/year)'] || 'Unknown';
      case 'capacity_tonnes_per_year':
        const capacity = facility.capacity_tonnes_per_year;
        return capacity ? `${capacity.toLocaleString()}` : 'Unknown';
      case 'Operational Status':
        return facility['Operational Status'] || 'Unknown';
      default:
        return facility[columnKey as keyof Facility] || 'Unknown';
    }
  };

  const formatValue = (value: any, columnKey: string): string => {
    if (value === null || value === undefined || value === '') {
      return 'Unknown';
    }
    
    if (columnKey === 'capacity_tonnes_per_year' && typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  const statusCounts = useMemo(() => {
    const counts: Record<CanonicalStatus | 'all', number> = {
      all: facilities.length,
      operating: 0,
      construction: 0,
      planned: 0,
      closed: 0,
      unknown: 0
    };

    facilities.forEach(facility => {
      const canonicalStatus = getCanonicalStatus(facility['Operational Status']);
      counts[canonicalStatus]++;
    });

    return counts;
  }, [facilities]);

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <LoadingSpinner size="lg" text="Loading facilities..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Facilities</h4>
          <p>{error}</p>
          <button 
            className="btn btn-outline-danger" 
            onClick={() => loadFacilities(activeFilter)}
          >
            <i className="fas fa-retry me-2"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const visibleColumnsArray = columnsConfig.filter(col => visibleColumns.has(col.key as string));

  return (
    <div className="facilities-page">
      <AdvancedSearchFilter 
        onSearch={handleSearch}
        isSearching={isSearching}
        resultCount={searchResultCount}
      />
      
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="mb-0">Lithium Battery Recycling Facilities</h2>
                <p className="text-muted mb-0">
                  {searchResultCount !== undefined 
                    ? `${searchResultCount} search results`
                    : `${facilities.length} total facilities`
                  }
                </p>
              </div>
              
              <div className="d-flex gap-2">
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-secondary dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-columns me-2"></i>
                    Columns
                  </button>
                  <ul className="dropdown-menu">
                    {columnsConfig.map(column => (
                      <li key={column.key as string}>
                        <button 
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => toggleColumnVisibility(column.key as string)}
                        >
                          <i className={`fas ${visibleColumns.has(column.key as string) ? 'fa-check-square' : 'fa-square'} me-2`}></i>
                          {column.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {currentUser && (
                  <Link to="/facilities/new" className="btn btn-primary">
                    <i className="fas fa-plus me-2"></i>
                    Add Facility
                  </Link>
                )}
              </div>
            </div>

            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabClick('all')}
                >
                  All <span className="badge bg-secondary ms-1">{statusCounts.all}</span>
                </button>
              </li>
              {VALID_CANONICAL_STATUSES.map(status => (
                <li key={status} className="nav-item">
                  <button
                    className={`nav-link ${activeFilter === status ? 'active' : ''}`}
                    onClick={() => handleTabClick(status)}
                  >
                    {getStatusLabel(status)} <span className="badge bg-secondary ms-1">{statusCounts[status]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        {visibleColumnsArray.map(column => (
                          <th 
                            key={column.key as string}
                            className={column.key !== 'Actions' ? 'sortable-header' : ''}
                            onClick={column.key !== 'Actions' ? () => handleSort(column.key as string) : undefined}
                            style={{ cursor: column.key !== 'Actions' ? 'pointer' : 'default' }}
                          >
                            {column.label}
                            {column.key !== 'Actions' && getSortIcon(column.key as string)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFacilities.length === 0 ? (
                        <tr>
                          <td colSpan={visibleColumnsArray.length} className="text-center py-5 text-muted">
                            <i className="fas fa-search fa-3x mb-3 d-block"></i>
                            {searchResultCount !== undefined ? 'No facilities match your search criteria.' : 'No facilities found.'}
                          </td>
                        </tr>
                      ) : (
                        sortedFacilities.map((facility, index) => (
                          <tr key={facility.id || index}>
                            {visibleColumnsArray.map(column => (
                              <td key={`${facility.id || index}-${column.key}`}>
                                {column.key === 'Actions' ? (
                                  <div className="btn-group btn-group-sm">
                                    <Link
                                      to={`/facilities/${facility.id}`}
                                      className="btn btn-outline-primary"
                                      title="View details"
                                    >
                                      <i className="fas fa-eye"></i>
                                    </Link>
                                    {currentUser && (
                                      <>
                                        <Link
                                          to={`/facilities/${facility.id}/edit`}
                                          className="btn btn-outline-secondary"
                                          title="Edit facility"
                                        >
                                          <i className="fas fa-edit"></i>
                                        </Link>
                                        <button
                                          className="btn btn-outline-danger"
                                          onClick={() => handleDeleteFacility(facility.id!)}
                                          title="Delete facility"
                                        >
                                          <i className="fas fa-trash"></i>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : column.key === 'Operational Status' ? (
                                  <span className={`badge ${getStatusClass(getCanonicalStatus(getColumnValue(facility, column.key as string)))}`}>
                                    {formatValue(getColumnValue(facility, column.key as string), column.key as string)}
                                  </span>
                                ) : (
                                  formatValue(getColumnValue(facility, column.key as string), column.key as string)
                                )}
                              </td>
                            ))}
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
      </div>
    </div>
  );
};

export default FacilitiesPage;
