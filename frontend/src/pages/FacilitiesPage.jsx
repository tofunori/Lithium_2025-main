import React, { useState, useEffect } from 'react';
import { getFacilities, getFacilitiesByStatus } from '../firebase';
import './FacilitiesPage.css';

function FacilitiesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        let facilitiesData;
        
        if (activeFilter === 'all') {
          facilitiesData = await getFacilities();
        } else {
          facilitiesData = await getFacilitiesByStatus(activeFilter);
        }
        
        setFacilities(facilitiesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching facilities:", error);
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    setLoading(true);
    
    // Re-fetch facilities based on the new filter
    const fetchFilteredFacilities = async () => {
      try {
        let facilitiesData;
        
        if (filter === 'all') {
          facilitiesData = await getFacilities();
        } else {
          facilitiesData = await getFacilitiesByStatus(filter);
        }
        
        setFacilities(facilitiesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching filtered facilities:", error);
        setLoading(false);
      }
    };
    
    fetchFilteredFacilities();
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFacilities = facilities.filter(facility => {
    // Filter by status
    if (activeFilter !== 'all' && facility.status !== activeFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !facility.company.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !facility.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Function to render the status badge
  const renderStatusBadge = (status) => {
    const statusClasses = {
      operating: 'status-badge status-operating',
      construction: 'status-badge status-construction',
      planned: 'status-badge status-planned',
      pilot: 'status-badge status-pilot'
    };
    
    const statusLabels = {
      operating: 'Operating',
      construction: 'Construction',
      planned: 'Planned',
      pilot: 'Pilot'
    };
    
    return <span className={statusClasses[status]}>{statusLabels[status]}</span>;
  };

  return (
    <div className="row mt-4">
      <div className="col-12">
        <div className="facilities-list">
          <div className="tabs-container">
            <button 
              className={`tab-button ${activeFilter === 'all' ? 'active' : ''}`} 
              onClick={() => handleFilterClick('all')}
            >
              All
            </button>
            <button 
              className={`tab-button ${activeFilter === 'operating' ? 'active' : ''}`} 
              onClick={() => handleFilterClick('operating')}
            >
              Operating
            </button>
            <button 
              className={`tab-button ${activeFilter === 'construction' ? 'active' : ''}`} 
              onClick={() => handleFilterClick('construction')}
            >
              Construction
            </button>
            <button 
              className={`tab-button ${activeFilter === 'planned' ? 'active' : ''}`} 
              onClick={() => handleFilterClick('planned')}
            >
              Planned
            </button>
          </div>

          <div className="text-end mb-3">
            <button className="btn btn-success">
              <i className="fas fa-plus"></i> Add New Facility
            </button>
          </div>

          <div className="input-group mb-3">
            <span className="input-group-text"><i className="fas fa-search"></i></span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search facilities..." 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Column Headers */}
          <div className="facility-list-header d-none d-md-flex mb-2">
            <span className="col-company">Company</span>
            <span className="col-location">Location</span>
            <span className="col-volume">Volume (tons/year)</span>
            <span className="col-method">Method</span>
            <span className="col-status">Status</span>
            <span className="col-actions">Actions</span>
          </div>

          {/* Facilities List */}
          <div id="facilitiesList">
            {loading ? (
              <p className="text-center text-muted">Loading facilities...</p>
            ) : filteredFacilities.length === 0 ? (
              <p className="text-center text-muted">No facilities found matching your criteria.</p>
            ) : (
              filteredFacilities.map(facility => (
                <div key={facility.id} className="facility-item">
                  <div className="facility-item-content">
                    <span className="col-company">
                      <a href={`/facilities/${facility.id}`}>{facility.company}</a>
                    </span>
                    <span className="col-location">{facility.location}</span>
                    <span className="col-volume">{facility.volume.toLocaleString()}</span>
                    <span className="col-method">{facility.method}</span>
                    <span className="col-status">
                      {renderStatusBadge(facility.status)}
                    </span>
                    <span className="col-actions">
                      <button className="btn btn-sm btn-outline-primary edit-link">
                        <i className="fas fa-edit"></i>
                      </button>
                    </span>
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