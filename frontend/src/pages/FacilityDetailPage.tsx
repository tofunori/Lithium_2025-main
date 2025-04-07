import React, { useState, useEffect, ChangeEvent, SyntheticEvent } from 'react';
import { useParams, Link, useLocation, Location } from 'react-router-dom'; // Added useLocation, Location type
// Removed FacilityProperties import
import { getFacilityById, updateFacility, FacilityData } from '../firebase'; // Import types
import { User } from 'firebase/auth'; // Import User type
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.jsx is renamed or doesn't need extension

// Import form section components (assuming they are/will be .tsx)
import BasicInfoFormSection from '../components/formSections/BasicInfoFormSection';
import TechnicalFormSection from '../components/formSections/TechnicalFormSection';
import MediaFormSection from '../components/formSections/MediaFormSection';
import TimelineFormSection from '../components/formSections/TimelineFormSection';
import DocumentsFormSection from '../components/formSections/DocumentsFormSection';
import EnvironmentalFormSection from '../components/formSections/EnvironmentalFormSection';
import InvestmentFormSection from '../components/formSections/InvestmentFormSection';
import ContactFormSection from '../components/formSections/ContactFormSection';

import './FacilityDetailPage.css';
import '../components/EditFacilityForm.css'; // Keep for now

// --- Interfaces and Types ---

// Define the structure expected by the form sections (can be refined)
// This mirrors the structure created in facilityDataForForm
interface FacilityFormData {
    id: string;
    name: string; // Alias for company in form?
    company: string;
    location: string; // Alias for address in form?
    address: string;
    status: string;
    capacity: string | number;
    technology: string;
    description: string;
    technicalSpecs: string;
    // Update timeline item structure
    timeline: { date: string | number; event: string }[];
    images: string[];
    contactPerson: string;
    contactEmail: string;
    contactPhone: string;
    documents: { title: string; url: string }[];
    environmentalImpact: { details: string }; // Nested structure
    investment: { total: string | number }; // Nested structure
    website: string;
    feedstock: string;
    product: string;
    // Add latitude/longitude if they are part of the form data being edited directly
    latitude?: number | null;
    longitude?: number | null;
}

// Type for location state passed via Link/navigate
interface LocationState {
    activeTab?: string;
}

// Type for status badge keys
type FacilityStatusKey = 'planned' | 'underconstruction' | 'operating' | 'onhold' | 'cancelled' | 'decommissioned' | 'unknown';


