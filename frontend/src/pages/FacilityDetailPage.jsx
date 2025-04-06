import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { getFacilityById, updateFacility } from '../firebase';
import EditFacilityForm from '../components/EditFacilityForm';
import './FacilityDetailPage.css';
import '../components/EditFacilityForm.css';

function FacilityDetailPage() {
  const { id } = useParams();
  const location = useLocation(); // Get location state
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Initialize activeTab from location state or default to 'overview'
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');

  // Placeholder for authentication
  const isAuthenticated = true;

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setLoading(true);
        setError(null);
        const facilityData = await getFacilityById(id);
        if (facilityData) {
          setFacility(facilityData);
        } else {
          setError('Facility not found.');
        }
      } catch (err) {
        console.error("Error fetching facility details:", err);
        setError('Failed to load facility details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFacility();
    }
  }, [id]);

  // Update location state when tab changes (optional, but good practice if linking elsewhere)
  // This doesn't directly solve the "remember tab after edit" because edit is a modal,
  // but helps if navigation away and back occurs. The useState default handles the modal case.
  useEffect(() => {
    // Replace state in history to remember the tab without adding new history entries
    window.history.replaceState({ ...window.history.state, activeTab }, '');
  }, [activeTab]);


  const renderStatusBadge = (status) => {
    const statusKey = status?.replace(/\s+/g, '')?.toLowerCase() || 'unknown';
    const statusClasses = {
      planning: 'status-badge status-planned',
      underconstruction: 'status-badge status-construction',
      operational: 'status-badge status-operating',
      onhold: 'status-badge status-onhold',
      cancelled: 'status-badge status-cancelled',
      decommissioned: 'status-badge status-decommissioned',
      unknown: 'status-badge status-unknown',
    };
    const label = status || 'Unknown';
    return <span className={statusClasses[statusKey] || statusClasses.unknown}>{label}</span>;
  };

  const handleEditClick = () => {
    if (isAuthenticated) {
      setShowEditModal(true);
    } else {
      alert('You must be logged in to edit facilities.');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  const handleSaveSuccess = async (updatedData) => {
    setIsSaving(true);
    setError(null);
    try {
      await updateFacility(id, updatedData);
      // Re-fetch or update local state
      const refreshedFacility = await getFacilityById(id); // Re-fetch for consistency
      if (refreshedFacility) {
        setFacility(refreshedFacility);
      }
      // Keep the current active tab after saving
      setShowEditModal(false);
      alert('Facility updated successfully!');
    } catch (err) {
      console.error("Error saving facility:", err);
      setError(`Failed to save changes: ${err.message}`);
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="container mt-4"><p>Loading facility details...</p></div>;
  }

  if (error && !facility) { // Only show full page error if facility couldn't load at all
    return <div className="container mt-4"><p className="text-danger">{error}</p></div>;
  }

  if (!facility) {
    return <div className="container mt-4"><p>Facility data not available.</p></div>;
  }

  const properties = facility.properties || {};
  const facilityDataForForm = {
      id: id,
      name: properties.company || '',
      company: properties.company || '',
      location: properties.address || '',
      status: properties.status || 'Planning',
      capacity: properties.capacity || '',
      technology: properties.technology || '',
      description: properties.description || '',
      technicalSpecs: properties.technicalSpecs || '',
      timeline: properties.timeline || [],
      images: properties.images || [],
      contactPerson: properties.contactPerson || '',
      contactEmail: properties.contactEmail || '',
      contactPhone: properties.contactPhone || '',
      documents: properties.documents || [],
      environmentalImpact: { details: properties.environmentalImpact || '' },
      investment: { total: properties.fundingDetails || '' },
      website: properties.website || '',
      feedstock: properties.feedstock || '',
      product: properties.product || '',
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'technical', label: 'Technical Details' },
    { key: 'media', label: 'Media' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'documents', label: 'Documents' },
    { key: 'environmental', label: 'Environmental Impact' },
    { key: 'investment', label: 'Investment & Funding' },
    { key: 'contact', label: 'Contact Information' },
  ];

  return (
    <div className="container mt-4 facility-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{properties.company || 'Facility Details'}</h1>
        <div>
          {/* Edit Button - Moved next to Back button */}
          {isAuthenticated && (
            <button
              className="btn btn-primary me-2" // Add margin
              onClick={handleEditClick}
              disabled={isSaving}
            >
              <i className="fas fa-edit me-2"></i>Edit
            </button>
          )}
          <Link to="/facilities" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>Back to Facilities
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-3">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab Content */}
      <div className="card">
        <div className="card-body">
          {/* Conditionally render content based on activeTab */}

          {activeTab === 'overview' && (
            <div>
              <h2 className="section-heading mb-3">Overview</h2>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Location:</strong>
                  <p>{properties.address || 'N/A'}</p>
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong>
                  <p>{renderStatusBadge(properties.status)}</p>
                </div>
              </div>
              <div className="row mb-3">
                 <div className="col-md-6">
                   <strong>Volume (tons/year):</strong>
                   <p>{properties.capacity || 'N/A'}</p>
                 </div>
                 <div className="col-md-6">
                   <strong>Website:</strong>
                   <p>{properties.website ? <a href={properties.website} target="_blank" rel="noopener noreferrer">{properties.website}</a> : 'N/A'}</p>
                 </div>
              </div>
               <div className="row mb-4">
                 <div className="col-12">
                   <h3 className="sub-section-heading">Description</h3>
                   <p>{properties.description || 'Detailed description not available.'}</p>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div>
              <h2 className="section-heading mb-3">Technical Details</h2>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Method/Technology:</strong>
                  <p>{properties.technology || 'N/A'}</p>
                </div>
                 <div className="col-md-6">
                   <strong>Feedstock:</strong>
                   <p>{properties.feedstock || 'N/A'}</p>
                 </div>
              </div>
              <div className="row mb-3">
                 <div className="col-md-6">
                   <strong>Product:</strong>
                   <p>{properties.product || 'N/A'}</p>
                 </div>
              </div>
              <div className="row mb-4">
                <div className="col-12">
                  <h3 className="sub-section-heading">Technical Specifications</h3>
                  <pre>{properties.technicalSpecs || 'Technical specifications not available.'}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div>
              <h2 className="section-heading mb-3">Media</h2>
              <div className="image-gallery-placeholder">
                {Array.isArray(properties.images) && properties.images.length > 0 ? (
                  <div className="image-gallery-container">
                    {properties.images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Facility Image ${index + 1}`}
                        className="img-thumbnail me-2 mb-2 facility-gallery-image"
                        style={{maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', cursor: 'pointer'}}
                        onError={(e) => { e.target.src = '/placeholder-image.png'; e.target.style.display = 'none'; }}
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    ))}
                  </div>
                ) : (
                  <p>No images available.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              <h2 className="section-heading mb-3">Project Timeline & Milestones</h2>
              {Array.isArray(properties.timeline) && properties.timeline.length > 0 ? (
                <ul className="timeline-list">
                  {properties.timeline.map((item, index) => (
                    <li key={index}>
                      <strong>{item.year || 'Year N/A'}:</strong> {item.event || 'Event N/A'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Timeline information not available.</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h2 className="section-heading mb-3">Related Documents & Resources</h2>
              {Array.isArray(properties.documents) && properties.documents.length > 0 ? (
                <ul className="document-list">
                  {properties.documents.map((doc, index) => (
                    <li key={index}>
                      <a
                        href={doc?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {doc?.title || `Document ${index + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No related documents available.</p>
              )}
            </div>
          )}

          {activeTab === 'environmental' && (
            <div>
              <h2 className="section-heading mb-3">Environmental Impact</h2>
              <p>{properties.environmentalImpact?.details || 'Environmental impact details not available.'}</p>
              {/* Consider adding more structured data if available */}
            </div>
          )}

          {activeTab === 'investment' && (
            <div>
              <h2 className="section-heading mb-3">Investment & Funding</h2>
              <p>{properties.fundingDetails || 'Funding details not available.'}</p>
              {/* Consider adding more structured data if available */}
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <h2 className="section-heading mb-3">Contact Information</h2>
              <p><strong>Contact Person:</strong> {properties.contactPerson || 'N/A'}</p>
              <p><strong>Email:</strong> {properties.contactEmail ? <a href={`mailto:${properties.contactEmail}`}>{properties.contactEmail}</a> : 'N/A'}</p>
              <p><strong>Phone:</strong> {properties.contactPhone || 'N/A'}</p>
            </div>
          )}

        </div>
      </div>

      {/* Render Edit Modal */}
      {facilityDataForForm && (
         <EditFacilityForm
           show={showEditModal}
           facility={facilityDataForForm}
           onSaveSuccess={handleSaveSuccess}
           onCancel={handleCancelEdit}
         />
      )}

       {/* Display saving indicator or errors related to saving */}
       {isSaving && <p className="text-info mt-3">Saving changes...</p>}
       {/* Show general page error if it exists and modal is closed */}
       {error && !showEditModal && <p className="text-danger mt-3">{error}</p>}


    </div>
  );
}

export default FacilityDetailPage;