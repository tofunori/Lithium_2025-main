// frontend/src/pages/FacilityDetailPage.tsx
import React, { useState, useEffect, ChangeEvent, SyntheticEvent } from 'react';
import { useParams, Link, useLocation, Location } from 'react-router-dom';
// UPDATED: Import necessary types from supabaseDataService
import {
    getFacilityById,
    updateFacility,
    FullFacilityData,
    FacilityFormData,
    FacilityTimelineEvent,
    FacilityDocument,
    FacilityImage,
    getFilePublicUrl
} from '../services';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext provides user info

// Import form section components
import BasicInfoFormSection from '../components/formSections/BasicInfoFormSection';
import TechnicalFormSection from '../components/formSections/TechnicalFormSection';
import MediaFormSection from '../components/formSections/MediaFormSection';
import TimelineFormSection from '../components/formSections/TimelineFormSection';
import DocumentsFormSection from '../components/formSections/DocumentsFormSection';
import EnvironmentalFormSection from '../components/formSections/EnvironmentalFormSection';
import InvestmentFormSection from '../components/formSections/InvestmentFormSection';
// import ContactFormSection from '../components/formSections/ContactFormSection'; // Removed import

// Import status utils - Get all needed functions
import { getCanonicalStatus, getStatusLabel, getStatusClass } from '../utils/statusUtils';

import './FacilityDetailPage.css';
import '../components/EditFacilityForm.css'; // Keep for now

// --- Interfaces and Types ---

// Type for location state passed via Link/navigate
interface LocationState {
    // activeTab?: string; // Removed as tabs are gone
}

// REMOVED Local type definition - Use CanonicalStatus from utils if needed elsewhere
// type FacilityStatusStyleKey = 'planned' | 'construction' | 'operating' | 'unknown';


