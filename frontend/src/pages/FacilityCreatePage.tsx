import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent, MouseEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L, { Map, LeafletMouseEvent, LatLng, Marker as LeafletMarker, DragEndEvent } from 'leaflet'; // Import Leaflet types
// Removed GeoSearchControlOptions, SearchResult from import
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.jsx is renamed or doesn't need extension
import { addFacility, FacilityData } from '../firebase'; // Assuming this function exists and FacilityData is defined
import { User } from 'firebase/auth'; // Import User type
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-geosearch/dist/geosearch.css'; // Import leaflet-geosearch CSS
import './FacilityDetailPage.css'; // Reuse detail page styles for consistency

// --- Interfaces and Types ---
interface TimelineItem {
  year: string | number;
  event: string;
}

interface DocumentItem {
  title: string;
  url: string;
}

// Interface for the component's state representing the facility being created
interface FacilityStateData {
  id: string;
  company: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string; // Use string for select options, matches statusOptions
  capacity: string | number;
  technology: string;
  description: string;
  technicalSpecs: string;
  timeline: TimelineItem[];
  images: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  documents: DocumentItem[];
  environmentalImpact: string;
  fundingDetails: string;
  website: string;
  feedstock: string;
  product: string;
}

// Type for list names used in dynamic list handlers
type ListName = 'timeline' | 'documents'; // 'images' has a dedicated handler

// Type for the GeoSearch result event
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
  const { currentUser }: { currentUser: User | null } = useAuth(); // Type user from context
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // Error state as string or null
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Initialize state with typed interface
  const [facilityData, setFacilityData] = useState<FacilityStateData>({
    id: '',
    company: '',
    address: '',
    latitude: null,
    longitude: null,
    status: 'Planning', // Default status
    capacity: '',
    technology: '',
    description: '',
    technicalSpecs: '',
    timeline: [{ year: '', event: '' }],
    images: [''],
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    documents: [{ title: '', url: '' }],
    environmentalImpact: '',
    fundingDetails: '',
    website: '',
    feedstock: '',
    product: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      console.log("No user found, redirecting from FacilityCreatePage.");
      navigate('/facilities'); // Or to login page: navigate('/login');
    }
  }, [currentUser, navigate]);

  // Type event for input/textarea/select changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    // Handle numeric inputs specifically if needed (e.g., capacity, timeline year)
    const processedValue = e.target.type === 'number' ? (value === '' ? '' : Number(value)) : value;
    setFacilityData(prevData => ({
      ...prevData,
      [name]: processedValue,
    }));
  };

  // Handlers for dynamic lists (Timeline, Documents) - Type parameters
  const handleListChange = (index: number, field: keyof TimelineItem | keyof DocumentItem, value: string | number, listName: ListName): void => {
     // Use type assertion to access nested properties safely
     setFacilityData(prevData => {
        const updatedList = [...prevData[listName]] as (TimelineItem[] | DocumentItem[]); // Assert list type
        // Create a new object for the item being updated to avoid direct state mutation
        const updatedItem = { ...updatedList[index], [field]: value };
        updatedList[index] = updatedItem;
        return { ...prevData, [listName]: updatedList };
    });
  };

  const addListItem = (listName: ListName, newItem: TimelineItem | DocumentItem): void => {
    setFacilityData(prevData => ({
      ...prevData,
      [listName]: [...prevData[listName], newItem] as any, // Use 'as any' or refine type based on listName
    }));
  };

  const removeListItem = (index: number, listName: ListName): void => {
    setFacilityData(prevData => {
        const updatedList = prevData[listName].filter((_, i) => i !== index);
        return { ...prevData, [listName]: updatedList };
    });
  };

  // Specific handlers for Images list
  const handleImageChange = (index: number, value: string): void => {
    const updatedImages = [...facilityData.images];
    updatedImages[index] = value;
    setFacilityData(prevData => ({ ...prevData, images: updatedImages }));
  };

  const addImageField = (): void => {
    setFacilityData(prevData => ({
        ...prevData,
        images: [...prevData.images, ''],
    }));
  };

  const removeImageField = (index: number): void => {
    const updatedImages = facilityData.images.filter((_, i) => i !== index);
    // Ensure at least one field remains
    setFacilityData(prevData => ({ ...prevData, images: updatedImages.length > 0 ? updatedImages : [''] }));
  };

  // --- Search Component Logic ---
  const SearchField: React.FC = () => {
    const map = useMap();
    const provider = new OpenStreetMapProvider();

    useEffect(() => {
      // Type the options for GeoSearchControl
      const searchOptions: GeoSearchControlOptions = {
        provider: provider,
        style: 'bar',
        showMarker: false,
        showPopup: false,
        autoClose: true,
        keepResult: true,
        searchLabel: 'Search for location...',
      };
      // Cast GeoSearchControl to any to bypass constructor signature issue
      const searchControl = new (GeoSearchControl as any)(searchOptions);

      map.addControl(searchControl);

      // Type the result event
      const handleResult = (result: GeoSearchResultEvent) => {
        const { x: lng, y: lat, label } = result.location;
        setFacilityData(prevData => ({
          ...prevData,
          latitude: lat,
          longitude: lng,
          address: label
        }));
        // Map automatically flies to result via the control
      };

      // Remove incorrect cast for custom event
      map.on('geosearch/showlocation', handleResult);

      return () => {
        map.removeControl(searchControl);
        // Remove incorrect cast for custom event
        map.off('geosearch/showlocation', handleResult);
      };
    }, [map]);

    return null;
  };
  // --- End Search Component Logic ---

  // --- Map Component Logic ---
  const LocationMarker: React.FC = () => {
    const map = useMapEvents({
      click(e: LeafletMouseEvent) { // Type the event
        const { lat, lng } = e.latlng;
        setFacilityData(prevData => ({
          ...prevData,
          latitude: lat,
          longitude: lng,
        }));
        map.flyTo(e.latlng, map.getZoom());
      },
    });

    // Define marker position type
    const position: L.LatLngExpression | null = facilityData.latitude !== null && facilityData.longitude !== null
      ? [facilityData.latitude, facilityData.longitude]
      : null;

    // Type the drag event
    const handleDragEnd = (e: DragEndEvent) => {
        const marker = e.target as LeafletMarker; // Assert target type
        const position = marker.getLatLng();
        setFacilityData(prevData => ({
            ...prevData,
            latitude: position.lat,
            longitude: position.lng,
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!facilityData.id.trim()) {
      setError('Facility ID is required and cannot be empty.');
      setLoading(false);
      setActiveTab('overview');
      return;
    }
     if (!facilityData.company.trim()) {
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

    // Prepare the data for saving, matching FacilityData structure from firebase.ts
    // Assuming FacilityData expects properties nested and optional geometry
    const { id, ...propertiesData } = facilityData;

    // Construct the properties object carefully, ensuring types match FacilityData if possible
    const properties = {
        company: propertiesData.company,
        address: propertiesData.address,
        status: propertiesData.status, // Ensure this matches expected status values in FacilityData
        capacity: propertiesData.capacity,
        technology: propertiesData.technology,
        description: propertiesData.description,
        technicalSpecs: propertiesData.technicalSpecs,
        timeline: propertiesData.timeline.filter(item => item.year || item.event),
        images: propertiesData.images.filter(url => url && url.trim() !== ''),
        contactPerson: propertiesData.contactPerson,
        contactEmail: propertiesData.contactEmail,
        contactPhone: propertiesData.contactPhone,
        documents: propertiesData.documents.filter(doc => (doc.title && doc.title.trim() !== '') || (doc.url && doc.url.trim() !== '')),
        environmentalImpact: { details: propertiesData.environmentalImpact }, // Assuming nested structure
        // Correctly include fundingDetails within the investment object
        investment: { total: propertiesData.fundingDetails },
        website: propertiesData.website,
        feedstock: propertiesData.feedstock,
        product: propertiesData.product,
        // Add latitude/longitude to properties if expected there by FacilityData
        latitude: propertiesData.latitude,
        longitude: propertiesData.longitude,
    };

    const dataToSave: FacilityData = {
      id: id.trim(),
      properties: properties,
      // Conditionally add geometry based on lat/lng presence
      geometry: propertiesData.latitude && propertiesData.longitude ? {
        type: "Point",
        coordinates: [propertiesData.longitude, propertiesData.latitude]
      } : undefined, // Use undefined if geometry is optional
    };


    try {
      console.log("Attempting to save:", dataToSave);
      await addFacility(dataToSave); // Pass the structured data
      alert('Facility created successfully!');
      navigate('/facilities');
    } catch (err: any) { // Type the error
      console.error("Error creating facility:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to create facility: ${message}`);
      alert(`Error creating facility: ${message}`);
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
  const mapCenter: L.LatLngExpression = facilityData.latitude !== null && facilityData.longitude !== null
    ? [facilityData.latitude, facilityData.longitude]
    : defaultCenter;
  const mapZoom = facilityData.latitude !== null ? 13 : 4;


  return (
    <div className="container mt-4 facility-detail-page">
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
                    <label htmlFor="company" className="form-label"><strong>Facility Name (Company) *</strong></label>
                    <input type="text" id="company" name="company" className="form-control" value={facilityData.company} onChange={handleChange} required />
                  </div>
                </div>
                <div className="row mb-3">
                   <div className="col-md-6">
                    <label htmlFor="address" className="form-label"><strong>Location (Address / Description)</strong></label>
                    <input type="text" id="address" name="address" className="form-control" value={facilityData.address} onChange={handleChange} placeholder="Optional: Enter address or search map"/>
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
                     {facilityData.latitude && facilityData.longitude && (
                       <div className="mt-2 small text-muted">
                         Selected Coordinates: {facilityData.latitude.toFixed(5)}, {facilityData.longitude.toFixed(5)}
                       </div>
                     )}
                   </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="status" className="form-label"><strong>Status</strong></label>
                    <select id="status" name="status" className="form-select" value={facilityData.status} onChange={handleChange}>
                      {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                   <div className="col-md-6">
                     <label htmlFor="capacity" className="form-label"><strong>Volume (tons/year)</strong></label>
                     <input type="number" id="capacity" name="capacity" className="form-control" value={facilityData.capacity} onChange={handleChange} />
                   </div>
                </div>
                 <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="website" className="form-label"><strong>Website</strong></label>
                        <input type="url" id="website" name="website" className="form-control" value={facilityData.website} onChange={handleChange} placeholder="https://example.com"/>
                    </div>
                 </div>
                <div className="row mb-4">
                  <div className="col-12">
                    <label htmlFor="description" className="form-label"><h3 className="sub-section-heading">Description</h3></label>
                    <textarea id="description" name="description" className="form-control" rows={4} value={facilityData.description} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Technical Tab */}
            {activeTab === 'technical' && (
              <div>
                <h2 className="section-heading mb-3">Technical Details</h2>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="technology" className="form-label"><strong>Method/Technology</strong></label>
                    <input type="text" id="technology" name="technology" className="form-control" value={facilityData.technology} onChange={handleChange} />
                  </div>
                   <div className="col-md-6">
                     <label htmlFor="feedstock" className="form-label"><strong>Feedstock</strong></label>
                     <input type="text" id="feedstock" name="feedstock" className="form-control" value={facilityData.feedstock} onChange={handleChange} />
                   </div>
                </div>
                <div className="row mb-3">
                   <div className="col-md-6">
                     <label htmlFor="product" className="form-label"><strong>Product</strong></label>
                     <input type="text" id="product" name="product" className="form-control" value={facilityData.product} onChange={handleChange} />
                   </div>
                </div>
                <div className="row mb-4">
                  <div className="col-12">
                    <label htmlFor="technicalSpecs" className="form-label"><h3 className="sub-section-heading">Technical Specifications</h3></label>
                    <textarea id="technicalSpecs" name="technicalSpecs" className="form-control" rows={5} value={facilityData.technicalSpecs} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
                <div>
                    <h2 className="section-heading mb-3">Media (Image URLs)</h2>
                    {facilityData.images.map((url, index) => (
                        <div key={index} className="d-flex align-items-center mb-2">
                            <input
                                type="url"
                                name={`image-${index}`}
                                className="form-control me-2"
                                value={url}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleImageChange(index, e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeImageField(index)}
                                disabled={facilityData.images.length === 1} // Disable removing if only one field left
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addImageField}>
                        <i className="fas fa-plus me-1"></i> Add Another Image URL
                    </button>
                </div>
            )}


            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div>
                <h2 className="section-heading mb-3">Project Timeline & Milestones</h2>
                {facilityData.timeline.map((item, index) => (
                  <div key={index} className="row mb-2 align-items-end">
                    <div className="col-md-3">
                      <label htmlFor={`timeline-year-${index}`} className="form-label">Year</label>
                      <input
                        type="number"
                        id={`timeline-year-${index}`}
                        className="form-control"
                        value={item.year}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleListChange(index, 'year', e.target.value, 'timeline')}
                      />
                    </div>
                    <div className="col-md-7">
                      <label htmlFor={`timeline-event-${index}`} className="form-label">Event/Milestone</label>
                      <input
                        type="text"
                        id={`timeline-event-${index}`}
                        className="form-control"
                        value={item.event}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleListChange(index, 'event', e.target.value, 'timeline')}
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-danger btn-sm w-100" onClick={() => removeListItem(index, 'timeline')} disabled={facilityData.timeline.length === 1}>
                        <i className="fas fa-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => addListItem('timeline', { year: '', event: '' })}>
                  <i className="fas fa-plus me-1"></i> Add Milestone
                </button>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <h2 className="section-heading mb-3">Related Documents & Resources (URLs)</h2>
                 {facilityData.documents.map((docItem, index) => (
                  <div key={index} className="row mb-2 align-items-end">
                    <div className="col-md-5">
                      <label htmlFor={`doc-title-${index}`} className="form-label">Document Title</label>
                      <input
                        type="text"
                        id={`doc-title-${index}`}
                        className="form-control"
                        value={docItem.title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleListChange(index, 'title', e.target.value, 'documents')}
                         placeholder="e.g., Permit Application"
                      />
                    </div>
                    <div className="col-md-5">
                      <label htmlFor={`doc-url-${index}`} className="form-label">Document URL</label>
                      <input
                        type="url"
                        id={`doc-url-${index}`}
                        className="form-control"
                        value={docItem.url}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleListChange(index, 'url', e.target.value, 'documents')}
                         placeholder="https://example.com/document.pdf"
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-danger btn-sm w-100" onClick={() => removeListItem(index, 'documents')} disabled={facilityData.documents.length === 1}>
                        <i className="fas fa-trash"></i> Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={() => addListItem('documents', { title: '', url: '' })}>
                  <i className="fas fa-plus me-1"></i> Add Document
                </button>
              </div>
            )}

             {/* Environmental Tab */}
            {activeTab === 'environmental' && (
              <div>
                <h2 className="section-heading mb-3">Environmental Impact</h2>
                 <div className="mb-3">
                    <label htmlFor="environmentalImpact" className="form-label">Details</label>
                    <textarea id="environmentalImpact" name="environmentalImpact" className="form-control" rows={5} value={facilityData.environmentalImpact} onChange={handleChange}></textarea>
                  </div>
              </div>
            )}

             {/* Investment Tab */}
            {activeTab === 'investment' && (
              <div>
                <h2 className="section-heading mb-3">Investment & Funding</h2>
                 <div className="mb-3">
                    <label htmlFor="fundingDetails" className="form-label">Funding Details / Total Investment</label>
                    <input type="text" id="fundingDetails" name="fundingDetails" className="form-control" value={facilityData.fundingDetails} onChange={handleChange} />
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
                    <input type="text" id="contactPerson" name="contactPerson" className="form-control" value={facilityData.contactPerson} onChange={handleChange} />
                  </div>
                   <div className="col-md-6">
                    <label htmlFor="contactEmail" className="form-label">Contact Email</label>
                    <input type="email" id="contactEmail" name="contactEmail" className="form-control" value={facilityData.contactEmail} onChange={handleChange} />
                  </div>
                </div>
                 <div className="row mb-3">
                   <div className="col-md-6">
                    <label htmlFor="contactPhone" className="form-label">Contact Phone</label>
                    <input type="tel" id="contactPhone" name="contactPhone" className="form-control" value={facilityData.contactPhone} onChange={handleChange} />
                  </div>
                </div>
              </div>
            )}

          </div> {/* End card-body */}
        </div> {/* End card */}
      </form>
    </div>
  );
};

export default FacilityCreatePage;