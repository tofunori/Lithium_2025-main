// frontend/src/pages/FacilityDetailPage.tsx
import React, { useState, useEffect, ChangeEvent, SyntheticEvent } from 'react';
import { useParams, Link, useLocation, Location } from 'react-router-dom';
// UPDATED: Import Facility and FacilityFormData from supabaseDataService
import {
    getFacilityById,
    updateFacility,
    Facility, // Use the new flat Facility interface
    FacilityFormData as SupabaseFacilityFormData, // Keep using this for form state structure
    FacilityTimelineEvent // Import for timeline type consistency
} from '../supabaseDataService';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides user info

// Import form section components
import BasicInfoFormSection from '../components/formSections/BasicInfoFormSection';
import TechnicalFormSection from '../components/formSections/TechnicalFormSection';
import MediaFormSection from '../components/formSections/MediaFormSection';
import TimelineFormSection from '../components/formSections/TimelineFormSection';
import DocumentsFormSection from '../components/formSections/DocumentsFormSection';
import EnvironmentalFormSection from '../components/formSections/EnvironmentalFormSection';
import InvestmentFormSection from '../components/formSections/InvestmentFormSection';
import ContactFormSection from '../components/formSections/ContactFormSection';

// Import status utils
import { getCanonicalStatus } from '../utils/statusUtils';

import './FacilityDetailPage.css';
import '../components/EditFacilityForm.css'; // Keep for now

// --- Interfaces and Types ---

// Type for location state passed via Link/navigate
interface LocationState {
    // activeTab?: string; // Removed as tabs are gone
}

// Type for status badge keys used locally for styling
type FacilityStatusStyleKey = 'planned' | 'construction' | 'operating' | 'unknown';


