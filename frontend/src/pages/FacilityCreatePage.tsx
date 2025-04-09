// frontend/src/pages/FacilityCreatePage.tsx
import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent, MouseEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L, { Map, LeafletMouseEvent, LatLng, Marker as LeafletMarker, DragEndEvent, LeafletEventHandlerFn } from 'leaflet'; // Import Leaflet types
// Import leaflet-geosearch types correctly
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { useAuth } from '../context/AuthContext';
// UPDATED: Import from supabaseDataService
import { addFacility, FacilityFormData, FacilityTimelineEvent } from '../supabaseDataService'; // Use FacilityFormData
// REMOVED: import { User } from 'firebase/auth';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-geosearch/dist/geosearch.css'; // Import leaflet-geosearch CSS
import './FacilityDetailPage.css'; // Reuse detail page styles for consistency

// --- Interfaces and Types ---

// Removed FormTimelineItem, DocumentItem, FacilityStateData - use FacilityFormData directly

// Type for list names used in dynamic list handlers
type ListName = 'timeline' | 'documents'; // 'images' has a dedicated handler

// Type for the GeoSearch result event (adjust based on actual library event)
// Keep this interface definition for clarity, but cast the event in the handler
interface GeoSearchResultEvent {
    location: {
        x: number; // longitude
        y: number; // latitude
        label: string; // address label
        // Add other properties if available/needed from the event object
    };
}