// --- Component ---
const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation() as Location<LocationState | undefined>;
  const { currentUser } = useAuth();

  // UPDATED: State uses FullFacilityData for fetched data
  const [facility, setFacility] = useState<FullFacilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // New state for in-page editing
  // UPDATED: State uses the nested FacilityFormData for editing
  const [editFormData, setEditFormData] = useState<FacilityFormData | null>(null);
  // State to store generated public URLs for display
  const [imagePublicUrls, setImagePublicUrls] = useState<Record<string, string>>({});

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
        // getFacilityById now returns FullFacilityData | null
        const facilityData = await getFacilityById(id);
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

  // Effect to generate public URLs when facility data changes (and not editing)
  useEffect(() => {
    if (facility?.facility_images && !isEditing) {
      const generateUrls = async () => {
        const urls: Record<string, string> = {};
        for (const img of facility.facility_images) {
          if (img.image_url) { // image_url here is the path
            const publicUrl = await getFilePublicUrl('facility-images', img.image_url);
            if (publicUrl) {
              urls[img.image_url] = publicUrl; // Map path to public URL
            }
          }
        }
        setImagePublicUrls(urls);
      };
      generateUrls();
    } else if (!isEditing) {
        // Clear URLs if no images or when exiting edit mode without saving new ones
        setImagePublicUrls({});
    }
    // Dependency array includes facility.facility_images and isEditing
  }, [facility?.facility_images, isEditing]);


  // REFACTORED: renderStatusBadge uses utility functions for consistency
  const renderStatusBadge = (statusName: string | undefined | null): React.ReactNode => {
    const canonicalStatus = getCanonicalStatus(statusName);
    const label = getStatusLabel(canonicalStatus); // Get label from utils
    const className = `status-badge ${getStatusClass(canonicalStatus)}`; // Get base class + specific class from utils
    // Use the original statusName for display if it exists and isn't handled by getStatusLabel (e.g., "On Hold"), otherwise use the canonical label.
    const displayLabel = statusName && label === 'Unknown' ? statusName : label;
    return <span className={className}>{displayLabel}</span>;
  };


  // UPDATED: prepareFormData maps from FullFacilityData to nested FacilityFormData
  const prepareFormData = (facilityData: FullFacilityData): FacilityFormData => {
      // Map FullFacilityData (DB structure + relations) to FacilityFormData (Form structure)
      return {
          // Core Fields
          id: facilityData.ID,
          company_name: facilityData.Company ?? '',
          facility_name_site: facilityData["Facility Name/Site"] ?? '',
          address: facilityData.Location ?? '',
          status_name: facilityData["Operational Status"] ?? 'Planned',
          technology_name: facilityData["Primary Recycling Technology"] ?? '',
          technology_category: facilityData.technology_category ?? '',
          processing_capacity_mt_year: facilityData.capacity_tonnes_per_year ?? '', // Use numeric column name
          latitude: facilityData.Latitude ?? '', // Keep as string/number for form
          longitude: facilityData.Longitude ?? '', // Keep as string/number for form

          // Nested Details Fields
          details: {
              technology_description: facilityData.facility_details?.technology_description ?? '',
              notes: facilityData.facility_details?.notes ?? '',
              website: facilityData.facility_details?.website ?? '',
              feedstock: facilityData.facility_details?.feedstock ?? '',
              product: facilityData.facility_details?.product ?? '',
              investment_usd: facilityData.facility_details?.investment_usd ?? '',
              jobs: facilityData.facility_details?.jobs ?? '',
              ev_equivalent_per_year: facilityData.facility_details?.ev_equivalent_per_year ?? '',
              environmental_impact_details: facilityData.facility_details?.environmental_impact_details ?? '',
              status_effective_date_text: facilityData.facility_details?.status_effective_date_text ?? '',
          },

          // Related Lists
          // Ensure timeline dates are strings for form inputs if necessary
          timeline: facilityData.facility_timeline_events?.map(event => ({
              ...event,
              event_date: event.event_date ? String(event.event_date) : null
          })) || [{ event_date: '', event_name: '', description: '' }], // Default empty item

          documents: facilityData.facility_documents?.length > 0
              ? facilityData.facility_documents
              : [{ title: '', url: '' }], // Default empty item

          images: facilityData.facility_images?.length > 0
              ? facilityData.facility_images
              : [{ image_url: '', alt_text: '', order: 0 }], // Default empty item structure
      };
  };


  const handleEdit = () => {
    if (isAuthenticated && facility) {
      // Prepare form data using the updated function
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

  // handleSave uses Supabase updateFacility which now accepts the nested FacilityFormData
  const handleSave = async () => {
    if (!editFormData || !id) return;


    setIsSaving(true);
    setError(null);
    try {
        // Pass the facility ID and the entire nested editFormData object
        await updateFacility(id, editFormData);

      // Instead of re-fetching, update local state directly from saved form data
      // Construct the updated FullFacilityData object from editFormData
      // Note: This assumes editFormData contains all necessary fields or
      // we merge it with the existing facility state if needed.
      // For simplicity, we'll reconstruct based on editFormData, assuming it's complete.
      const updatedFacilityState: FullFacilityData = {
          // Map core fields back
          ID: editFormData.id!, // Assume id exists
          Company: editFormData.company_name ?? null,
          "Facility Name/Site": editFormData.facility_name_site ?? null,
          Location: editFormData.address ?? null,
          "Operational Status": editFormData.status_name ?? null,
          "Primary Recycling Technology": editFormData.technology_name ?? null,
          technology_category: editFormData.technology_category ?? null,
          capacity_tonnes_per_year: editFormData.processing_capacity_mt_year ? Number(editFormData.processing_capacity_mt_year) : null,
          Latitude: editFormData.latitude ? Number(editFormData.latitude) : null,
          Longitude: editFormData.longitude ? Number(editFormData.longitude) : null,
          created_at: facility?.created_at, // Preserve original created_at
          // Map details back
          facility_details: editFormData.details ? {
              facility_id: editFormData.id!,
              technology_description: editFormData.details.technology_description ?? null,
              notes: editFormData.details.notes ?? null,
              website: editFormData.details.website ?? null,
              feedstock: editFormData.details.feedstock ?? null,
              product: editFormData.details.product ?? null,
              // Ensure value assigned to state matches the FacilityDetails interface (string | null)
              investment_usd: editFormData.details.investment_usd !== null && editFormData.details.investment_usd !== undefined ? String(editFormData.details.investment_usd) : null,
              jobs: editFormData.details.jobs ? Number(editFormData.details.jobs) : null,
              ev_equivalent_per_year: editFormData.details.ev_equivalent_per_year ? Number(editFormData.details.ev_equivalent_per_year) : null,
              environmental_impact_details: editFormData.details.environmental_impact_details ?? null,
              status_effective_date_text: editFormData.details.status_effective_date_text ?? null,
          } : null,
          // Map related lists back
          facility_timeline_events: editFormData.timeline || [],
          facility_documents: editFormData.documents || [],
          facility_images: editFormData.images || [],
      };

      // Update the local state with the reconstructed data
      setFacility(updatedFacilityState);
      console.log('[handleSave] Updated local facility state from form data:', updatedFacilityState);

      // REMOVED Re-fetch:
      // const refreshedFacility = await getFacilityById(id);
      // console.log('[handleSave] Refreshed facility data:', refreshedFacility);
      // if (refreshedFacility) {
      //   setFacility(refreshedFacility); // Update state with FullFacilityData
      // }

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

  // UPDATED: handleFormChange needs to handle nested 'details' object and arrays
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // For checkboxes

    let processedValue: string | number | boolean | null = type === 'checkbox' ? checked : value;
    // Allow empty string for number inputs initially, convert to null or number on processing
    // REMOVED 'details.investment_usd' from this check as its textarea expects text
    const isNumericDetailField = ['details.jobs', 'details.ev_equivalent_per_year'].includes(name);
    const isCoordField = ['latitude', 'longitude'].includes(name);
    const isCapacityField = name === 'processing_capacity_mt_year';

    if (type === 'number' || isNumericDetailField || isCoordField || isCapacityField) {
         processedValue = value === '' ? '' : (isCoordField ? parseFloat(value) : Number(value));
    }


    setEditFormData(prevData => {
      if (!prevData) return null;

      // Handle nested 'details' properties more robustly
      if (name.startsWith('details.')) {
        const detailKey = name.split('.')[1] as keyof NonNullable<FacilityFormData['details']>;
        // Create a new details object with the updated value
        const newDetails = {
          ...(prevData.details || {}), // Copy existing details
          [detailKey]: processedValue, // Set the new value (which is the pasted string)
        };
        // Return the updated state with the new details object
        return {
          ...prevData,
          details: newDetails,
        };
      }

      // Handle array properties (Timeline, Documents) - Requires specific logic based on input names like 'timeline[0].event_name'
      const arrayMatch = name.match(/^(\w+)\[(\d+)\]\.(\w+)$/); // e.g., timeline[0].event_name
      if (arrayMatch) {
          const arrayName = arrayMatch[1] as keyof Pick<FacilityFormData, 'timeline' | 'documents'>; // 'timeline' or 'documents'
          const index = parseInt(arrayMatch[2], 10);
          const fieldName = arrayMatch[3]; // 'event_name', 'title', 'url', etc.

          if (arrayName === 'timeline' && prevData.timeline && prevData.timeline[index]) {
              const updatedTimeline = [...prevData.timeline];
              // Ensure the field exists on FacilityTimelineEvent before assigning
              if (fieldName in updatedTimeline[index]) {
                  updatedTimeline[index] = {
                      ...updatedTimeline[index],
                      [fieldName as keyof FacilityTimelineEvent]: processedValue // Update specific field
                  };
                  return { ...prevData, timeline: updatedTimeline };
              }
          } else if (arrayName === 'documents' && prevData.documents && prevData.documents[index]) {
              const updatedDocuments = [...prevData.documents];
               // Ensure the field exists on FacilityDocument before assigning
              if (fieldName in updatedDocuments[index]) {
                  updatedDocuments[index] = {
                      ...updatedDocuments[index],
                      [fieldName as keyof FacilityDocument]: processedValue // Update specific field
                  };
                  return { ...prevData, documents: updatedDocuments };
              }
          } else {
               console.warn(`[handleFormChange] Invalid array update: ${name}`);
               return prevData;
          }
      }


      // Handle top-level properties (core facility fields)
      // Ensure the key exists on FacilityFormData before assigning
      const topLevelKey = name as keyof FacilityFormData;
      if (topLevelKey in prevData) {
          return {
              ...prevData,
              [topLevelKey]: processedValue,
          };
      } else {
          console.warn(`[handleFormChange] Attempted to update unknown field: ${name}`);
          return prevData; // Return previous state if field name is not recognized
      }
    });
  };

  // UPDATED: handleMediaFormChange accepts image URLs/paths (string[]) from MediaFormSection
  // and maps them to FacilityImage[] for the main state.
  // The 'update' parameter type matches MediaFormSection's onFormDataChange prop type.
  const handleMediaFormChange = (update: Partial<{ images: string[] }>): void => {
      setEditFormData(prevData => {
          if (!prevData) return null;
          if (update.images !== undefined) { // Check if images array is being updated
              // Map the incoming string array (URLs/paths) to FacilityImage objects
              const newImages: FacilityImage[] = update.images.map((url, index) => ({
                  id: undefined, // Let DB generate ID
                  facility_id: id, // Link to current facility
                  image_url: url, // Store the path/url
                  alt_text: `Facility Image ${index + 1}`, // Default alt text
                  order: index
              }));
              // Update the images array in the main form state
              return {
                  ...prevData,
                  images: newImages,
              };
          }
          return prevData; // Return previous state if 'images' wasn't in the update
      });
  };


   // Add/Remove handlers are now passed to the components if they expect them,
   // otherwise they might be handled internally by those components via buttons.
   // Check TimelineFormSection and DocumentsFormSection implementations.
   const addTimelineItem = (): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           // Add item matching FacilityTimelineEvent structure
           const newTimeline = [...(prevData.timeline || []), { event_date: '', event_name: '', description: '' }];
           return { ...prevData, timeline: newTimeline };
       });
   };

   const removeTimelineItem = (index: number): void => {
       setEditFormData(prevData => {
           if (!prevData || !prevData.timeline) return prevData;
           const updatedTimeline = prevData.timeline.filter((_, i) => i !== index);
           // Ensure at least one item remains if needed, or allow empty
           return { ...prevData, timeline: updatedTimeline };
       });
   };

    // Add/Remove handlers for documents
    const addDocumentItem = (): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           // Add item matching FacilityDocument structure
           const newDocuments = [...(prevData.documents || []), { title: '', url: '' }];
           return { ...prevData, documents: newDocuments };
       });
   };

    const removeDocumentItem = (index: number): void => {
       setEditFormData(prevData => {
           if (!prevData || !prevData.documents) return prevData;
           const updatedDocuments = prevData.documents.filter((_, i) => i !== index);
           return { ...prevData, documents: updatedDocuments };
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

  // Use fetched facility data for display, editFormData for editing
  const displayData = facility;
  const formDataForEdit = editFormData;

  // Define common props for form sections when editing
  // Ensure editFormData is not null when passing to sections
  const commonEditProps = formDataForEdit ? {
      data: formDataForEdit, // Pass the whole edit form data state
      onChange: handleFormChange, // General handler for simple inputs
      isSaving: isSaving,
  } : { data: null, onChange: () => {}, isSaving: isSaving }; // Provide default/empty props if not editing


  // --- Render ---
  return (
    <div className="container mt-4 facility-detail-page">
      <div className="card shadow-sm">
        <div className="card-header facility-header d-flex justify-content-between align-items-center flex-wrap">
          <div>
            {/* Display Company and Status from the fetched facility data */}
            <h1 className="h3 mb-0">{displayData.Company || 'Facility Details'}</h1>
            {renderStatusBadge(displayData["Operational Status"])}
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
                {isEditing && formDataForEdit ? (
                  <>
                    {/* Pass specific props needed by BasicInfoFormSection, handling potential nulls */}
                    <BasicInfoFormSection
                        data={{ company: formDataForEdit.company_name ?? '', location: formDataForEdit.address ?? '', status: formDataForEdit.status_name ?? '' }}
                        onChange={handleFormChange}
                        isSaving={isSaving}
                    />
                     {/* Website Input - now part of details */}
                     <div className="mb-3">
                         <label htmlFor="edit-details.website" className="form-label">Website:</label>
                         <input type="url" className="form-control" id="edit-details.website" name="details.website" value={formDataForEdit.details?.website || ''} onChange={handleFormChange} disabled={isSaving} />
                     </div>
                     {/* Coordinates Input - core fields */}
                      <div className="row">
                          <div className="col-md-6 mb-3">
                              <label htmlFor="edit-latitude" className="form-label">Latitude:</label>
                              <input type="number" step="any" className="form-control" id="edit-latitude" name="latitude" value={formDataForEdit.latitude ?? ''} onChange={handleFormChange} disabled={isSaving} />
                          </div>
                          <div className="col-md-6 mb-3">
                              <label htmlFor="edit-longitude" className="form-label">Longitude:</label>
                              <input type="number" step="any" className="form-control" id="edit-longitude" name="longitude" value={formDataForEdit.longitude ?? ''} onChange={handleFormChange} disabled={isSaving} />
                          </div>
                      </div>
                  </>
                ) : (
                  <>
                    <div className="row mb-3">
                      {/* Display data from fetched 'displayData' */}
                      <div className="col-md-6"><strong>Location:</strong><p>{displayData.Location || 'N/A'}</p></div>
                      <div className="col-md-6"><strong>Status:</strong><p>{renderStatusBadge(displayData["Operational Status"])}</p></div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6"><strong>Website:</strong><p>{displayData.facility_details?.website ? <a href={displayData.facility_details.website} target="_blank" rel="noopener noreferrer">{displayData.facility_details.website}</a> : 'N/A'}</p></div>
                      {typeof displayData.Latitude === 'number' && typeof displayData.Longitude === 'number' && (
                           <div className="col-md-6"><strong>Coordinates:</strong><p>{displayData.Latitude.toFixed(5)}, {displayData.Longitude.toFixed(5)}</p></div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Contact Info Section Removed */}

              {/* Investment Section */}
               <div className="facility-section">
                 <h3>Investment & Funding</h3>
                 {isEditing && formDataForEdit ? (
                   <InvestmentFormSection
                     // Pass the value directly using the new 'value' prop
                     value={formDataForEdit.details?.investment_usd}
                     onChange={handleFormChange} // Use general handler with name="details.investment_usd"
                     isSaving={isSaving}
                   />
                 ) : (
                   // Display data from fetched 'displayData'
                   // Simplify display to show raw value or empty string
                   <p>Total Investment (USD): {displayData.facility_details?.investment_usd || ''}</p>
                 )}
               </div>

              {/* Notes Section */}
              <div className="facility-section">
                <h3>Notes</h3>
                {isEditing && formDataForEdit ? (
                  <textarea
                    className="form-control"
                    id="edit-details.notes"
                    name="details.notes" // Use nested name
                    value={formDataForEdit.details?.notes || ''}
                    onChange={handleFormChange}
                    rows={5}
                    disabled={isSaving}
                  ></textarea>
                ) : (
                   // Display data from fetched 'displayData'
                  <p>{displayData.facility_details?.notes || 'No notes available.'}</p>
                )}
              </div>
            </div>

            {/* --- Column 2 --- */}
            <div>
              {/* Technical Details Section */}
              <div className="facility-section">
                <h3>Technical Details</h3>
                {isEditing && formDataForEdit ? (
                  <TechnicalFormSection
                    // Pass relevant core and detail fields
                    data={{
                        processing_capacity_mt_year: formDataForEdit.processing_capacity_mt_year,
                        technology_name: formDataForEdit.technology_name,
                        feedstock: formDataForEdit.details?.feedstock,
                        product: formDataForEdit.details?.product,
                        technology_description: formDataForEdit.details?.technology_description
                    }}
                    onChange={handleFormChange} // Use general handler
                    isSaving={isSaving}
                   />
                ) : (
                  <>
                    <div className="row mb-3">
                       {/* Display data from fetched 'displayData' */}
                      <div className="col-md-6"><strong>Volume (tons/year):</strong><p>{displayData.capacity_tonnes_per_year || 'N/A'}</p></div>
                      <div className="col-md-6"><strong>Method/Technology:</strong><p>{displayData["Primary Recycling Technology"] || 'N/A'}</p></div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6"><strong>Feedstock:</strong><p>{displayData.facility_details?.feedstock || 'N/A'}</p></div>
                      <div className="col-md-6"><strong>Product:</strong><p>{displayData.facility_details?.product || 'N/A'}</p></div>
                    </div>
                    <div className="row mb-0">
                      {/* Changed <pre> to <p> for consistent styling */}
                      <div className="col-12"><strong>Technology Description:</strong><p>{displayData.facility_details?.technology_description || 'Description not available.'}</p></div>
                    </div>
                  </>
                )}
              </div>

              {/* Timeline Section */}
              <div className="facility-section">
                <h3>Timeline</h3>
                {isEditing && formDataForEdit ? (
                  <TimelineFormSection
                    // Map timeline data to match expected { date, event, description } structure
                    data={{
                        timeline: formDataForEdit.timeline?.map(item => ({
                            id: item.id, // Pass id if needed by component key
                            date: String(item.event_date || ''), // Ensure string, map from event_date
                            event: item.event_name || '', // Map from event_name
                            description: item.description || ''
                        }))
                    }}
                    onChange={handleFormChange} // Use general handler (expects names like timeline[0].event)
                    // Re-adding Add/Remove handlers as component expects them
                    onAddItem={addTimelineItem}
                    onRemoveItem={removeTimelineItem}
                    isSaving={isSaving}
                  />
                ) : (
                  <ul className="list-group list-group-flush">
                     {/* Display data from fetched 'displayData' */}
                    {Array.isArray(displayData.facility_timeline_events) && displayData.facility_timeline_events.length > 0 && displayData.facility_timeline_events[0]?.event_name ? (
                        displayData.facility_timeline_events.map((item, index) => (
                            <li key={item.id || index} className="list-group-item bg-transparent px-0"><strong>{item.event_date}:</strong> {item.event_name} {item.description ? `- ${item.description}` : ''}</li>
                        ))
                    ) : (<li className="list-group-item bg-transparent px-0">No timeline events available.</li>)}
                  </ul>
                )}
              </div>

              {/* Documents Section */}
              <div className="facility-section">
                <h3>Documents</h3>
                 {isEditing && formDataForEdit ? (
                   <DocumentsFormSection
                     // Map data to match expected { title, url } structure
                     data={{
                         documents: formDataForEdit.documents?.map(doc => ({
                             id: doc.id, // Pass id if needed by component key
                             title: doc.title || '',
                             url: doc.url || '' // Assuming component expects string URL
                         }))
                     }}
                     onChange={handleFormChange} // Use general handler (expects names like documents[0].title)
                     // Add/Remove handlers are needed by the component
                     onAddItem={addDocumentItem}
                     onRemoveItem={removeDocumentItem}
                     isSaving={isSaving}
                   />
                 ) : (
                   <ul className="list-group list-group-flush">
                     {/* Display data from fetched 'displayData' */}
                     {Array.isArray(displayData.facility_documents) && displayData.facility_documents.length > 0 && (displayData.facility_documents[0]?.title || displayData.facility_documents[0]?.url) ? (
                         displayData.facility_documents.map((doc, index) => (
                             <li key={doc.id || index} className="list-group-item bg-transparent px-0">
                                 {/* TODO: Need getFilePublicUrl helper */}
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
                 {isEditing && formDataForEdit ? (
                    <MediaFormSection
                        facilityId={id!} // Use non-null assertion if id is guaranteed
                        // Pass image paths/URLs based on what ImageUploader expects
                        data={{ images: formDataForEdit.images?.map(img => img.image_url || '') }}
                        onFormDataChange={handleMediaFormChange} // Use the specific handler for image array updates
                        isSaving={isSaving}
                    />
                 ) : (
                   <div className="image-gallery-placeholder">
                     {/* Display data from fetched 'displayData' */}
                     {Array.isArray(displayData.facility_images) && displayData.facility_images.length > 0 && displayData.facility_images[0]?.image_url ? (
                         <div className="image-gallery-container d-flex flex-wrap">
                             {displayData.facility_images.map((img, index) => (
                                 // Use the generated public URL from state, ensuring img.image_url is not null/undefined
                                 img.image_url && imagePublicUrls[img.image_url] && (
                                     <img
                                         key={img.id || index}
                                         src={imagePublicUrls[img.image_url]} // Use the public URL from state
                                         alt={img.alt_text || `Facility ${index + 1}`}
                                         className="img-thumbnail me-2 mb-2 facility-gallery-image"
                                         style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', cursor: 'pointer' }}
                                         onError={(e: SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                         onClick={() => window.open(imagePublicUrls[img.image_url!], '_blank')} // Use non-null assertion if confident
                                     />
                                 )
                             ))}
                         </div>
                     ) : (<p>No images available.</p>)}
                   </div>
                 )}
              </div>

              {/* Environmental Impact Section */}
              <div className="facility-section">
                <h3>Environmental Impact</h3>
                {isEditing && formDataForEdit ? (
                   <EnvironmentalFormSection
                     // Pass the value directly using the new 'value' prop
                     value={formDataForEdit.details?.environmental_impact_details}
                     onChange={handleFormChange} // Use general handler with name="details.environmental_impact_details"
                     isSaving={isSaving}
                   />
                ) : (
                   // Display data from fetched 'displayData'
                  <p>{displayData.facility_details?.environmental_impact_details || 'Details not available.'}</p>
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