// --- Component ---
const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as Location<LocationState | undefined>;
  const { currentUser } = useAuth();

  const [facility, setFacility] = useState<Facility | null>(null); // UPDATED: Use Facility type
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // New state for in-page editing
  // Use the imported SupabaseFacilityFormData type for edit state
  const [editFormData, setEditFormData] = useState<SupabaseFacilityFormData | null>(null);

  // Check if user is authenticated
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) {
          setError('No facility ID provided.');
          setLoading(false);
          return;
      }
      try {
        setLoading(true);
        setError(null);
        const facilityData = await getFacilityById(id); // Returns Facility | null
        if (facilityData) {
          setFacility(facilityData);
        } else {
          setError('Facility not found.');
          setFacility(null);
        }
      } catch (err: any) {
        console.error("Error fetching facility details:", err);
        setError(`Failed to load facility details: ${err.message}`);
        setFacility(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  // Removed useEffect for activeTab history update


  // UPDATED: renderStatusBadge accepts status_name and returns React.ReactNode
  const renderStatusBadge = (statusName: string | undefined | null): React.ReactNode => {
    const canonicalStatus = getCanonicalStatus(statusName); // Use canonical status for logic
    const statusClasses: Record<FacilityStatusStyleKey, string> = {
      planned: 'status-badge status-planned',
      construction: 'status-badge status-construction',
      operating: 'status-badge status-operating',
      unknown: 'status-badge status-unknown',
    };
    const label = statusName || 'Unknown'; // Display the original status label
    const validKey = canonicalStatus in statusClasses ? canonicalStatus as FacilityStatusStyleKey : 'unknown';
    const className = statusClasses[validKey];
    return <span className={className}>{label}</span>;
  };

  // Prepare data in the structure expected by the forms (SupabaseFacilityFormData) when editing starts
  // UPDATED: Map from flat Facility structure (using correct DB property names)
  const prepareFormData = (facilityData: Facility): SupabaseFacilityFormData => {
      // Map Facility (DB structure) to SupabaseFacilityFormData (Form structure)
      return {
          id: facilityData.ID, // Use DB 'ID'
          // Map flat properties from DB to form fields
          company_name: facilityData.Company ?? '', // Use DB 'Company'
          address: facilityData.Location ?? '', // Use DB 'Location'
          // city: facilityData.city ?? '', // 'city' is not directly on Facility DB model
          status_name: facilityData["Operational Status"] ?? 'Planned', // Use DB 'Operational Status'
          // status_effective_date_text: facilityData.status_effective_date_text ?? '', // Not directly on Facility DB model
          processing_capacity_mt_year: facilityData["Annual Processing Capacity (tonnes/year)"] ?? '', // Use DB 'Annual Processing Capacity (tonnes/year)'
          ev_equivalent_per_year: facilityData.ev_equivalent_per_year ?? '', // Use DB 'ev_equivalent_per_year' (if exists)
          jobs: facilityData.jobs ?? '', // Use DB 'jobs' (if exists)
          technology_name: facilityData["Primary Recycling Technology"] ?? '', // Use DB 'Primary Recycling Technology'
          // technology_description: facilityData.technology_description ?? '', // Not directly on Facility DB model
          notes: facilityData["Key Sources/Notes"] ?? '', // Use DB 'Key Sources/Notes'
          latitude: facilityData.Latitude ?? null, // Use DB 'Latitude'
          longitude: facilityData.Longitude ?? null, // Use DB 'Longitude'
          website: facilityData.website ?? '', // Use DB 'website' (if exists)
          feedstock: facilityData.feedstock ?? '', // Use DB 'feedstock' (if exists)
          product: facilityData.product ?? '', // Use DB 'product' (if exists)
          contactPerson: facilityData.contactPerson ?? '', // Use DB 'contactPerson' (if exists)
          contactEmail: facilityData.contactEmail ?? '', // Use DB 'contactEmail' (if exists)
          contactPhone: facilityData.contactPhone ?? '', // Use DB 'contactPhone' (if exists)

          // Map investment_usd (DB) to investment.total (Form)
          investment: { total: facilityData.investment_usd ?? '' }, // Use DB 'investment_usd' (if exists)

          // Map potentially nested or related data safely, providing defaults
          // These might be 'any' on Facility type, handle safely
          timeline: (facilityData.timeline && Array.isArray(facilityData.timeline))
              ? facilityData.timeline
              : [{ date: '', event: '', description: '' }], // Default structure matching FacilityTimelineEvent
          images: (facilityData.images && Array.isArray(facilityData.images))
              ? facilityData.images
              : [''], // Default empty image
          documents: (facilityData.documents && Array.isArray(facilityData.documents))
              ? facilityData.documents
              : [{ title: '', url: '' }], // Default empty document
          environmentalImpact: {
              details: facilityData.environmentalImpact?.details ?? '' // Use nullish coalescing
          },
          // Add defaults for fields present in FormData but not directly in Facility DB model
          // city: '', // Removed: 'city' is not in FacilityFormData
          status_effective_date_text: '', // Default status date text to empty string
          technology_description: '', // Default tech description to empty string
      };
  };


  const handleEdit = () => {
    if (isAuthenticated && facility) {
      const initialFormData = prepareFormData(facility);
      setEditFormData(initialFormData);
      console.log('[handleEdit] Initial editFormData:', JSON.stringify(initialFormData, null, 2));
      setIsEditing(true); // Set editing state to true
    } else if (!isAuthenticated) {
      alert('You must be logged in to edit facilities.');
      // Optionally redirect to login: navigate('/login');
    }
  };

  const handleCancel = () => {
    setIsEditing(false); // Set editing state to false
    setEditFormData(null); // Clear edit form data
    setError(null); // Clear any previous errors
  };

  // handleSave uses Supabase updateFacility which now accepts FacilityFormData
  const handleSave = async () => {
    if (!editFormData || !id) return;


    setIsSaving(true);
    setError(null);
    try {
        // Pass the facility ID and the entire editFormData object to the Supabase updateFacility function
        // The Supabase function handles mapping this form data to the DB structure
        await updateFacility(id, editFormData);

      // Re-fetch data to show the latest version
      const refreshedFacility = await getFacilityById(id);
      console.log('[handleSave] Refreshed facility data:', refreshedFacility);
      if (refreshedFacility) {
        setFacility(refreshedFacility);
      }

      // Update state to exit edit mode *before* the alert
      setIsEditing(false); // Set editing state to false
      setEditFormData(null); // Clear edit form data

      alert('Facility updated successfully!'); // Show alert after state updates initiated
    } catch (err: any) {
      console.error("Error saving facility:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to save changes: ${message}`);
      alert(`Error saving: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handles changes in form section components - Type event and enhance logic
  // Updates SupabaseFacilityFormData structure
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // For checkboxes

    // Convert numeric fields properly
    let processedValue: string | number | boolean | null = type === 'checkbox' ? checked : value;
    // Allow empty string for number inputs initially, convert to null or number on processing
    if (type === 'number' && name !== 'latitude' && name !== 'longitude') { // Handle general numbers
        processedValue = value === '' ? '' : Number(value); // Keep empty string for controlled input, parse to number later
    } else if ((name === 'latitude' || name === 'longitude') && type === 'number') { // Handle lat/lng specifically
        processedValue = value === '' ? '' : parseFloat(value); // Keep empty string, parse to float later
    }


    setEditFormData(prevData => {
      if (!prevData) return null; // Should not happen if called correctly

      // Handle nested properties (e.g., "environmentalImpact.details", "investment.total")
      if (name.includes('.')) {
        const [outerKey, innerKey] = name.split('.') as [keyof SupabaseFacilityFormData, string];
        // Ensure the outer key exists and is an object
        if (prevData[outerKey] && typeof prevData[outerKey] === 'object') {
            // Create a new nested object with the updated value
            const updatedNestedObject = {
                ...(prevData[outerKey] as object), // Cast to object
                [innerKey]: processedValue, // Use processed value
            };
            return {
                ...prevData,
                [outerKey]: updatedNestedObject,
            };
        } else {
             // Initialize the outer key if it doesn't exist
             const updatedNestedObject = { [innerKey]: processedValue };
             return {
                 ...prevData,
                 [outerKey]: updatedNestedObject,
             };
        }
      }

      // Handle top-level properties
      return {
        ...prevData,
        [name]: processedValue, // Use processed value
      };
    });
  };

  // Handles updates specifically from the MediaFormSection (images array) - Type update
  // Updates SupabaseFacilityFormData structure
  const handleMediaFormChange = (update: Partial<Pick<SupabaseFacilityFormData, 'images'>>): void => {
    setEditFormData(prevData => {
        if (!prevData) return null;
        // Ensure update contains the 'images' key if that's expected
        if ('images' in update) {
            return {
                ...prevData,
                images: update.images || [], // Update images, default to empty array if undefined
            };
        }
        return prevData; // Return previous state if update structure is unexpected
    });
  };

   // Handlers for Timeline array changes
   // Updates SupabaseFacilityFormData structure (using FacilityTimelineEvent)
   const handleTimelineChange = (index: number, field: keyof FacilityTimelineEvent, value: string | number): void => {
       setEditFormData(prevData => {
           if (!prevData || !prevData.timeline) return prevData; // Ensure timeline exists
           const updatedTimeline = [...prevData.timeline];
           // Ensure field is 'date' or 'event' or 'description' before updating
           const updatedItem = { ...updatedTimeline[index], [field]: value };
           updatedTimeline[index] = updatedItem;
           return { ...prevData, timeline: updatedTimeline };
       });
   };

   const addTimelineItem = (): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           // Add item with 'date' and 'event' fields matching FacilityTimelineEvent
           const newTimeline = [...(prevData.timeline || []), { date: '', event: '' }];
           return { ...prevData, timeline: newTimeline };
       });
   };

   const removeTimelineItem = (index: number): void => {
       setEditFormData(prevData => {
           if (!prevData || !prevData.timeline) return prevData;
           const updatedTimeline = prevData.timeline.filter((_, i) => i !== index);
           // Ensure at least one item remains, using 'date' field
           return { ...prevData, timeline: updatedTimeline.length > 0 ? updatedTimeline : [{ date: '', event: '' }] };
       });
   };

   // Handlers for Documents array changes
   // Updates SupabaseFacilityFormData structure (assuming {title, url} for form)
    const handleDocumentChange = (index: number, field: 'title' | 'url', value: string): void => {
       setEditFormData(prevData => {
           if (!prevData || !prevData.documents) return prevData;
           const updatedDocuments = [...prevData.documents];
           // Assuming documents are objects like {title, url} in the form state
           const updatedItem = { ...(updatedDocuments[index] || {}), [field]: value };
           updatedDocuments[index] = updatedItem;
           return { ...prevData, documents: updatedDocuments };
       });
   };

   const addDocumentItem = (): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           const newDocuments = [...(prevData.documents || []), { title: '', url: '' }];
           return { ...prevData, documents: newDocuments };
       });
   };

    const removeDocumentItem = (index: number): void => {
       setEditFormData(prevData => {
           if (!prevData || !prevData.documents) return prevData;
           const updatedDocuments = prevData.documents.filter((_, i) => i !== index);
           return { ...prevData, documents: updatedDocuments.length > 0 ? updatedDocuments : [{ title: '', url: '' }] };
       });
   };


  if (loading) {
    return <div className="container mt-4 text-center"><p><i className="fas fa-spinner fa-spin me-2"></i>Loading facility details...</p></div>;
  }

  if (error && !facility) {
    return <div className="container mt-4 alert alert-danger">{error}</div>;
  }

  if (!facility) {
    // This case should ideally be covered by the error state, but added for robustness
    return <div className="container mt-4"><p>Facility data not available.</p></div>;
  }

  // Use the prepared form data structure for consistency, only when editing
  // Otherwise, use the direct facility data for display
  // Use editFormData when editing, otherwise prepare fresh data for display mapping consistency
  const currentFormDataForDisplay = editFormData || prepareFormData(facility);

  // Define common props for form sections when editing
  const commonEditProps = {
      data: editFormData, // Pass the edit form data state
      onChange: handleFormChange, // General handler for simple inputs
      isSaving: isSaving,
  };


  // --- Render ---
  return (
    <div className="container mt-4 facility-detail-page">
      <div className="card shadow-sm">
        <div className="card-header facility-header d-flex justify-content-between align-items-center flex-wrap">
          <div>
            {/* Display Company and Status from the fetched facility data */}
            <h1 className="h3 mb-0">{facility.Company || 'Facility Details'}</h1>
            {renderStatusBadge(facility["Operational Status"])}
          </div>
          <div>
            {/* Edit/Save/Cancel Buttons - Logic based on isEditing state */}
            {isAuthenticated && !isEditing && (
                <button className="btn btn-outline-primary btn-sm me-2" onClick={handleEdit}>
                    <i className="fas fa-edit me-1"></i> Edit
                </button>
            )}
            {isEditing && (
                <>
                    <button className="btn btn-success btn-sm me-2" onClick={handleSave} disabled={isSaving}>
                        <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} me-1`}></i> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={isSaving}>
                        <i className="fas fa-times me-1"></i> Cancel
                    </button>
                </>
            )}
            <Link to="/facilities" className="btn btn-outline-secondary btn-sm ms-2">
              <i className="fas fa-arrow-left me-1"></i> Back to List
            </Link>
          </div>
        </div>

        {/* Display saving error - Only when editing */}
        {error && isEditing && <div className="alert alert-danger m-3">{error}</div>}

        <div className="card-body">
          {/* NEW: Multi-column layout structure */}
          <div className="facility-content-grid">
            {/* --- Column 1 --- */}
            <div>
              {/* Basic Info Section */}
              <div className="facility-section">
                <h3>Basic Information</h3>
                {isEditing && editFormData ? (
                  <>
                    {/* Pass specific props needed by BasicInfoFormSection, handling potential nulls */}
                    <BasicInfoFormSection
                        data={{ company: editFormData.company_name ?? '', location: editFormData.address ?? '', status: editFormData.status_name ?? '' }}
                        onChange={handleFormChange}
                        isSaving={isSaving}
                    />
                     {/* Website Input */}
                     <div className="mb-3">
                         <label htmlFor="edit-website" className="form-label">Website:</label>
                         <input type="url" className="form-control" id="edit-website" name="website" value={editFormData.website || ''} onChange={handleFormChange} disabled={isSaving} />
                     </div>
                     {/* Coordinates Input */}
                      <div className="row">
                          <div className="col-md-6 mb-3">
                              <label htmlFor="edit-latitude" className="form-label">Latitude:</label>
                              <input type="number" step="any" className="form-control" id="edit-latitude" name="latitude" value={editFormData.latitude ?? ''} onChange={handleFormChange} disabled={isSaving} />
                          </div>
                          <div className="col-md-6 mb-3">
                              <label htmlFor="edit-longitude" className="form-label">Longitude:</label>
                              <input type="number" step="any" className="form-control" id="edit-longitude" name="longitude" value={editFormData.longitude ?? ''} onChange={handleFormChange} disabled={isSaving} />
                          </div>
                      </div>
                  </>
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6"><strong>Location:</strong><p>{currentFormDataForDisplay.address || 'N/A'}</p></div>
                      <div className="col-md-6"><strong>Status:</strong><p>{renderStatusBadge(currentFormDataForDisplay.status_name)}</p></div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6"><strong>Website:</strong><p>{currentFormDataForDisplay.website ? <a href={currentFormDataForDisplay.website} target="_blank" rel="noopener noreferrer">{currentFormDataForDisplay.website}</a> : 'N/A'}</p></div>
                      {typeof currentFormDataForDisplay.latitude === 'number' && typeof currentFormDataForDisplay.longitude === 'number' && (
                           <div className="col-md-6"><strong>Coordinates:</strong><p>{currentFormDataForDisplay.latitude.toFixed(5)}, {currentFormDataForDisplay.longitude.toFixed(5)}</p></div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Contact Info Section */}
              <div className="facility-section">
                <h3>Contact Information</h3>
                {isEditing && editFormData ? (
                  <ContactFormSection
                    data={{ contactPerson: editFormData.contactPerson ?? '', contactEmail: editFormData.contactEmail ?? '', contactPhone: editFormData.contactPhone ?? '' }}
                    onChange={handleFormChange}
                    isSaving={isSaving}
                  />
                ) : (
                  <div className="row">
                    <div className="col-md-4"><strong>Person:</strong><p>{currentFormDataForDisplay.contactPerson || 'N/A'}</p></div>
                    <div className="col-md-4"><strong>Email:</strong><p>{currentFormDataForDisplay.contactEmail || 'N/A'}</p></div>
                    <div className="col-md-4"><strong>Phone:</strong><p>{currentFormDataForDisplay.contactPhone || 'N/A'}</p></div>
                  </div>
                )}
              </div>

              {/* Investment Section */}
               <div className="facility-section">
                 <h3>Investment & Funding</h3>
                 {isEditing && editFormData ? (
                   <InvestmentFormSection
                     data={{ investment: editFormData.investment }}
                     onChange={handleFormChange}
                     isSaving={isSaving}
                   />
                 ) : (
                   <p>Total Investment (USD): {currentFormDataForDisplay.investment?.total || 'N/A'}</p>
                 )}
               </div>

              {/* Notes Section */}
              <div className="facility-section">
                <h3>Notes</h3>
                {isEditing && editFormData ? (
                  <textarea
                    className="form-control"
                    id="edit-notes"
                    name="notes"
                    value={editFormData.notes || ''}
                    onChange={handleFormChange}
                    rows={5}
                    disabled={isSaving}
                  ></textarea>
                ) : (
                  <p>{currentFormDataForDisplay.notes || 'No notes available.'}</p>
                )}
              </div>
            </div>

            {/* --- Column 2 --- */}
            <div>
              {/* Technical Details Section */}
              <div className="facility-section">
                <h3>Technical Details</h3>
                {isEditing && editFormData ? (
                  <TechnicalFormSection
                    data={{
                        processing_capacity_mt_year: editFormData.processing_capacity_mt_year,
                        technology_name: editFormData.technology_name,
                        feedstock: editFormData.feedstock,
                        product: editFormData.product,
                        technology_description: editFormData.technology_description
                    }}
                    onChange={handleFormChange}
                    isSaving={isSaving}
                   />
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6"><strong>Volume (tons/year):</strong><p>{currentFormDataForDisplay.processing_capacity_mt_year || 'N/A'}</p></div>
                      <div className="col-md-6"><strong>Method/Technology:</strong><p>{currentFormDataForDisplay.technology_name || 'N/A'}</p></div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6"><strong>Feedstock:</strong><p>{currentFormDataForDisplay.feedstock || 'N/A'}</p></div>
                      <div className="col-md-6"><strong>Product:</strong><p>{currentFormDataForDisplay.product || 'N/A'}</p></div>
                    </div>
                    <div className="row mb-0"> {/* Removed mb-4 */}
                      <div className="col-12"><strong>Technology Description:</strong><pre>{currentFormDataForDisplay.technology_description || 'Description not available.'}</pre></div>
                    </div>
                  </>
                )}
              </div>

              {/* Timeline Section */}
              <div className="facility-section">
                <h3>Timeline</h3>
                {isEditing && editFormData ? (
                  <TimelineFormSection
                    // Map timeline data to ensure date is a string, pass general handler
                    data={{ timeline: editFormData.timeline?.map(item => ({ ...item, date: String(item.date) })) }}
                    onChange={handleFormChange} // Use general handler
                    // onAddItem and onRemoveItem likely handled internally by the component
                    isSaving={isSaving}
                  />
                ) : (
                  <ul className="list-group list-group-flush">
                    {Array.isArray(currentFormDataForDisplay.timeline) && currentFormDataForDisplay.timeline.length > 0 && currentFormDataForDisplay.timeline[0]?.event ? (
                        currentFormDataForDisplay.timeline.map((item, index) => (
                            <li key={index} className="list-group-item bg-transparent px-0"><strong>{item.date}:</strong> {item.event} {item.description ? `- ${item.description}` : ''}</li>
                        ))
                    ) : (<li className="list-group-item bg-transparent px-0">No timeline events available.</li>)}
                  </ul>
                )}
              </div>

              {/* Documents Section */}
              <div className="facility-section">
                <h3>Documents</h3>
                 {isEditing && editFormData ? (
                   <DocumentsFormSection
                     // Pass the correct subset of data and the general handler
                     data={{ documents: editFormData.documents }}
                     onChange={handleFormChange} // Use general handler
                     // onAddItem and onRemoveItem likely handled internally
                     isSaving={isSaving}
                   />
                 ) : (
                   <ul className="list-group list-group-flush">
                     {Array.isArray(currentFormDataForDisplay.documents) && currentFormDataForDisplay.documents.length > 0 && (currentFormDataForDisplay.documents[0]?.title || currentFormDataForDisplay.documents[0]?.url) ? (
                         currentFormDataForDisplay.documents.map((doc: { title?: string; url?: string }, index: number) => (
                             <li key={index} className="list-group-item bg-transparent px-0">
                                 {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.title || 'View Document'}</a> : (doc.title || 'N/A')}
                             </li>
                         ))
                     ) : (<li className="list-group-item bg-transparent px-0">No documents available.</li>)}
                   </ul>
                 )}
              </div>

              {/* Media Section */}
              <div className="facility-section">
                <h3>Media</h3>
                 {isEditing && editFormData ? (
                    // Pass specific handler for media updates
                    <MediaFormSection
                        facilityId={id!} // Use non-null assertion if id is guaranteed
                        data={{ images: editFormData.images }} // Pass only images array
                        onFormDataChange={handleMediaFormChange} // Use the specific handler
                        isSaving={isSaving}
                    />
                 ) : (
                   <div className="image-gallery-placeholder">
                     {Array.isArray(currentFormDataForDisplay.images) && currentFormDataForDisplay.images.length > 0 && currentFormDataForDisplay.images[0] !== '' ? (
                         <div className="image-gallery-container d-flex flex-wrap">
                             {currentFormDataForDisplay.images.map((imageUrl, index) => (
                                 imageUrl && <img key={index} src={imageUrl} alt={`Facility ${index + 1}`} className="img-thumbnail me-2 mb-2 facility-gallery-image" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', cursor: 'pointer' }} onError={(e: SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.style.display = 'none'; }} onClick={() => window.open(imageUrl, '_blank')} />
                             ))}
                         </div>
                     ) : (<p>No images available.</p>)}
                   </div>
                 )}
              </div>

              {/* Environmental Impact Section */}
              <div className="facility-section">
                <h3>Environmental Impact</h3>
                {isEditing && editFormData ? (
                   <EnvironmentalFormSection
                     data={{ environmentalImpact: editFormData.environmentalImpact }}
                     onChange={handleFormChange}
                     isSaving={isSaving}
                   />
                ) : (
                  <p>{currentFormDataForDisplay.environmentalImpact?.details || 'Details not available.'}</p>
                )}
              </div>

            </div>
          </div> {/* End facility-content-grid */}
        </div> {/* End card-body */}
      </div> {/* End card */}
    </div> /* End container */
  );
};

export default FacilityDetailPage;