// --- Component ---
const FacilityCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // Error state as string or null
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Initialize state with typed interface FacilityFormData
  const [facilityData, setFacilityData] = useState<FacilityFormData>({
    id: '', // Keep ID for form input
    company_name: '',
    address: '',
    latitude: null,
    longitude: null,
    status_name: 'Planned', // Default status
    processing_capacity_mt_year: '', // Use string for form input
    technology_name: '',
    technology_description: '',
    notes: '',
    timeline: [{ date: '', event: '' }], // Use FacilityTimelineEvent structure
    images: [''],
    documents: [{ title: '', url: '' }], // Assuming {title, url} structure for form
    environmentalImpact: { details: '' }, // Keep nested structure for form
    investment: { total: '' }, // Keep nested structure for form, maps to investment_usd
    website: '',
    feedstock: '',
    product: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    city: '',
    status_effective_date_text: '',
    ev_equivalent_per_year: '',
    jobs: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      console.log("No user found, redirecting from FacilityCreatePage.");
      navigate('/facilities'); // Or to login page: navigate('/login');
    }
  }, [currentUser, navigate]);

  // Type event for input/textarea/select changes
  // UPDATED: Matches FacilityFormData structure
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // For checkboxes

    // Keep value as string for controlled inputs, conversion happens on submit
    let processedValue: string | number | boolean | null = type === 'checkbox' ? checked : value;

    setFacilityData(prevData => {
        if (!prevData) return { id: '' }; // Should not happen, provide default

        // Handle nested properties (investment.total, environmentalImpact.details)
        if (name.includes('.')) {
            const [outerKey, innerKey] = name.split('.') as [keyof FacilityFormData, string];
            if (prevData[outerKey] && typeof prevData[outerKey] === 'object') {
                const updatedNestedObject = {
                    ...(prevData[outerKey] as object),
                    [innerKey]: processedValue,
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
            [name]: processedValue,
        };
    });
  };

  // Handlers for dynamic lists (Timeline, Documents) - Type parameters
  // UPDATED: Uses FacilityTimelineEvent and DocumentItem structure from FacilityFormData
  const handleListChange = (index: number, field: keyof FacilityTimelineEvent | 'title' | 'url', value: string | number, listName: ListName): void => {
     setFacilityData(prevData => {
        if (!prevData) return { id: '' };
        const updatedList = [...(prevData[listName] || [])] as any[]; // Assert list type or use any
        // Create a new object for the item being updated to avoid direct state mutation
        const updatedItem = { ...(updatedList[index] || {}), [field]: value };
        updatedList[index] = updatedItem;
        return { ...prevData, [listName]: updatedList };
    });
  };

  const addListItem = (listName: ListName): void => {
    let newItem: FacilityTimelineEvent | { title: string; url: string };
    if (listName === 'timeline') {
        newItem = { date: '', event: '' }; // Matches FacilityTimelineEvent
    } else { // documents
        newItem = { title: '', url: '' };
    }
    setFacilityData(prevData => ({
      ...prevData,
      [listName]: [...(prevData?.[listName] || []), newItem] as any, // Use 'as any' or refine type based on listName
    }));
  };

  const removeListItem = (index: number, listName: ListName): void => {
    setFacilityData(prevData => {
        if (!prevData || !prevData[listName]) return prevData;
        const updatedList = prevData[listName]?.filter((_, i) => i !== index) || [];
        // Ensure at least one item remains if list becomes empty
        if (updatedList.length === 0) {
            if (listName === 'timeline') {
                updatedList.push({ date: '', event: '' });
            } else { // documents
                updatedList.push({ title: '', url: '' });
            }
        }
        return { ...prevData, [listName]: updatedList };
    });
  };

  // Specific handlers for Images list
  const handleImageChange = (index: number, value: string): void => {
    const updatedImages = [...(facilityData.images || [])];
    updatedImages[index] = value;
    setFacilityData(prevData => ({ ...prevData, images: updatedImages }));
  };

  const addImageField = (): void => {
    setFacilityData(prevData => ({
        ...prevData,
        images: [...(prevData?.images || []), ''],
    }));
  };

  const removeImageField = (index: number): void => {
    const updatedImages = facilityData.images?.filter((_, i) => i !== index) || [];
    // Ensure at least one field remains
    setFacilityData(prevData => ({ ...prevData, images: updatedImages.length > 0 ? updatedImages : [''] }));
  };

  // --- Search Component Logic (No changes needed) ---
  const SearchField: React.FC = () => {
    const map = useMap();
    const provider = new OpenStreetMapProvider();

    useEffect(() => {
      const searchOptions: any = {
        provider: provider,
        style: 'bar',
        showMarker: false,
        showPopup: false,
        autoClose: true,
        keepResult: true,
        searchLabel: 'Search for location...',
      };
      const searchControl = new (GeoSearchControl as any)(searchOptions);
      map.addControl(searchControl);

      const handleResult = (event: any) => {
        if (event && event.location && typeof event.location.x === 'number' && typeof event.location.y === 'number') {
            const { x: lng, y: lat, label } = event.location;
            setFacilityData(prevData => ({
              ...prevData,
              latitude: lat, // Store as number
              longitude: lng, // Store as number
              address: label // Update address field as well
            }));
        } else {
            console.warn("Received geosearch event with unexpected structure:", event);
        }
      };

      map.on('geosearch/showlocation', handleResult as LeafletEventHandlerFn);

      return () => {
        map.removeControl(searchControl);
        map.off('geosearch/showlocation', handleResult as LeafletEventHandlerFn);
      };
    }, [map]);

    return null;
  };
  // --- End Search Component Logic ---

  // --- Map Component Logic ---
  const LocationMarker: React.FC = () => {
    const map = useMapEvents({
      click(e: LeafletMouseEvent) {
        const { lat, lng } = e.latlng;
        setFacilityData(prevData => ({
          ...prevData,
          latitude: lat, // Store as number directly on click
          longitude: lng, // Store as number directly on click
        }));
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    // FIX: Parse latitude and longitude to numbers before creating position
    const latNum = facilityData.latitude !== null ? parseFloat(String(facilityData.latitude)) : null;
    const lngNum = facilityData.longitude !== null ? parseFloat(String(facilityData.longitude)) : null;

    const position: L.LatLngExpression | null = (latNum !== null && !isNaN(latNum) && lngNum !== null && !isNaN(lngNum))
      ? [latNum, lngNum]
      : null;

    const handleDragEnd = (e: DragEndEvent) => {
        const marker = e.target as LeafletMarker;
        const position = marker.getLatLng();
        setFacilityData(prevData => ({
            ...prevData,
            latitude: position.lat, // Store as number directly on drag
            longitude: position.lng, // Store as number directly on drag
        }));
    };

    return position === null ? null : (
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend: handleDragEnd,
        }}
      >
      </Marker>
    );
  };
  // --- End Map Component Logic ---

  // UPDATED: handleSubmit uses FacilityFormData
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!facilityData.id?.trim()) { // Check optional ID
      setError('Facility ID is required and cannot be empty.');
      setLoading(false);
      setActiveTab('overview');
      return;
    }
     if (!facilityData.company_name?.trim()) { // Check company_name
      setError('Facility Name (Company) is required.');
      setLoading(false);
      setActiveTab('overview');
      return;
    }
     if (facilityData.latitude === null || facilityData.longitude === null) {
        setError('Please select a location on the map.');
        setLoading(false);
        setActiveTab('overview');
        return;
    }
    // Add more validation as needed

    // Data is already in FacilityFormData structure, pass it directly
    // Perform final type conversions here before sending to service
    const dataToSave: FacilityFormData = {
        ...facilityData,
        // Ensure numeric fields are numbers or null before saving
        processing_capacity_mt_year: facilityData.processing_capacity_mt_year ? Number(facilityData.processing_capacity_mt_year) : null,
        ev_equivalent_per_year: facilityData.ev_equivalent_per_year ? Number(facilityData.ev_equivalent_per_year) : null,
        jobs: facilityData.jobs ? Number(facilityData.jobs) : null,
        // investment_usd is handled by the service function mapping from investment.total
        latitude: facilityData.latitude ? Number(facilityData.latitude) : null,
        longitude: facilityData.longitude ? Number(facilityData.longitude) : null,
        // Clean up arrays
        timeline: facilityData.timeline?.filter(item => item.date || item.event),
        images: facilityData.images?.filter(url => url && url.trim() !== ''),
        documents: facilityData.documents?.filter(doc => (doc.title && doc.title.trim() !== '') || (doc.url && doc.url.trim() !== '')),
    };


    try {
      console.log("Attempting to save:", dataToSave);
      // Call Supabase addFacility with FacilityFormData
      const result = await addFacility(dataToSave);
      if (result && result.id) {
          alert('Facility created successfully!');
          navigate(`/facilities/${result.id}`); // Navigate to the new facility's detail page
      } else {
          throw new Error("Failed to create facility. Supabase did not return an ID.");
      }
    } catch (err: any) { // Type the error
      console.error("Error creating facility:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      // Check for unique constraint violation (example error code, adjust if needed)
      if (message.includes('duplicate key value violates unique constraint "facilities_pkey"')) {
          setError(`Failed to create facility: Facility ID "${dataToSave.id}" already exists. Please choose a unique ID.`);
          setActiveTab('overview'); // Focus tab with ID field
      } else {
          setError(`Failed to create facility: ${message}`);
      }
      // Use the error state for the alert message for consistency
      alert(`Error creating facility: ${error || message}`);
    } finally {
      setLoading(false);
    }
  };

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

  // Status options for the dropdown
  const statusOptions: string[] = [
    'Planning', 'Under Construction', 'Operational', 'On Hold', 'Cancelled', 'Decommissioned'
  ];

  // Render nothing or a loading indicator until user status is confirmed and redirection happens
  if (!currentUser) {
    return <div className="container mt-4 text-center"><p>Loading user data...</p></div>;
  }

  // Default map center if no coordinates are set yet
  const defaultCenter: L.LatLngExpression = [40, -95]; // Center of US
  // FIX: Parse lat/lng for map center as well
  const mapLatNum = facilityData.latitude !== null ? parseFloat(String(facilityData.latitude)) : null;
  const mapLngNum = facilityData.longitude !== null ? parseFloat(String(facilityData.longitude)) : null;
  const mapCenter: L.LatLngExpression = (mapLatNum !== null && !isNaN(mapLatNum) && mapLngNum !== null && !isNaN(mapLngNum))
    ? [mapLatNum, mapLngNum]
    : defaultCenter;
  const mapZoom = (mapLatNum !== null && !isNaN(mapLatNum)) ? 13 : 4; // Check parsed number


  return (
    <div className="container mt-4 facility-detail-page"> {/* Reuse class for consistency */}
      <form onSubmit={handleSubmit}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
          <h1 className="h3 mb-2 mb-md-0">Create New Facility</h1>
          <div>
            <button
              type="submit"
              className="btn btn-success me-2"
              disabled={loading}
            >
              <i className="fas fa-save me-1"></i>{loading ? 'Saving...' : 'Save Facility'}
            </button>
            <Link to="/facilities" className="btn btn-outline-secondary">
              <i className="fas fa-times me-1"></i>Cancel
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <ul className="nav nav-tabs mb-3">
          {tabs.map(tab => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button"
                className={`nav-link ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="card">
          <div className="card-body">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="section-heading mb-3">Overview</h2>
                <div className="row mb-3">
                   <div className="col-md-6">
                    <label htmlFor="id" className="form-label"><strong>Facility ID *</strong></label>
                    <input type="text" id="id" name="id" className="form-control" value={facilityData.id} onChange={handleChange} required placeholder="Unique identifier (e.g., facility-abc)" />
                  </div>
                 <div className="col-md-6">
                    {/* UPDATED: Use company_name */}
                    <label htmlFor="company_name" className="form-label"><strong>Facility Name (Company) *</strong></label>
                    <input type="text" id="company_name" name="company_name" className="form-control" value={facilityData.company_name || ''} onChange={handleChange} required />
                  </div>
                </div>
                <div className="row mb-3">
                   <div className="col-md-6">
                    {/* UPDATED: Use address */}
                    <label htmlFor="address" className="form-label"><strong>Location (Address / Description)</strong></label>
                    <input type="text" id="address" name="address" className="form-control" value={facilityData.address || ''} onChange={handleChange} placeholder="Optional: Enter address or search map"/>
                  </div>
                   <div className="col-md-6">
                     <label className="form-label"><strong>Location (Click map, search, or drag marker) *</strong></label>
                     <div style={{ height: '400px', width: '100%' }}>
                       <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                         <TileLayer
                           attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                           url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                         />
                         <SearchField />
                         <LocationMarker />
                       </MapContainer>
                     </div>
                     {/* FIX: Use parsed numbers for display */}
                     {mapLatNum !== null && !isNaN(mapLatNum) && mapLngNum !== null && !isNaN(mapLngNum) && (
                       <div className="mt-2 small text-muted">
                         Selected Coordinates: {mapLatNum.toFixed(5)}, {mapLngNum.toFixed(5)}
                       </div>
                     )}
                   </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    {/* UPDATED: Use status_name */}
                    <label htmlFor="status_name" className="form-label"><strong>Status</strong></label>
                    <select id="status_name" name="status_name" className="form-select" value={facilityData.status_name || ''} onChange={handleChange}>
                      {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                   <div className="col-md-6">
                     {/* UPDATED: Use processing_capacity_mt_year */}
                     <label htmlFor="processing_capacity_mt_year" className="form-label"><strong>Volume (tons/year)</strong></label>
                     <input type="number" id="processing_capacity_mt_year" name="processing_capacity_mt_year" className="form-control" value={facilityData.processing_capacity_mt_year || ''} onChange={handleChange} />
                   </div>
                </div>
                 <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="website" className="form-label"><strong>Website</strong></label>
                        <input type="url" id="website" name="website" className="form-control" value={facilityData.website || ''} onChange={handleChange} placeholder="https://example.com"/>
                    </div>
                 </div>
                <div className="row mb-4">
                  <div className="col-12">
                    {/* UPDATED: Use notes */}
                    <label htmlFor="notes" className="form-label"><strong>Notes</strong></label>
                    <textarea id="notes" name="notes" className="form-control" value={facilityData.notes || ''} onChange={handleChange} rows={4}></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Details Tab */}
            {activeTab === 'technical' && (
              <div>
                <h2 className="section-heading mb-3">Technical Details</h2>
                <div className="row mb-3">
                  <div className="col-md-6">
                    {/* UPDATED: Use technology_name */}
                    <label htmlFor="technology_name" className="form-label"><strong>Method/Technology</strong></label>
                    <input type="text" id="technology_name" name="technology_name" className="form-control" value={facilityData.technology_name || ''} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="feedstock" className="form-label"><strong>Feedstock</strong></label>
                    <input type="text" id="feedstock" name="feedstock" className="form-control" value={facilityData.feedstock || ''} onChange={handleChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="product" className="form-label"><strong>Product</strong></label>
                    <input type="text" id="product" name="product" className="form-control" value={facilityData.product || ''} onChange={handleChange} />
                  </div>
                </div>
                <div className="row mb-4">
                  <div className="col-12">
                    {/* UPDATED: Use technology_description */}
                    <label htmlFor="technology_description" className="form-label"><strong>Technology Description</strong></label>
                    <textarea id="technology_description" name="technology_description" className="form-control" value={facilityData.technology_description || ''} onChange={handleChange} rows={4}></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div>
                <h2 className="section-heading mb-3">Media (Image URLs)</h2>
                {facilityData.images?.map((url, index) => (
                  <div key={index} className="d-flex align-items-center mb-2">
                    <input
                      type="url"
                      name={`images[${index}]`}
                      className="form-control me-2"
                      value={url}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeImageField(index)}
                      disabled={facilityData.images && facilityData.images.length <= 1}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={addImageField}>
                  <i className="fas fa-plus me-1"></i> Add Image URL
                </button>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <h2 className="section-heading mb-3">Timeline</h2>
                {facilityData.timeline?.map((item, index) => (
                  <div key={index} className="row align-items-center mb-2 timeline-item">
                    <div className="col-md-4">
                      <label htmlFor={`timeline-date-${index}`} className="form-label small">Date</label>
                      <input
                        type="text"
                        id={`timeline-date-${index}`}
                        name={`timeline[${index}].date`}
                        className="form-control form-control-sm"
                        value={item.date}
                        onChange={(e) => handleListChange(index, 'date', e.target.value, 'timeline')}
                        placeholder="YYYY-MM-DD or Year"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor={`timeline-event-${index}`} className="form-label small">Event</label>
                      <input
                        type="text"
                        id={`timeline-event-${index}`}
                        name={`timeline[${index}].event`}
                        className="form-control form-control-sm"
                        value={item.event}
                        onChange={(e) => handleListChange(index, 'event', e.target.value, 'timeline')}
                        placeholder="Event description"
                      />
                    </div>
                     <div className="col-md-2 text-end">
                       <button
                         type="button"
                         className="btn btn-sm btn-danger mt-3"
                         onClick={() => removeListItem(index, 'timeline')}
                         disabled={facilityData.timeline && facilityData.timeline.length <= 1}
                       >
                         <i className="fas fa-trash"></i>
                       </button>
                     </div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => addListItem('timeline')}>
                  <i className="fas fa-plus me-1"></i> Add Timeline Event
                </button>
              </div>
            )}

            {/* Documents Tab */}
             {activeTab === 'documents' && (
                 <div>
                     <h2 className="section-heading mb-3">Documents</h2>
                     {facilityData.documents?.map((docItem, index) => (
                         <div key={index} className="row align-items-center mb-2 document-item">
                             <div className="col-md-5">
                                 <label htmlFor={`doc-title-${index}`} className="form-label small">Title</label>
                                 <input
                                     type="text"
                                     id={`doc-title-${index}`}
                                     name={`documents[${index}].title`}
                                     className="form-control form-control-sm"
                                     value={docItem.title}
                                     onChange={(e) => handleListChange(index, 'title', e.target.value, 'documents')}
                                     placeholder="Document Title"
                                 />
                             </div>
                             <div className="col-md-5">
                                 <label htmlFor={`doc-url-${index}`} className="form-label small">URL</label>
                                 <input
                                     type="url"
                                     id={`doc-url-${index}`}
                                     name={`documents[${index}].url`}
                                     className="form-control form-control-sm"
                                     value={docItem.url}
                                     onChange={(e) => handleListChange(index, 'url', e.target.value, 'documents')}
                                     placeholder="https://example.com/document.pdf"
                                 />
                             </div>
                             <div className="col-md-2 text-end">
                                 <button
                                     type="button"
                                     className="btn btn-sm btn-danger mt-3"
                                     onClick={() => removeListItem(index, 'documents')}
                                     disabled={facilityData.documents && facilityData.documents.length <= 1}
                                 >
                                     <i className="fas fa-trash"></i>
                                 </button>
                             </div>
                         </div>
                     ))}
                     <button type="button" className="btn btn-sm btn-outline-secondary mt-2" onClick={() => addListItem('documents')}>
                         <i className="fas fa-plus me-1"></i> Add Document
                     </button>
                 </div>
             )}

            {/* Environmental Impact Tab */}
            {activeTab === 'environmental' && (
              <div>
                <h2 className="section-heading mb-3">Environmental Impact</h2>
                <div className="mb-3">
                  <label htmlFor="environmentalImpact.details" className="form-label">Details</label>
                  <textarea
                    id="environmentalImpact.details"
                    name="environmentalImpact.details"
                    className="form-control"
                    value={facilityData.environmentalImpact?.details || ''}
                    onChange={handleChange}
                    rows={4}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Investment Tab */}
            {activeTab === 'investment' && (
              <div>
                <h2 className="section-heading mb-3">Investment & Funding</h2>
                <div className="mb-3">
                  <label htmlFor="investment.total" className="form-label">Total Investment (USD)</label>
                  <input
                    type="number"
                    id="investment.total"
                    name="investment.total"
                    className="form-control"
                    value={facilityData.investment?.total || ''}
                    onChange={handleChange}
                    placeholder="e.g., 1000000"
                  />
                </div>
                 <div className="mb-3">
                    {/* UPDATED: Use jobs */}
                    <label htmlFor="jobs" className="form-label">Jobs Created</label>
                    <input type="number" id="jobs" name="jobs" className="form-control" value={facilityData.jobs || ''} onChange={handleChange} />
                  </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div>
                <h2 className="section-heading mb-3">Contact Information</h2>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="contactPerson" className="form-label">Contact Person</label>
                    <input type="text" id="contactPerson" name="contactPerson" className="form-control" value={facilityData.contactPerson || ''} onChange={handleChange} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="contactEmail" className="form-label">Contact Email</label>
                    <input type="email" id="contactEmail" name="contactEmail" className="form-control" value={facilityData.contactEmail || ''} onChange={handleChange} />
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="contactPhone" className="form-label">Contact Phone</label>
                    <input type="tel" id="contactPhone" name="contactPhone" className="form-control" value={facilityData.contactPhone || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

          </div> {/* card-body */}
        </div> {/* card */}
      </form>
    </div>
  );
};

export default FacilityCreatePage;