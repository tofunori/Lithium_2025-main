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
    activeTab?: string;
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
  const [activeTab, setActiveTab] = useState<string>(location.state?.activeTab || 'overview');
  const [editingTabKey, setEditingTabKey] = useState<string | null>(null);
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

  // Update location state when tab changes (optional)
  useEffect(() => {
    if (!editingTabKey) {
      window.history.replaceState({ ...window.history.state, activeTab }, '', `${location.pathname}${location.search}`);
    }
  }, [activeTab, editingTabKey, location.pathname, location.search]);


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
  // UPDATED: Map from flat Facility structure
  const prepareFormData = (facilityData: Facility): SupabaseFacilityFormData => {
      // Map Facility (DB structure) to SupabaseFacilityFormData (Form structure)
      return {
          id: facilityData.id, // Include id
          // Map flat properties to form fields
          company_name: facilityData.company_name ?? '',
          address: facilityData.address ?? '', // Use address directly
          city: facilityData.city ?? '', // Add city if needed in form
          status_name: facilityData.status_name ?? 'Planned', // Default if undefined
          status_effective_date_text: facilityData.status_effective_date_text ?? '',
          processing_capacity_mt_year: facilityData.processing_capacity_mt_year ?? '',
          ev_equivalent_per_year: facilityData.ev_equivalent_per_year ?? '',
          jobs: facilityData.jobs ?? '',
          technology_name: facilityData.technology_name ?? '', // Add if needed in form
          technology_description: facilityData.technology_description ?? '', // Use technology_description
          notes: facilityData.notes ?? '', // Use notes
          latitude: facilityData.latitude ?? null,
          longitude: facilityData.longitude ?? null,
          website: facilityData.website ?? '', // Assuming website is a direct column now or handled in form data
          feedstock: facilityData.feedstock ?? '', // Assuming feedstock is direct or handled
          product: facilityData.product ?? '', // Assuming product is direct or handled
          contactPerson: facilityData.contactPerson ?? '', // Assuming contactPerson is direct or handled
          contactEmail: facilityData.contactEmail ?? '', // Assuming contactEmail is direct or handled
          contactPhone: facilityData.contactPhone ?? '', // Assuming contactPhone is direct or handled

          // Map investment_usd (DB) to investment.total (Form)
          investment: { total: facilityData.investment_usd ?? '' },

          // Keep structures for fields managed within the form state (if not flattened in DB)
          // Ensure timeline structure matches SupabaseFacilityFormData (FacilityTimelineEvent[])
          // These might need fetching from related tables if they were normalized
          // Assuming these fields might not be directly on the Facility object anymore
          timeline: (facilityData as any).timeline || [{ date: '', event: '' }], // Use 'as any' or fetch separately
          images: (facilityData as any).images || [''], // Use 'as any' or fetch separately
          documents: (facilityData as any).documents || [{ title: '', url: '' }], // Use 'as any' or fetch separately
          environmentalImpact: { details: (facilityData as any).environmentalImpact?.details || '' }, // Use 'as any' or fetch separately
      };
  };


  const handleEdit = () => {
    if (isAuthenticated && facility) {
      const initialFormData = prepareFormData(facility);
      setEditFormData(initialFormData);
      setEditingTabKey(activeTab);
    } else if (!isAuthenticated) {
      alert('You must be logged in to edit facilities.');
      // Optionally redirect to login: navigate('/login');
    }
  };

  const handleCancel = () => {
    setEditingTabKey(null);
    setEditFormData(null);
    setError(null);
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
      if (refreshedFacility) {
        setFacility(refreshedFacility);
      }

      setEditingTabKey(null);
      setEditFormData(null);
      alert('Facility updated successfully!');
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

  // Type the tabs array
  const tabs: { key: string; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'technical', label: 'Technical Details' },
    { key: 'media', label: 'Media' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'documents', label: 'Documents' },
    { key: 'environmental', label: 'Environmental Impact' },
    { key: 'investment', label: 'Investment & Funding' },
    { key: 'contact', label: 'Contact Information' },
  ];

  // Helper to render form sections or view content
  const renderTabContent = () => {
      const isEditingCurrentTab = editingTabKey === activeTab;
      // For viewing, use currentFormDataForDisplay (mapped from facility or edit state)
      const dataForView = currentFormDataForDisplay; // Use prepared form data for view consistency
      const dataForEdit = editFormData; // Use edit state for editing (SupabaseFacilityFormData)

      // Define props for form sections generically
      // Pass dataForEdit which is SupabaseFacilityFormData
      const commonEditProps = {
          data: dataForEdit,
          onChange: handleFormChange, // General handler
          isSaving: isSaving,
      };

      const renderViewOrEdit = (ViewComponent: React.ReactNode, EditComponent: React.ComponentType<any> | null) => {
          // Ensure dataForEdit is not null when rendering the edit component
          return isEditingCurrentTab && EditComponent && dataForEdit ? <EditComponent {...commonEditProps} data={dataForEdit} /> : ViewComponent;
      };

      const renderArrayEdit = (
          ViewComponent: React.ReactNode,
          EditComponent: React.ComponentType<any> | null,
          itemHandlers: {
              onChange: (index: number, field: any, value: any) => void;
              onAddItem: () => void;
              onRemoveItem: (index: number) => void;
          }
      ) => {
           // Ensure dataForEdit is not null when rendering the edit component
           if (isEditingCurrentTab && EditComponent && dataForEdit) {
               const editProps = {
                   ...commonEditProps, // Includes data, isSaving
                   data: dataForEdit, // Pass the non-null edit data (SupabaseFacilityFormData)
                   // Pass specific item handlers
                   onItemChange: itemHandlers.onChange,
                   onAddItem: itemHandlers.onAddItem,
                   onRemoveItem: itemHandlers.onRemoveItem,
               };
               return <EditComponent {...editProps} />;
           }
           return ViewComponent;
      };


      switch (activeTab) {
          case 'overview':
              return renderViewOrEdit(
                  // View Mode Content - Use dataForView (mapped from facility or edit state)
                  <>
                      <div className="row mb-3">
                          {/* UPDATED: Use dataForView.address */}
                          <div className="col-md-6"><strong>Location:</strong><p>{dataForView.address || 'N/A'}</p></div>
                          {/* UPDATED: Use dataForView.status_name */}
                          <div className="col-md-6"><strong>Status:</strong><p>{renderStatusBadge(dataForView.status_name)}</p></div>
                      </div>
                      <div className="row mb-3">
                          <div className="col-md-6"><strong>Website:</strong><p>{dataForView.website ? <a href={dataForView.website} target="_blank" rel="noopener noreferrer">{dataForView.website}</a> : 'N/A'}</p></div>
                           {/* UPDATED: Display coordinates if available, check type for toFixed */}
                           {typeof dataForView.latitude === 'number' && typeof dataForView.longitude === 'number' && (
                               <div className="col-md-6"><strong>Coordinates:</strong><p>{dataForView.latitude.toFixed(5)}, {dataForView.longitude.toFixed(5)}</p></div>
                           )}
                      </div>
                      <div className="row mb-4">
                          {/* UPDATED: Use dataForView.notes */}
                          <div className="col-12"><h3 className="sub-section-heading">Notes</h3><p>{dataForView.notes || 'Notes not available.'}</p></div>
                      </div>
                  </>,
                  // Edit Mode Component
                   (props: any) => (
                       <>
                           {/* UPDATED: Pass correct props to BasicInfoFormSection */}
                           <BasicInfoFormSection {...props} data={{ company: props.data?.company_name, location: props.data?.address, status: props.data?.status_name }} />
                           {/* UPDATED: Edit notes instead of description */}
                           <div className="mb-3">
                               <label htmlFor="edit-notes" className="form-label">Notes:</label>
                               <textarea className="form-control" id="edit-notes" name="notes" value={props.data?.notes || ''} onChange={props.onChange} rows={4} disabled={props.isSaving}></textarea>
                           </div>
                           <div className="mb-3">
                               <label htmlFor="edit-website" className="form-label">Website:</label>
                               <input type="url" className="form-control" id="edit-website" name="website" value={props.data?.website || ''} onChange={props.onChange} disabled={props.isSaving} />
                           </div>
                           {/* UPDATED: Edit latitude/longitude */}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="edit-latitude" className="form-label">Latitude:</label>
                                    <input type="number" step="any" className="form-control" id="edit-latitude" name="latitude" value={props.data?.latitude ?? ''} onChange={props.onChange} disabled={props.isSaving} />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="edit-longitude" className="form-label">Longitude:</label>
                                    <input type="number" step="any" className="form-control" id="edit-longitude" name="longitude" value={props.data?.longitude ?? ''} onChange={props.onChange} disabled={props.isSaving} />
                                </div>
                            </div>
                       </>
                   )
              );

          case 'technical':
              return renderViewOrEdit(
                  // View Mode Content - Use dataForView
                  <>
                      <div className="row mb-3">
                          {/* UPDATED: Use processing_capacity_mt_year */}
                          <div className="col-md-6"><strong>Volume (tons/year):</strong><p>{dataForView.processing_capacity_mt_year || 'N/A'}</p></div>
                          {/* UPDATED: Use technology_name (assuming it's in form data) */}
                          <div className="col-md-6"><strong>Method/Technology:</strong><p>{dataForView.technology_name || 'N/A'}</p></div>
                      </div>
                      <div className="row mb-3">
                          <div className="col-md-6"><strong>Feedstock:</strong><p>{dataForView.feedstock || 'N/A'}</p></div>
                          <div className="col-md-6"><strong>Product:</strong><p>{dataForView.product || 'N/A'}</p></div>
                      </div>
                      <div className="row mb-4">
                          {/* UPDATED: Use technology_description */}
                          <div className="col-12"><h3 className="sub-section-heading">Technology Description</h3><pre>{dataForView.technology_description || 'Description not available.'}</pre></div>
                      </div>
                  </>,
                  // Edit Mode Component - UPDATED: Pass correct props to TechnicalFormSection
                  (props: any) => <TechnicalFormSection {...props} data={{ capacity: props.data?.processing_capacity_mt_year, technology: props.data?.technology_name, feedstock: props.data?.feedstock, product: props.data?.product, technicalSpecs: props.data?.technology_description }} /> // Map capacity->processing_capacity, tech->technology_name, specs->technology_description
              );

          case 'media':
               return renderViewOrEdit(
                   // View Mode Content - Use dataForView
                   <div className="image-gallery-placeholder">
                       {Array.isArray(dataForView.images) && dataForView.images.length > 0 && dataForView.images[0] !== '' ? (
                           <div className="image-gallery-container d-flex flex-wrap">
                               {dataForView.images.map((imageUrl, index) => (
                                   imageUrl && <img key={index} src={imageUrl} alt={`Facility ${index + 1}`} className="img-thumbnail me-2 mb-2 facility-gallery-image" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', cursor: 'pointer' }} onError={(e: SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.style.display = 'none'; }} onClick={() => window.open(imageUrl, '_blank')} />
                               ))}
                           </div>
                       ) : (<p>No images available.</p>)}
                   </div>,
                   // Edit Mode Component - Pass specific handler for media updates
                   (props: any) => <MediaFormSection {...props} facilityId={id!} data={{ images: props.data?.images }} onFormDataChange={handleMediaFormChange} /> // Use non-null assertion for id
               );

           case 'timeline':
                return renderArrayEdit(
                    // View Mode Content - Use dataForView
                    <ul className="list-group list-group-flush">
                        {Array.isArray(dataForView.timeline) && dataForView.timeline.length > 0 && dataForView.timeline[0]?.event ? (
                            dataForView.timeline.map((item, index) => (
                                <li key={index} className="list-group-item"><strong>{item.date}:</strong> {item.event} {item.description ? `- ${item.description}` : ''}</li>
                            ))
                        ) : (<li className="list-group-item">No timeline events available.</li>)}
                    </ul>,
                    // Edit Mode Component
                    TimelineFormSection,
                    // Pass timeline-specific handlers
                    { onChange: handleTimelineChange, onAddItem: addTimelineItem, onRemoveItem: removeTimelineItem }
                );

            case 'documents':
                 return renderArrayEdit(
                     // View Mode Content - Use dataForView
                     <ul className="list-group list-group-flush">
                         {Array.isArray(dataForView.documents) && dataForView.documents.length > 0 && (dataForView.documents[0]?.title || dataForView.documents[0]?.url) ? (
                             dataForView.documents.map((doc: any, index: number) => ( // Added type annotation
                                 <li key={index} className="list-group-item">
                                     {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.title || 'View Document'}</a> : (doc.title || 'N/A')}
                                 </li>
                             ))
                         ) : (<li className="list-group-item">No documents available.</li>)}
                     </ul>,
                     // Edit Mode Component
                     DocumentsFormSection,
                     // Pass document-specific handlers
                     { onChange: handleDocumentChange, onAddItem: addDocumentItem, onRemoveItem: removeDocumentItem }
                 );

          case 'environmental':
              return renderViewOrEdit(
                  // View Mode Content - Use dataForView
                  <div><h3 className="sub-section-heading">Details</h3><p>{dataForView.environmentalImpact?.details || 'Details not available.'}</p></div>,
                  // Edit Mode Component
                  EnvironmentalFormSection // Expects data={{ environmentalImpact: { details: ... } }}
              );

          case 'investment':
              return renderViewOrEdit(
                  // View Mode Content - Use dataForView
                  // UPDATED: Display investment.total (mapped from investment_usd)
                  <div><h3 className="sub-section-heading">Total Investment</h3><p>{dataForView.investment?.total || 'Details not available.'}</p></div>,
                  // Edit Mode Component
                  InvestmentFormSection // Expects data={{ investment: { total: ... } }}
              );

          case 'contact':
              return renderViewOrEdit(
                  // View Mode Content - Use dataForView
                  <>
                      <div className="row mb-2">
                          <div className="col-md-4"><strong>Contact Person:</strong><p>{dataForView.contactPerson || 'N/A'}</p></div>
                          <div className="col-md-4"><strong>Contact Email:</strong><p>{dataForView.contactEmail || 'N/A'}</p></div>
                          <div className="col-md-4"><strong>Contact Phone:</strong><p>{dataForView.contactPhone || 'N/A'}</p></div>
                      </div>
                  </>,
                  // Edit Mode Component
                  ContactFormSection // Expects data={{ contactPerson: ..., contactEmail: ..., contactPhone: ... }}
              );

          default:
              return <p>This section is under construction.</p>;
      }
  };


  return (
    <div className="container mt-4 facility-detail-page">
      <div className="card shadow-sm">
        <div className="card-header facility-header d-flex justify-content-between align-items-center flex-wrap">
          <div>
            {/* UPDATED: Display company_name */}
            <h1 className="h3 mb-0">{facility.company_name || 'Facility Details'}</h1>
            {/* UPDATED: Display status_name */}
            {renderStatusBadge(facility.status_name)}
          </div>
          <div>
            {isAuthenticated && !editingTabKey && (
              <button className="btn btn-outline-primary btn-sm me-2" onClick={handleEdit}>
                <i className="fas fa-edit me-1"></i> Edit Section
              </button>
            )}
            {editingTabKey && (
              <>
                <button className="btn btn-success btn-sm me-2" onClick={handleSave} disabled={isSaving}>
                  <i className="fas fa-save me-1"></i> {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleCancel} disabled={isSaving}>
                  <i className="fas fa-times me-1"></i> Cancel
                </button>
              </>
            )}
            <Link to="/facilities" className="btn btn-outline-secondary btn-sm">
              <i className="fas fa-arrow-left me-1"></i> Back to List
            </Link>
          </div>
        </div>

        {/* Display saving error */}
        {error && editingTabKey && <div className="alert alert-danger m-3">{error}</div>}

        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            {tabs.map(tab => (
              <li className="nav-item" key={tab.key}>
                <button
                  type="button"
                  className={`nav-link ${activeTab === tab.key ? 'active' : ''} ${editingTabKey && editingTabKey !== tab.key ? 'disabled' : ''}`}
                  onClick={() => !editingTabKey && setActiveTab(tab.key)} // Prevent switching tabs while editing
                  disabled={!!(editingTabKey && editingTabKey !== tab.key)} // FIX: Coerce to boolean
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="tab-content p-3 border bg-light">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailPage;