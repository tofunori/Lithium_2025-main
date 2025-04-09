// frontend/src/pages/FacilitiesPage.tsx
import React, { useState, useEffect, ChangeEvent, useCallback } from 'react'; // Added useCallback
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// UPDATED: Import Facility from supabaseDataService
import { getFacilities, getFacilitiesByStatus, deleteFacility, Facility } from '../supabaseDataService'; // Changed FacilityData to Facility
// REMOVED: import { User } from 'firebase/auth';
import {
  CanonicalStatus,
  getCanonicalStatus,
  getStatusLabel,
  getStatusClass,
  VALID_CANONICAL_STATUSES
} from '../utils/statusUtils'; // Import status utilities
import './FacilitiesPage.css';

// Removed local FacilityStatus type

const FacilitiesPage: React.FC = () => {
  // UPDATED: Removed explicit User type annotation
  const { currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState<CanonicalStatus | 'all'>('all'); // Use CanonicalStatus
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [facilities, setFacilities] = useState<Facility[]>([]); // UPDATED: Use Facility[] type
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Add error state

  // Centralized fetch function
  const fetchFacilitiesData = useCallback(async (filter: CanonicalStatus | 'all') => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      let facilitiesData: Facility[]; // UPDATED: Use Facility[] type
      if (filter === 'all') {
        facilitiesData = await getFacilities();
      } else {
        // getFacilitiesByStatus now filters on status_name and returns Facility[]
        facilitiesData = await getFacilitiesByStatus(filter); // Pass canonical status key directly
      }
      setFacilities(facilitiesData);
    } catch (err: any) {
      console.error("Error fetching facilities:", err);
      setError(`Failed to load facilities: ${err.message}`); // Set error message
      setFacilities([]); // Clear facilities on error
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, fetch logic is self-contained

  // Initial fetch on mount
  useEffect(() => {
    fetchFacilitiesData('all');
  }, [fetchFacilitiesData]);

  const handleFilterClick = (filter: CanonicalStatus | 'all'): void => { // Use CanonicalStatus
    setActiveFilter(filter);
    fetchFacilitiesData(filter); // Fetch data based on the new filter
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    // Filtering is now done directly on the `facilities` state in the return statement
  };

  // Filter facilities based on searchTerm (status filtering is handled by fetch)
  const filteredFacilities = facilities.filter(facility => {
    const term = searchTerm.toLowerCase();
    if (!term) return true; // No search term, show all (fetched) facilities

    // Use correct DB column names for searching
    const company = facility.Company?.toLowerCase() || '';
    const location = facility.Location?.toLowerCase() || ''; // Use DB Location column
    // const city = facility.city?.toLowerCase() || ''; // city is not a direct DB column based on logs
    // const region = facility.region_name?.toLowerCase() || ''; // region_name is not a direct DB column
    // const country = facility.country_name?.toLowerCase() || ''; // country_name is not a direct DB column
    const technology = facility["Primary Recycling Technology"]?.toLowerCase() || ''; // Use DB column name

    // Adjust search logic based on available columns
    return company.includes(term) || location.includes(term) || technology.includes(term);
  });

  // Function to render the status badge using statusUtils
  // Use correct DB column name "Operational Status"
  const renderStatusBadge = (statusName: string | undefined | null): React.ReactNode => {
    const canonicalStatus = getCanonicalStatus(statusName); // Pass the status name from the DB column
    const className = `status-badge ${getStatusClass(canonicalStatus)}`; // Combine base class with specific class
    const label = getStatusLabel(canonicalStatus);

    // Return null or an empty fragment if the status is 'unknown' and shouldn't be displayed,
    // or handle 'unknown' display specifically if needed. Here, we display it.
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
        // Call Supabase version (no change needed here)
        await deleteFacility(facilityId);
        // Update the state to remove the deleted facility immediately
        // Use uppercase ID for filtering
        setFacilities(prevFacilities => prevFacilities.filter(f => f.ID !== facilityId));
        console.log(`Facility ${facilityId} deleted successfully.`);
        // Optionally show a success message
        // alert('Facility deleted successfully.');
      } catch (error: any) {
        console.error(`Error deleting facility ${facilityId}:`, error);
        // Optionally, show an error message to the user
        alert(`Failed to delete facility: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  };

  return (
    <div className="row mt-4 fade-in"> {/* Added fade-in */}
      <div className="col-12">
        <div className="facilities-list">
          {/* Tabs Container */}
          <div className="tabs-container d-flex flex-wrap justify-content-center mb-3">
            {/* Add 'all' button separately */}
            <button
              key="all"
              className={`tab-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              All
            </button>
            {/* Map through valid canonical statuses */}
            {VALID_CANONICAL_STATUSES.map(filterKey => (
                 <button
                    key={filterKey}
                    className={`tab-button ${activeFilter === filterKey ? 'active' : ''}`}
                    onClick={() => handleFilterClick(filterKey)}
                 >
                    {getStatusLabel(filterKey)} {/* Use utility function for label */}
                 </button>
            ))}
          </div>

          {/* Add New Facility Button and Search */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
             <div className="input-group search-bar me-2 mb-2 mb-md-0" style={{ maxWidth: '300px' }}>
                <span className="input-group-text"><i className="fas fa-search"></i></span>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search company, location, method..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
             </div>
             {currentUser && (
                <button className="btn btn-success btn-sm" onClick={() => navigate('/facilities/new')}>
                    <i className="fas fa-plus me-1"></i> Add New Facility
                </button>
             )}
          </div>

          {/* Display error message if fetching failed */}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Column Headers */}
          <div className="facility-list-header d-none d-md-flex mb-2">
            <span className="col-company">Company</span>
            <span className="col-location">Location</span>
            <span className="col-volume">Volume (tons/year)</span>
            <span className="col-method method-column">Method</span>
            <span className="col-status">Status</span>
            {currentUser && <span className="col-actions actions-column">Actions</span>}
          </div>

          {/* Facilities List */}
          <div id="facilitiesList">
            {loading ? (
              <div className="text-center p-5"><i className="fas fa-spinner fa-spin fa-2x"></i></div>
            ) : !error && filteredFacilities.length === 0 ? ( // Check for error before showing "No facilities"
              <p className="text-center text-muted mt-4">No facilities found matching your criteria.</p>
            ) : (
              filteredFacilities.map(facility => (
                // Use uppercase ID for key and links
                <div key={facility.ID} className="facility-item card mb-2 shadow-sm">
                  <div className="facility-item-content card-body d-md-flex align-items-center">
                    <span className="col-company mb-1 mb-md-0">
                      <Link to={`/facilities/${facility.ID}`} className="fw-bold">{facility.Company || 'N/A'}</Link> {/* Use Company */}
                    </span>
                    <span className="col-location mb-1 mb-md-0 text-muted">{facility.Location || 'N/A'}</span> {/* Use Location */}
                    <span className="col-volume mb-1 mb-md-0">{facility["Annual Processing Capacity (tonnes/year)"] ?? 'N/A'}</span> {/* Use DB name */}
                    <span className="col-method method-column mb-1 mb-md-0">{facility["Primary Recycling Technology"] || 'N/A'}</span> {/* Use DB name */}
                    <span className="col-status mb-1 mb-md-0">
                      {renderStatusBadge(facility["Operational Status"])} {/* Use DB name */}
                    </span>
                    {currentUser && (
                        <span className="col-actions actions-column text-end">
                            <button
                                className="btn btn-sm btn-outline-danger delete-button"
                                onClick={() => handleDelete(facility.ID)} // Pass uppercase ID
                                title="Delete Facility"
                            >
                                <i className="fas fa-trash-alt"></i>
                            </button>
                             <Link
                                to={`/facilities/${facility.ID}`} // Use uppercase ID
                                state={{ activeTab: 'overview' }}
                                className="btn btn-sm btn-outline-primary ms-1"
                                title="Edit Facility"
                            >
                                <i className="fas fa-edit"></i>
                            </Link>
                        </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacilitiesPage;