// --- Component ---
const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Type useParams
  const location = useLocation() as Location<LocationState | undefined>; // Type useLocation state
  const { currentUser }: { currentUser: User | null } = useAuth(); // Type currentUser

  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(location.state?.activeTab || 'overview');
  const [editingTabKey, setEditingTabKey] = useState<string | null>(null); // Track which tab key is being edited
  const [editFormData, setEditFormData] = useState<FacilityFormData | null>(null); // Use defined interface

  // Use currentUser for authentication check
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
        const facilityData = await getFacilityById(id);
        if (facilityData) {
          setFacility(facilityData);
        } else {
          setError('Facility not found.');
          setFacility(null); // Ensure facility is null if not found
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
      // Use location.pathname + location.search for the URL part
      window.history.replaceState({ ...window.history.state, activeTab }, '', `${location.pathname}${location.search}`);
    }
  }, [activeTab, editingTabKey, location.pathname, location.search]);


  const renderStatusBadge = (status: string | undefined | null): JSX.Element => {
    const statusKey = status?.replace(/\s+/g, '')?.toLowerCase() || 'unknown';
    const statusClasses: Record<FacilityStatusKey, string> = {
      planned: 'status-badge status-planned',
      underconstruction: 'status-badge status-construction',
      operating: 'status-badge status-operating',
      onhold: 'status-badge status-onhold',
      cancelled: 'status-badge status-cancelled',
      decommissioned: 'status-badge status-decommissioned',
      unknown: 'status-badge status-unknown',
    };
    const label = status || 'Unknown';
    // Ensure statusKey is a valid key before accessing statusClasses
    const validKey = statusKey in statusClasses ? statusKey as FacilityStatusKey : 'unknown';
    const className = statusClasses[validKey];
    // console.log(`Status: "${status}", Key: "${validKey}", Class: "${className}"`); // Keep for debugging if needed
    return <span className={className}>{label}</span>;
  };

  // Prepare data in the structure expected by the forms when editing starts
  const prepareFormData = (facilityData: FacilityData): FacilityFormData => {
      const props = facilityData.properties || {};
      return {
          id: facilityData.id, // Include id if needed by forms/update logic
          name: props.company || '', // Assuming 'name' is used in BasicInfoFormSection
          company: props.company || '',
          location: props.address || '', // Assuming 'location' is used in BasicInfoFormSection
          address: props.address || '',
          status: props.status || 'Planning', // Default if undefined
          capacity: props.capacity || '',
          technology: props.technology || '',
          description: props.description || '',
          technicalSpecs: props.technicalSpecs || '',
          // Update timeline mapping to use 'date'
          timeline: props.timeline?.map(item => ({ date: item.date || '', event: item.event || '' })) || [{ date: '', event: '' }],
          images: props.images || [''], // Ensure array exists
          contactPerson: props.contactPerson || '',
          contactEmail: props.contactEmail || '',
          contactPhone: props.contactPhone || '',
          documents: props.documents || [{ title: '', url: '' }], // Ensure array exists
          // Handle potentially nested structures safely
          environmentalImpact: { details: props.environmentalImpact?.details || '' },
          // Use optional chaining for potentially missing properties
          investment: { total: props.investment?.total || '' },
          website: props.website || '',
          feedstock: props.feedstock || '',
          product: props.product || '',
          latitude: props.latitude ?? null, // Use nullish coalescing for null/undefined
          longitude: props.longitude ?? null,
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

  // Type the data structure expected by updateFacility
  const handleSave = async () => {
    if (!editFormData || !id) return;

    setIsSaving(true);
    setError(null);
    try {
        // Map editFormData back to the structure expected by updateFacility (FacilityData properties)
        const propertiesToUpdate: Partial<FacilityProperties> = {
            company: editFormData.company,
            address: editFormData.address,
            status: editFormData.status,
            capacity: editFormData.capacity,
            technology: editFormData.technology,
            description: editFormData.description,
            technicalSpecs: editFormData.technicalSpecs,
            timeline: editFormData.timeline.filter(item => item.year || item.event), // Clean empty items
            images: editFormData.images.filter(url => url && url.trim() !== ''), // Clean empty items
            contactPerson: editFormData.contactPerson,
            contactEmail: editFormData.contactEmail,
            contactPhone: editFormData.contactPhone,
            documents: editFormData.documents.filter(doc => (doc.title && doc.title.trim() !== '') || (doc.url && doc.url.trim() !== '')), // Clean empty items
            environmentalImpact: editFormData.environmentalImpact, // Assuming structure matches
            investment: editFormData.investment, // Assuming structure matches
            website: editFormData.website,
            feedstock: editFormData.feedstock,
            product: editFormData.product,
            latitude: editFormData.latitude,
            longitude: editFormData.longitude,
            // Ensure all relevant fields from FacilityProperties are included
        };

        // Get the original image list before editing started for comparison in updateFacility
        const originalImages = facility?.properties?.images || [];

        // Pass only the properties object to updateFacility
        await updateFacility(id, propertiesToUpdate, originalImages);

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
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // For checkboxes

    setEditFormData(prevData => {
      if (!prevData) return null; // Should not happen if called correctly

      // Handle nested properties (e.g., "environmentalImpact.details", "investment.total")
      if (name.includes('.')) {
        const [outerKey, innerKey] = name.split('.') as [keyof FacilityFormData, string];
        // Ensure the outer key exists and is an object
        if (prevData[outerKey] && typeof prevData[outerKey] === 'object') {
            // Create a new nested object with the updated value
            const updatedNestedObject = {
                ...(prevData[outerKey] as object), // Cast to object
                [innerKey]: type === 'checkbox' ? checked : value,
            };
            return {
                ...prevData,
                [outerKey]: updatedNestedObject,
            };
        } else {
             console.warn(`Cannot update nested property for non-object key: ${outerKey}`);
             return prevData; // Return previous state if structure is unexpected
        }
      }

      // Handle top-level properties
      return {
        ...prevData,
        [name]: type === 'checkbox' ? checked : value,
      };
    });
  };

  // Handles updates specifically from the MediaFormSection (images array) - Type update
  const handleMediaFormChange = (update: Partial<Pick<FacilityFormData, 'images'>>): void => {
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
   const handleTimelineChange = (index: number, field: keyof FacilityFormData['timeline'][0], value: string | number): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           const updatedTimeline = [...prevData.timeline];
           // Ensure field is 'date' or 'event' before updating
           const updatedItem = { ...updatedTimeline[index], [field as 'date' | 'event']: value };
           updatedTimeline[index] = updatedItem;
           return { ...prevData, timeline: updatedTimeline };
       });
   };

   const addTimelineItem = (): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           // Add item with 'date' field
           return { ...prevData, timeline: [...prevData.timeline, { date: '', event: '' }] };
       });
   };

   const removeTimelineItem = (index: number): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           const updatedTimeline = prevData.timeline.filter((_, i) => i !== index);
           // Ensure at least one item remains, using 'date' field
           return { ...prevData, timeline: updatedTimeline.length > 0 ? updatedTimeline : [{ date: '', event: '' }] };
       });
   };
   // Similar handlers for Documents...
    const handleDocumentChange = (index: number, field: keyof FacilityFormData['documents'][0], value: string): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           const updatedDocuments = [...prevData.documents];
           const updatedItem = { ...updatedDocuments[index], [field]: value };
           updatedDocuments[index] = updatedItem;
           return { ...prevData, documents: updatedDocuments };
       });
   };

   const addDocumentItem = (): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
           return { ...prevData, documents: [...prevData.documents, { title: '', url: '' }] };
       });
   };

    const removeDocumentItem = (index: number): void => {
       setEditFormData(prevData => {
           if (!prevData) return null;
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
  // Otherwise, use the direct facility.properties for display
  const displayProperties = facility.properties || {};
  const currentFormData = editFormData || prepareFormData(facility); // Data for forms or initial display prep

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
      const dataForView = displayProperties; // Use direct properties for viewing
      const dataForEdit = editFormData; // Use edit state for editing

      // Define props for form sections generically (can be refined if Form Section props are known)
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
          listName: keyof FacilityFormData, // Use keyof for type safety
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
                   data: dataForEdit, // Pass the non-null edit data
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
                  // View Mode Content
                  <>
                      <div className="row mb-3">
                          <div className="col-md-6"><strong>Location:</strong><p>{dataForView.address || 'N/A'}</p></div>
                          <div className="col-md-6"><strong>Status:</strong><p>{renderStatusBadge(dataForView.status)}</p></div>
                      </div>
                      <div className="row mb-3">
                          <div className="col-md-6"><strong>Website:</strong><p>{dataForView.website ? <a href={dataForView.website} target="_blank" rel="noopener noreferrer">{dataForView.website}</a> : 'N/A'}</p></div>
                           {/* Display coordinates if available - Use optional chaining */}
                           {dataForView.latitude && dataForView.longitude && (
                               <div className="col-md-6"><strong>Coordinates:</strong><p>{dataForView.latitude?.toFixed(5)}, {dataForView.longitude?.toFixed(5)}</p></div>
                           )}
                      </div>
                      <div className="row mb-4">
                          <div className="col-12"><h3 className="sub-section-heading">Description</h3><p>{dataForView.description || 'Detailed description not available.'}</p></div>
                      </div>
                  </>,
                  // Edit Mode Component (Combine sections or use a dedicated OverviewEditSection)
                  // Using BasicInfoFormSection + manual fields for description/website
                   (props: any) => ( // Use any for props type temporarily
                       <>
                           <BasicInfoFormSection {...props} />
                           <div className="mb-3">
                               <label htmlFor="edit-description" className="form-label">Description:</label>
                               <textarea className="form-control" id="edit-description" name="description" value={props.data?.description || ''} onChange={props.onChange} rows={4} disabled={props.isSaving}></textarea>
                           </div>
                           <div className="mb-3">
                               <label htmlFor="edit-website" className="form-label">Website:</label>
                               <input type="url" className="form-control" id="edit-website" name="website" value={props.data?.website || ''} onChange={props.onChange} disabled={props.isSaving} />
                           </div>
                           {/* Add fields for Lat/Lng if they should be editable here */}
                       </>
                   )
              );

          case 'technical':
              return renderViewOrEdit(
                  // View Mode Content
                  <>
                      <div className="row mb-3">
                          <div className="col-md-6"><strong>Volume (tons/year):</strong><p>{dataForView.capacity || 'N/A'}</p></div>
                          <div className="col-md-6"><strong>Method/Technology:</strong><p>{dataForView.technology || 'N/A'}</p></div>
                      </div>
                      <div className="row mb-3">
                          <div className="col-md-6"><strong>Feedstock:</strong><p>{dataForView.feedstock || 'N/A'}</p></div>
                          <div className="col-md-6"><strong>Product:</strong><p>{dataForView.product || 'N/A'}</p></div>
                      </div>
                      <div className="row mb-4">
                          <div className="col-12"><h3 className="sub-section-heading">Technical Specifications</h3><pre>{dataForView.technicalSpecs || 'Technical specifications not available.'}</pre></div>
                      </div>
                  </>,
                  // Edit Mode Component
                  TechnicalFormSection
              );

          case 'media':
               return renderViewOrEdit(
                   // View Mode Content
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
                   (props: any) => <MediaFormSection {...props} facilityId={id!} onFormDataChange={handleMediaFormChange} /> // Use non-null assertion for id
               );

           case 'timeline':
                return renderArrayEdit(
                    // View Mode Content
                    <ul className="list-group list-group-flush">
                        {/* Update check and rendering to use 'date' */}
                        {Array.isArray(dataForView.timeline) && dataForView.timeline.length > 0 && (dataForView.timeline[0].date || dataForView.timeline[0].event) ? (
                            dataForView.timeline.map((item, index) => (
                                <li key={index} className="list-group-item">{item.date}: {item.event}</li>
                            ))
                        ) : (<li className="list-group-item">No timeline information available.</li>)}
                    </ul>,
                    // Edit Mode Component
                    TimelineFormSection,
                    'timeline',
                    { onChange: handleTimelineChange, onAddItem: addTimelineItem, onRemoveItem: removeTimelineItem }
                );

            case 'documents':
                 return renderArrayEdit(
                     // View Mode Content
                     <ul className="list-group list-group-flush">
                         {Array.isArray(dataForView.documents) && dataForView.documents.length > 0 && (dataForView.documents[0].title || dataForView.documents[0].url) ? (
                             dataForView.documents.map((doc, index) => (
                                 <li key={index} className="list-group-item">
                                     {doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer">{doc.title || 'Link'}</a> : doc.title || 'N/A'}
                                 </li>
                             ))
                         ) : (<li className="list-group-item">No documents available.</li>)}
                     </ul>,
                     // Edit Mode Component
                     DocumentsFormSection,
                     'documents',
                     { onChange: handleDocumentChange, onAddItem: addDocumentItem, onRemoveItem: removeDocumentItem }
                 );

          case 'environmental':
              return renderViewOrEdit(
                  // View Mode Content
                  <div><h3 className="sub-section-heading">Details</h3><p>{dataForView.environmentalImpact?.details || 'N/A'}</p></div>,
                  // Edit Mode Component
                  EnvironmentalFormSection
              );

          case 'investment':
              return renderViewOrEdit(
                  // View Mode Content - Use optional chaining
                  <div><h3 className="sub-section-heading">Total Investment / Funding Details</h3><p>{dataForView.investment?.total || 'N/A'}</p></div>,
                  // Edit Mode Component
                  InvestmentFormSection
              );

          case 'contact':
              return renderViewOrEdit(
                  // View Mode Content
                  <>
                      <div className="row">
                          <div className="col-md-6"><strong>Contact Person:</strong><p>{dataForView.contactPerson || 'N/A'}</p></div>
                          <div className="col-md-6"><strong>Contact Email:</strong><p>{dataForView.contactEmail || 'N/A'}</p></div>
                      </div>
                      <div className="row">
                          <div className="col-md-6"><strong>Contact Phone:</strong><p>{dataForView.contactPhone || 'N/A'}</p></div>
                      </div>
                  </>,
                  // Edit Mode Component
                  ContactFormSection
              );

          default:
              return <p>Select a tab to view details.</p>;
      }
  };


  return (
    <div className="container mt-4 facility-detail-page">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h1 className="h3 mb-2 mb-md-0">{displayProperties.company || 'Facility Details'}</h1>
        <div>
          {isAuthenticated && !editingTabKey && ( // Show Edit only when not already editing
            <button
              className="btn btn-primary me-2"
              onClick={handleEdit}
              disabled={isSaving}
            >
              <i className="fas fa-edit me-1"></i>Edit {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
          )}
           {isAuthenticated && editingTabKey && ( // Show Save/Cancel only when editing
             <>
                <button className="btn btn-success me-2" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <><i className="fas fa-spinner fa-spin me-1"></i> Saving...</> : <><i className="fas fa-save me-1"></i> Save Changes</>}
                </button>
                <button className="btn btn-secondary me-2" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                </button>
             </>
           )}
          <Link to="/facilities" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-1"></i>Back to List
          </Link>
        </div>
      </div>

      {/* Display general errors during save */}
       {error && editingTabKey && <div className="alert alert-danger">{error}</div>}


      <ul className="nav nav-tabs mb-3">
        {tabs.map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              disabled={!!editingTabKey && editingTabKey !== tab.key} // Disable other tabs when editing ANY tab
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div className="card">
        <div className="card-body">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailPage;