import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { getFacilityById, updateFacility } from '../firebase';
// TODO: Import actual form section components when created
import BasicInfoFormSection from '../components/formSections/BasicInfoFormSection';
import TechnicalFormSection from '../components/formSections/TechnicalFormSection';
import MediaFormSection from '../components/formSections/MediaFormSection';
import TimelineFormSection from '../components/formSections/TimelineFormSection';
import DocumentsFormSection from '../components/formSections/DocumentsFormSection';
import EnvironmentalFormSection from '../components/formSections/EnvironmentalFormSection';
import InvestmentFormSection from '../components/formSections/InvestmentFormSection';
import ContactFormSection from '../components/formSections/ContactFormSection';
// import OverviewFormSection from '../components/formSections/OverviewFormSection';
// import TechnicalFormSection from '../components/formSections/TechnicalFormSection';
// ... other sections
import './FacilityDetailPage.css';
// '../components/EditFacilityForm.css' might be removable later if styles are moved
import '../components/EditFacilityForm.css';

function FacilityDetailPage() {
  const { id } = useParams();
  const location = useLocation(); // Get location state
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  // Initialize activeTab from location state or default to 'overview'
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');
  const [editingTabKey, setEditingTabKey] = useState(null); // Track which tab is being edited
  const [editFormData, setEditFormData] = useState(null); // Temporary data for the form being edited

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
    // Only update history if not currently editing to avoid potential issues
    if (!editingTabKey) {
      window.history.replaceState({ ...window.history.state, activeTab }, '');
    }
  }, [activeTab, editingTabKey]);


  const renderStatusBadge = (status) => {
    const statusKey = status?.replace(/\s+/g, '')?.toLowerCase() || 'unknown';
    const statusClasses = {
      planned: 'status-badge status-planned', // Corrected key
      underconstruction: 'status-badge status-construction', // Corrected key to match generated key
      operating: 'status-badge status-operating', // Corrected key
      onhold: 'status-badge status-onhold',
      cancelled: 'status-badge status-cancelled',
      decommissioned: 'status-badge status-decommissioned',
      unknown: 'status-badge status-unknown',
    };
    const label = status || 'Unknown';
    const className = statusClasses[statusKey] || statusClasses.unknown;
    // Add console log for debugging
    console.log(`Status: "${status}", Key: "${statusKey}", Class: "${className}"`);
    return <span className={className}>{label}</span>;
  };

  // Renamed from handleEditClick
  const handleEdit = () => {
    if (isAuthenticated && facility) {
      // Deep copy relevant data to avoid mutating original state
      // Using facilityDataForForm structure as a base
      const initialFormData = JSON.parse(JSON.stringify(facilityDataForForm));
      setEditFormData(initialFormData);
      setEditingTabKey(activeTab); // Set the current tab as the one being edited
    } else if (!isAuthenticated) {
      alert('You must be logged in to edit facilities.');
    }
  };

  // Renamed from handleCancelEdit
  const handleCancel = () => {
    setEditingTabKey(null); // Exit edit mode
    setEditFormData(null); // Clear temporary form data
    setError(null); // Clear any edit-specific errors
  };

  // Renamed from handleSaveSuccess
  const handleSave = async () => {
    if (!editFormData) return; // Should not happen if button is enabled correctly

    setIsSaving(true);
    setError(null);
    try {
      // Prepare data for update (map from editFormData back to Firestore structure if needed)
      // For now, assuming editFormData structure matches what updateFacility expects
      // TODO: Add validation logic here before saving
      // Get the original image list before editing started
      const originalImages = facility?.properties?.images || [];
      await updateFacility(id, editFormData, originalImages); // Pass original images for deletion comparison

      // Re-fetch data to show the latest version
      const refreshedFacility = await getFacilityById(id);
      if (refreshedFacility) {
        setFacility(refreshedFacility);
      }

      setEditingTabKey(null); // Exit edit mode
      setEditFormData(null); // Clear temporary form data
      alert('Facility updated successfully!');
    } catch (err) {
      console.error("Error saving facility:", err);
      setError(`Failed to save changes: ${err.message}`);
      // Keep edit mode active so user can retry or cancel
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handles changes in form section components
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Basic handler for simple fields
    // Needs enhancement for nested objects (like environmentalImpact, investment) and arrays
    setEditFormData(prevData => {
      // Handle nested properties if name contains a dot (e.g., "environmentalImpact.details")
      if (name.includes('.')) {
        const [outerKey, innerKey] = name.split('.');
        return {
          ...prevData,
          [outerKey]: {
            ...prevData[outerKey],
            [innerKey]: type === 'checkbox' ? checked : value,
          }
        };
      }
      // Handle top-level properties
      return {
        ...prevData,
        [name]: type === 'checkbox' ? checked : value,
      };
    });
  };

  // Handles updates specifically from the MediaFormSection (images array)
  const handleMediaFormChange = (update) => {
    // update should be an object like { images: [...] }
    setEditFormData(prevData => ({
      ...prevData,
      ...update, // Merge the changes (e.g., the updated images array)
    }));
  };

  // TODO: Implement handlers for array changes (add/remove/update items)
  // const handleTimelineChange = (index, field, value) => { ... };
  // const addTimelineItem = () => { ... };
  // const removeTimelineItem = (index) => { ... };
  // Similar handlers for documents, etc.

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
          {/* Edit Button - Now triggers edit mode for the *active* tab */}
          {isAuthenticated && (
            <button
              className="btn btn-primary me-2" // Add margin
              onClick={handleEdit} // Use the correct handler for initiating edit mode
              disabled={isSaving || editingTabKey} // Disable if saving or already editing *any* tab
            >
              <i className="fas fa-edit me-2"></i>Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
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
              disabled={editingTabKey && editingTabKey !== tab.key} // Disable other tabs when editing
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Overview</h2>
                 {/* Removed individual edit button - use main Edit button */}
              </div>

              {editingTabKey === 'overview' ? (
                <>
                  {/* Render the actual BasicInfoFormSection */}
                  <BasicInfoFormSection
                    data={editFormData}
                    onChange={handleFormChange}
                    isSaving={isSaving}
                  />
                  {/* Add other overview-specific form sections here if needed */}
                  {/* e.g., Description textarea */}
                   <div className="mb-3">
                     <label htmlFor="edit-description" className="form-label">Description:</label>
                     <textarea
                       className="form-control"
                       id="edit-description"
                       name="description"
                       value={editFormData?.description || ''}
                       onChange={handleFormChange}
                       rows="4"
                       disabled={isSaving}
                     ></textarea>
                   </div>
                   <div className="mb-3">
                     <label htmlFor="edit-website" className="form-label">Website:</label>
                     <input
                       type="url"
                       className="form-control"
                       id="edit-website"
                       name="website"
                       value={editFormData?.website || ''}
                       onChange={handleFormChange}
                       disabled={isSaving}
                     />
                   </div>


                  {error && <p className="text-danger mt-2">{error}</p>}
                  <div className="mt-3">
                    <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                    </button>
                    <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Original View Content */}
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
                       <p>{properties.capacity || 'N/A'}</p> {/* Note: Capacity might belong in Technical */}
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
                 </>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Technical Details</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'technical' ? (
                 <>
                   {/* Render the actual TechnicalFormSection */}
                   <TechnicalFormSection
                     data={editFormData}
                     onChange={handleFormChange}
                     isSaving={isSaving}
                   />
                   {/* Add other technical form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
                   {/* Note: Moved Capacity from Overview to here */}
                   <div className="row mb-3">
                     <div className="col-md-6">
                       <strong>Volume (tons/year):</strong>
                       <p>{properties.capacity || 'N/A'}</p>
                     </div>
                     <div className="col-md-6">
                       <strong>Method/Technology:</strong>
                       <p>{properties.technology || 'N/A'}</p>
                     </div>
                   </div>
                   <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Feedstock:</strong>
                        <p>{properties.feedstock || 'N/A'}</p>
                      </div>
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
                 </>
               )}
             </div>
           )}

          {activeTab === 'media' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Media</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'media' ? (
                 <>
                   {/* Render the actual MediaFormSection */}
                   <MediaFormSection
                     facilityId={id} // Pass the facility ID
                     data={editFormData}
                     onFormDataChange={handleMediaFormChange} // Pass the specific handler
                     isSaving={isSaving}
                   />
                   {/* Add other media form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
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
                 </>
               )}
             </div>
           )}

          {activeTab === 'timeline' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Project Timeline & Milestones</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'timeline' ? (
                 <>
                   {/* Render the actual TimelineFormSection */}
                   <TimelineFormSection
                     data={editFormData}
                     onChange={handleFormChange} // Basic handler, needs enhancement for array items
                     // onAddItem={handleAddTimelineItem} // TODO: Implement handler
                     // onRemoveItem={handleRemoveTimelineItem} // TODO: Implement handler
                     isSaving={isSaving}
                   />
                   {/* Add other timeline form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
                   {Array.isArray(properties.timeline) && properties.timeline.length > 0 ? (
                     <ul className="list-group">
                       {properties.timeline.map((item, index) => (
                         <li key={index} className="list-group-item">
                           <strong>{item.date || 'Date TBD'}:</strong> {item.event || 'Milestone details missing.'}
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <p>No timeline information available.</p>
                   )}
                 </>
               )}
             </div>
           )}

          {activeTab === 'documents' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Documents & Permits</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'documents' ? (
                 <>
                   {/* Render the actual DocumentsFormSection */}
                   <DocumentsFormSection
                     data={editFormData}
                     onChange={handleFormChange} // Basic handler, needs enhancement
                     // onAddDocument={...} // TODO
                     // onRemoveDocument={...} // TODO
                     isSaving={isSaving}
                   />
                   {/* Add other document form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
                   {Array.isArray(properties.documents) && properties.documents.length > 0 ? (
                     <ul className="list-group">
                       {properties.documents.map((doc, index) => (
                         <li key={index} className="list-group-item">
                           <a href={doc.url || '#'} target="_blank" rel="noopener noreferrer">
                             {doc.name || 'Unnamed Document'}
                           </a>
                           {doc.type && <span className="badge bg-secondary ms-2">{doc.type}</span>}
                         </li>
                       ))}
                     </ul>
                   ) : (
                     <p>No documents available.</p>
                   )}
                 </>
               )}
             </div>
           )}

          {activeTab === 'environmental' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Environmental Impact</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'environmental' ? (
                 <>
                   {/* Render the actual EnvironmentalFormSection */}
                   <EnvironmentalFormSection
                     data={editFormData}
                     onChange={handleFormChange}
                     isSaving={isSaving}
                   />
                   {/* Add other environmental form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
                   <p>{properties.environmentalImpact?.details || 'Environmental impact details not available.'}</p>
                 </>
               )}
             </div>
           )}

          {activeTab === 'investment' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Investment & Funding</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'investment' ? (
                 <>
                   {/* Render the actual InvestmentFormSection */}
                   <InvestmentFormSection
                     data={editFormData}
                     onChange={handleFormChange}
                     isSaving={isSaving}
                   />
                   {/* Add other investment form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
                   <p>{properties.fundingDetails || 'Funding details not available.'}</p>
                   {/* Consider adding more fields like investors, funding rounds etc. */}
                 </>
               )}
             </div>
           )}

          {activeTab === 'contact' && (
             <div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                 <h2 className="section-heading mb-0">Contact Information</h2>
                 {/* Removed individual edit button */}
               </div>

               {editingTabKey === 'contact' ? (
                 <>
                   {/* Render the actual ContactFormSection */}
                   <ContactFormSection
                     data={editFormData}
                     onChange={handleFormChange}
                     isSaving={isSaving}
                   />
                   {/* Add other contact form sections if needed */}

                   {error && <p className="text-danger mt-2">{error}</p>}
                   <div className="mt-3">
                     <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                       {isSaving ? 'Saving...' : <><i className="fas fa-save me-1"></i> Save Changes</>}
                     </button>
                     <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
                       Cancel
                     </button>
                   </div>
                 </>
               ) : (
                 <>
                   {/* Original View Content */}
                   <div className="row">
                     <div className="col-md-4">
                       <strong>Contact Person:</strong>
                       <p>{properties.contactPerson || 'N/A'}</p>
                     </div>
                     <div className="col-md-4">
                       <strong>Email:</strong>
                       <p>{properties.contactEmail ? <a href={`mailto:${properties.contactEmail}`}>{properties.contactEmail}</a> : 'N/A'}</p>
                     </div>
                     <div className="col-md-4">
                       <strong>Phone:</strong>
                       <p>{properties.contactPhone || 'N/A'}</p>
                     </div>
                   </div>
                 </>
               )}
             </div>
           )}

        </div> {/* End card-body */}
      </div> {/* End card */}

    </div> // End container
  );
}

export default FacilityDetailPage;