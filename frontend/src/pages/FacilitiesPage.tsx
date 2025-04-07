import React, { useState, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.jsx is renamed or doesn't need extension
import { getFacilities, getFacilitiesByStatus, deleteFacility, FacilityData } from '../firebase'; // Import FacilityData type
import { User } from 'firebase/auth'; // Import User type
import './FacilitiesPage.css';

// Define possible status values explicitly
type FacilityStatus = 'all' | 'operating' | 'construction' | 'planned' | 'pilot' | 'unknown';

const FacilitiesPage: React.FC = () => {
  // Type the user from context
  const { currentUser }: { currentUser: User | null } = useAuth(); // Renamed user to currentUser to match context provider
  const [activeFilter, setActiveFilter] = useState<FacilityStatus>('all');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFacilities = async (): Promise<void> => {
      try {
        setLoading(true);
        let facilitiesData: FacilityData[];

        if (activeFilter === 'all') {
          facilitiesData = await getFacilities();
        } else {
          // Ensure activeFilter is not 'all' before passing to getFacilitiesByStatus
          const statusFilter = activeFilter as Exclude<FacilityStatus, 'all'>;
          facilitiesData = await getFacilitiesByStatus(statusFilter);
        }

        setFacilities(facilitiesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching facilities:", error);
        setLoading(false);
      }
    };

    fetchFacilities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch only on mount initially

  const handleFilterClick = (filter: FacilityStatus): void => {
    setActiveFilter(filter);
    setLoading(true);

    // Re-fetch facilities based on the new filter
    const fetchFilteredFacilities = async (): Promise<void> => {
      try {
        let facilitiesData: FacilityData[];

        if (filter === 'all') {
          facilitiesData = await getFacilities();
        } else {
           // Ensure filter is not 'all' before passing
           const statusFilter = filter as Exclude<FacilityStatus, 'all'>;
           facilitiesData = await getFacilitiesByStatus(statusFilter);
        }

        setFacilities(facilitiesData); // Update state with newly fetched data
        setLoading(false);
      } catch (error) {
        console.error("Error fetching filtered facilities:", error);
        setLoading(false);
      }
    };

    fetchFilteredFacilities();
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
    // Filtering is now done directly on the `facilities` state in the return statement
  };

  // Filter facilities based on both activeFilter and searchTerm before rendering
  const filteredFacilities = facilities.filter(facility => {
    // Filter by status (already handled by fetching logic, but good for client-side consistency if needed)
    // if (activeFilter !== 'all' && facility.status !== activeFilter) {
    //   return false;
    // }

    // Filter by search term
    const term = searchTerm.toLowerCase();
    if (term &&
        !(facility.properties?.company?.toLowerCase() || '').includes(term) &&
        !(facility.properties?.address?.toLowerCase() || '').includes(term) && // Assuming location is address
        !(facility.properties?.technology?.toLowerCase() || '').includes(term) // Search method too
       ) {
      return false;
    }

    return true;
  });

  // Function to render the status badge
  const renderStatusBadge = (status: FacilityStatus | undefined | null): JSX.Element => {
    const validStatus = status || 'unknown'; // Default to 'unknown' if status is null/undefined

    const statusClasses: { [key in FacilityStatus]: string } = {
      operating: 'status-badge status-operating',
      construction: 'status-badge status-construction',
      planned: 'status-badge status-planned',
      pilot: 'status-badge status-pilot',
      unknown: 'status-badge status-unknown', // Add style for unknown
      all: '' // 'all' shouldn't be rendered as a badge
    };

    const statusLabels: { [key in FacilityStatus]: string } = {
      operating: 'Operating',
      construction: 'Construction',
      planned: 'Planned',
      pilot: 'Pilot',
      unknown: 'Unknown',
      all: 'All'
    };

    return <span className={statusClasses[validStatus]}>{statusLabels[validStatus]}</span>;
  };


  const handleDelete = async (facilityId: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      try {
        await deleteFacility(facilityId);
        // Update the state to remove the deleted facility
        setFacilities(prevFacilities => prevFacilities.filter(f => f.id !== facilityId));
        console.log(`Facility ${facilityId} deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting facility ${facilityId}:`, error);
        // Optionally, show an error message to the user
        alert('Failed to delete facility. Please try again.');
      }
    }
  };

  return (
    <div className="row mt-4 fade-in"> {/* Added fade-in */}
      <div className="col-12">
        <div className="facilities-list">
          {/* Tabs Container */}
          <div className="tabs-container d-flex flex-wrap justify-content-center mb-3">
            {(['all', 'operating', 'construction', 'planned', 'pilot'] as FacilityStatus[]).map(filter => (
                 <button
                    key={filter}
                    className={`tab-button ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => handleFilterClick(filter)}
                 >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)} {/* Capitalize */}
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
            ) : filteredFacilities.length === 0 ? (
              <p className="text-center text-muted mt-4">No facilities found matching your criteria.</p>
            ) : (
              filteredFacilities.map(facility => (
                <div key={facility.id} className="facility-item card mb-2 shadow-sm"> {/* Use card for better structure */}
                  <div className="facility-item-content card-body d-md-flex align-items-center"> {/* Flex for alignment */}
                    <span className="col-company mb-1 mb-md-0">
                      <Link to={`/facilities/${facility.id}`} className="fw-bold">{facility.properties?.company || 'N/A'}</Link>
                    </span>
                    <span className="col-location mb-1 mb-md-0 text-muted">{facility.properties?.address || 'N/A'}</span>
                    <span className="col-volume mb-1 mb-md-0">{facility.properties?.capacity || 'N/A'}</span>
                    <span className="col-method method-column mb-1 mb-md-0">{facility.properties?.technology || 'N/A'}</span>
                    <span className="col-status mb-1 mb-md-0">
                      {/* Access status via properties */}
                      {renderStatusBadge(facility.properties?.status as FacilityStatus)}
                    </span>
                    {currentUser && (
                        <span className="col-actions actions-column text-end">
                            <button
                                className="btn btn-sm btn-outline-danger delete-button"
                                onClick={() => handleDelete(facility.id)}
                                title="Delete Facility"
                            >
                                <i className="fas fa-trash-alt"></i>
                            </button>
                            {/* Add Edit button */}
                             <Link
                                to={`/facilities/edit/${facility.id}`}
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