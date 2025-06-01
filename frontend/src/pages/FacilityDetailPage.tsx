// frontend/src/pages/FacilityDetailPage.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useLocation, Location } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';

// Import new facility components
import FacilityHeader from '../components/facility/FacilityHeader';
import FacilityBasicInfo from '../components/facility/FacilityBasicInfo';
import FacilityTechnicalDetails from '../components/facility/FacilityTechnicalDetails';
import FacilityTimeline from '../components/facility/FacilityTimeline';
import FacilityDocuments from '../components/facility/FacilityDocuments';
import FacilityMedia from '../components/facility/FacilityMedia';
import FacilityInvestment from '../components/facility/FacilityInvestment';
import FacilityNotes from '../components/facility/FacilityNotes';
import FacilityEnvironmentalImpact from '../components/facility/FacilityEnvironmentalImpact';

// Import status utils
import { getCanonicalStatus, getStatusLabel, getStatusClass } from '../utils/statusUtils';

import './FacilityDetailPage.css';
import '../components/EditFacilityForm.css';

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
        <FacilityHeader
          facilityId={id!}
          companyName={displayData.Company}
          operationalStatus={displayData["Operational Status"]}
          isAuthenticated={isAuthenticated}
          isEditing={isEditing}
          isSaving={isSaving}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          renderStatusBadge={renderStatusBadge}
        />

        {/* Display saving error - Only when editing */}
        {error && isEditing && <div className="alert alert-danger m-3">{error}</div>}

        <div className="card-body">
          <div className="facility-content-grid">
            {/* --- Column 1 --- */}
            <div>
              <FacilityBasicInfo
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
                renderStatusBadge={renderStatusBadge}
              />

              <FacilityInvestment
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
              />

              <FacilityNotes
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
              />
            </div>

            {/* --- Column 2 --- */}
            <div>
              <FacilityTechnicalDetails
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
              />

              <FacilityTimeline
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
                onAddItem={addTimelineItem}
                onRemoveItem={removeTimelineItem}
              />

              <FacilityDocuments
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
                onAddItem={addDocumentItem}
                onRemoveItem={removeDocumentItem}
              />

              <FacilityMedia
                facilityId={id!}
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                imagePublicUrls={imagePublicUrls}
                onFormDataChange={handleMediaFormChange}
              />

              <FacilityEnvironmentalImpact
                isEditing={isEditing}
                isSaving={isSaving}
                displayData={displayData}
                formData={formDataForEdit}
                onChange={handleFormChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailPage;
