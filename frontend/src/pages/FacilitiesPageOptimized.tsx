// frontend/src/pages/FacilitiesPageOptimized.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Facility, getFacilities, deleteFacility } from '../services';
import VirtualizedFacilityList from '../components/VirtualizedFacilityList';
import AdvancedSearchFilter from '../components/AdvancedSearchFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import './FacilitiesPage.css';

// Pagination configuration
const ITEMS_PER_PAGE = 50;
const VIRTUALIZED_HEIGHT = 600;
const ROW_HEIGHT = 120;

const FacilitiesPageOptimized: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSuccess, showError, showWarning } = useToastContext();

  // State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [displayedFacilities, setDisplayedFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Facility | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'grid'>('list');

  // Fetch facilities
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFacilities();
        
        if (data && data.length > 0) {
          setFacilities(data);
          setFilteredFacilities(data);
          // Initially display first page
          setDisplayedFacilities(data.slice(0, ITEMS_PER_PAGE));
          setHasMore(data.length > ITEMS_PER_PAGE);
          showSuccess('Facilities loaded successfully', `Found ${data.length} facilities`);
        } else {
          showWarning('No facilities found', 'The database appears to be empty');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Error fetching facilities:', err);
        setError(`Failed to load facilities: ${errorMessage}`);
        showError('Failed to load facilities', errorMessage);
        setFacilities([]);
        setFilteredFacilities([]);
        setDisplayedFacilities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [showSuccess, showError, showWarning]);

  // Load more facilities for infinite scroll
  const loadMoreFacilities = useCallback(async () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const nextPage = currentPage + 1;
        const startIndex = nextPage * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const nextBatch = filteredFacilities.slice(startIndex, endIndex);
        
        if (nextBatch.length > 0) {
          setDisplayedFacilities(prev => [...prev, ...nextBatch]);
          setCurrentPage(nextPage);
          setHasMore(endIndex < filteredFacilities.length);
        } else {
          setHasMore(false);
        }
        resolve();
      }, 300); // Simulate network delay
    });
  }, [currentPage, filteredFacilities]);

  // Handle advanced search
  const handleAdvancedSearch = useCallback((searchParams: any) => {
    setIsSearching(true);
    
    try {
      let results = [...facilities];
      
      // Apply filters based on searchParams
      if (searchParams.searchTerm) {
        const term = searchParams.searchTerm.toLowerCase();
        results = results.filter(facility =>
          facility.Company?.toLowerCase().includes(term) ||
          facility['Facility Name/Site']?.toLowerCase().includes(term) ||
          facility.Location?.toLowerCase().includes(term) ||
          facility['Primary Recycling Technology']?.toLowerCase().includes(term)
        );
      }
      
      if (searchParams.statuses?.length > 0) {
        results = results.filter(facility =>
          searchParams.statuses.includes(facility['Operational Status'])
        );
      }
      
      if (searchParams.technologies?.length > 0) {
        results = results.filter(facility =>
          searchParams.technologies.includes(facility['Primary Recycling Technology'])
        );
      }
      
      if (searchParams.technologyCategories?.length > 0) {
        results = results.filter(facility =>
          searchParams.technologyCategories.includes(facility.technology_category)
        );
      }
      
      if (searchParams.capacityMin !== undefined) {
        results = results.filter(facility =>
          facility.capacity_tonnes_per_year !== null && 
          facility.capacity_tonnes_per_year >= searchParams.capacityMin
        );
      }
      
      if (searchParams.capacityMax !== undefined) {
        results = results.filter(facility =>
          facility.capacity_tonnes_per_year !== null && 
          facility.capacity_tonnes_per_year <= searchParams.capacityMax
        );
      }
      
      if (searchParams.hasCoordinates !== undefined) {
        results = results.filter(facility =>
          searchParams.hasCoordinates ? 
            (facility.Latitude !== null && facility.Longitude !== null) :
            (facility.Latitude === null || facility.Longitude === null)
        );
      }
      
      setFilteredFacilities(results);
      setDisplayedFacilities(results.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(0);
      setHasMore(results.length > ITEMS_PER_PAGE);
      
      showSuccess('Search completed', `Found ${results.length} facilities`);
    } catch (err) {
      showError('Search failed', 'An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  }, [facilities, showSuccess, showError]);

  // Sort facilities
  const sortedFacilities = useMemo(() => {
    if (!sortConfig.key) return displayedFacilities;
    
    const sorted = [...displayedFacilities].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
    
    return sorted;
  }, [displayedFacilities, sortConfig]);

  // Handle sort
  const handleSort = useCallback((key: keyof Facility) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Handle facility click
  const handleFacilityClick = useCallback((facility: Facility) => {
    navigate(`/facilities/${facility.ID}`);
  }, [navigate]);

  // Handle edit click
  const handleEditClick = useCallback((facility: Facility) => {
    navigate(`/facilities/edit/${facility.ID}`);
  }, [navigate]);

  // Handle delete click
  const handleDeleteClick = useCallback(async (facility: Facility) => {
    if (!window.confirm(`Are you sure you want to delete the facility "${facility.Company}"?`)) {
      return;
    }
    
    try {
      await deleteFacility(facility.ID);
      
      // Update state
      setFacilities(prev => prev.filter(f => f.ID !== facility.ID));
      setFilteredFacilities(prev => prev.filter(f => f.ID !== facility.ID));
      setDisplayedFacilities(prev => prev.filter(f => f.ID !== facility.ID));
      
      showSuccess('Facility deleted', `${facility.Company} has been removed`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showError('Delete failed', errorMessage);
    }
  }, [showSuccess, showError]);

  // Render loading state
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading facilities..." />;
  }

  // Render error state
  if (error && facilities.length === 0) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Facilities</h4>
          <p>{error}</p>
          <hr />
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            <i className="fas fa-redo me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4 facilities-page-optimized">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <h1 className="page-title">
          <i className="fas fa-battery-full me-2 text-primary"></i>
          Lithium Battery Recycling Facilities
        </h1>
        
        <div className="d-flex gap-2 align-items-center">
          {/* View Mode Toggle */}
          <div className="btn-group" role="group" aria-label="View mode">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
            >
              <i className="fas fa-list"></i>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
              disabled
            >
              <i className="fas fa-th"></i>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              title="Table view"
              disabled
            >
              <i className="fas fa-table"></i>
            </button>
          </div>
          
          {/* Filter Toggle */}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="advanced-filters"
          >
            <i className={`fas fa-filter me-1`}></i>
            Filters
            {filteredFacilities.length !== facilities.length && (
              <span className="badge bg-primary ms-1">{filteredFacilities.length}</span>
            )}
          </button>
          
          {/* Add New Facility */}
          {currentUser && (
            <button 
              className="btn btn-success btn-sm"
              onClick={() => navigate('/facilities/new')}
            >
              <i className="fas fa-plus me-1"></i>
              Add New Facility
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary mb-3">
        <p className="text-muted mb-0">
          Showing {displayedFacilities.length} of {filteredFacilities.length} facilities
          {filteredFacilities.length !== facilities.length && (
            <span> (filtered from {facilities.length} total)</span>
          )}
        </p>
      </div>

      {/* Advanced Search Filters */}
      {showFilters && (
        <div id="advanced-filters" className="mb-4">
          <AdvancedSearchFilter
            facilities={facilities}
            onSearch={handleAdvancedSearch}
            isSearching={isSearching}
            resultCount={filteredFacilities.length}
          />
        </div>
      )}

      {/* Virtualized Facility List */}
      <div className="facilities-content">
        {viewMode === 'list' && (
          <VirtualizedFacilityList
            facilities={sortedFacilities}
            onFacilityClick={handleFacilityClick}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
            isAuthenticated={!!currentUser}
            isLoading={isSearching}
            hasMore={hasMore}
            loadMore={loadMoreFacilities}
            height={VIRTUALIZED_HEIGHT}
            itemHeight={ROW_HEIGHT}
          />
        )}
        
        {viewMode === 'grid' && (
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Grid view coming soon...
          </div>
        )}
        
        {viewMode === 'table' && (
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            Table view coming soon...
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesPageOptimized;