import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth
import { addFacility } from '../firebase'; // Assuming this function exists to add data
import './FacilityDetailPage.css'; // Reuse detail page styles for consistency

function FacilityCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from auth context
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize state with all fields from the detail page structure
  const [facilityData, setFacilityData] = useState({
    id: '', // Add the ID field
    company: '',
    address: '', // Keep address for context, but coordinates will be primary
    latitude: null, // Add latitude state
    longitude: null, // Add longitude state
    status: 'Planning', // Default status
    capacity: '',
    technology: '',
    description: '',
    technicalSpecs: '',
    timeline: [{ year: '', event: '' }], // Start with one empty timeline entry
    images: [''], // Start with one empty image URL field
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    documents: [{ title: '', url: '' }], // Start with one empty document entry
    environmentalImpact: '', // Simplified for creation
    fundingDetails: '', // Simplified for creation
    website: '',
    feedstock: '',
    product: '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting from FacilityCreatePage.");
      navigate('/facilities'); // Or to login page: navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFacilityData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handlers for dynamic lists (Timeline, Images, Documents)
  const handleListChange = (index, field, value, listName) => {
    const updatedList = [...facilityData[listName]];
    updatedList[index][field] = value;
    setFacilityData(prevData => ({ ...prevData, [listName]: updatedList }));
  };

  const addListItem = (listName, newItem) => {
    setFacilityData(prevData => ({
      ...prevData,
      [listName]: [...prevData[listName], newItem],
    }));
  };

  const removeListItem = (index, listName) => {
    const updatedList = facilityData[listName].filter((_, i) => i !== index);
    setFacilityData(prevData => ({ ...prevData, [listName]: updatedList }));
  };

  const handleImageChange = (index, value) => {
    const updatedImages = [...facilityData.images];
    updatedImages[index] = value;
    setFacilityData(prevData => ({ ...prevData, images: updatedImages }));
};

const addImageField = () => {
    setFacilityData(prevData => ({
        ...prevData,
        images: [...prevData.images, ''],
    }));
};

const removeImageField = (index) => {
    const updatedImages = facilityData.images.filter((_, i) => i !== index);
    // Ensure at least one field remains if needed, or handle empty state appropriately
    setFacilityData(prevData => ({ ...prevData, images: updatedImages.length > 0 ? updatedImages : [''] }));
};

// --- Search Component Logic ---
  const SearchField = () => {
    const map = useMap();
    // Use OpenStreetMapProvider or another provider like Esri, etc.
    const provider = new OpenStreetMapProvider();

    useEffect(() => {
      const searchControl = new GeoSearchControl({
        provider: provider,
        style: 'bar', // Use 'bar' style for the search input
        showMarker: false, // We handle the marker ourselves
        showPopup: false, // No popup on search result
        autoClose: true, // Close results on selection
        keepResult: true, // Keep the search input filled with the result
        searchLabel: 'Search for location...', // Placeholder text
        // position: 'topright', // Optional: control position
      });

      map.addControl(searchControl);

      // Event listener for when a location is selected from search
      map.on('geosearch/showlocation', (result) => {
        const { x: lng, y: lat, label } = result.location;
        // Update state with new coordinates and address label
        setFacilityData(prevData => ({
          ...prevData,
          latitude: lat,
          longitude: lng,
          address: label // Update address field with the search result label
        }));
        // The map automatically flies to the result, and LocationMarker updates
      });

      // Cleanup function to remove control and listener on unmount
      return () => {
        map.removeControl(searchControl);
        map.off('geosearch/showlocation');
      };
    }, [map]); // Re-run effect if map instance changes

    return null; // This component adds the control to the map, doesn't render directly
  };
  // --- End Search Component Logic ---

  // --- Map Component Logic ---
  const LocationMarker = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setFacilityData(prevData => ({
          ...prevData,
          latitude: lat,
          longitude: lng,
        }));
        map.flyTo(e.latlng, map.getZoom()); // Center map on click
      },
    });

    // Custom Icon (Optional - requires Leaflet 'L' import)
    // const customIcon = new L.Icon({
    //   iconUrl: 'path/to/your/marker-icon.png',
    //   iconSize: [25, 41],
    //   iconAnchor: [12, 41],
    //   popupAnchor: [1, -34],
    //   shadowUrl: 'path/to/your/marker-shadow.png',
    //   shadowSize: [41, 41]
    // });

    return facilityData.latitude === null ? null : (
      <Marker
        position={[facilityData.latitude, facilityData.longitude]}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
             setFacilityData(prevData => ({
                ...prevData,
                latitude: position.lat,
                longitude: position.lng,
             }));
          },
        }}
        // icon={customIcon} // Uncomment to use custom icon
      >
        {/* Optional: Add a Popup */}
        {/* <Popup>You selected this location.</Popup> */}
      </Marker>
    );
  };
  // --- End Map Component Logic ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (!facilityData.id) {
      setError('Facility ID is required.');
      setLoading(false);
      setActiveTab('overview'); // Switch to the tab with the error
      return;
    }
     if (!facilityData.company) {
      setError('Facility Name (Company) is required.');
      setLoading(false);
      setActiveTab('overview'); // Switch to the tab with the error
      return;
    }
    // Add more validation as needed for other required fields

    // Prepare the data for saving. The ID is passed at the top level.
    // The rest of the data is nested under 'properties'.
    const { id, ...propertiesData } = facilityData; // Separate id from the rest

    const dataToSave = {
      id: id.trim(), // Ensure ID has no leading/trailing spaces
      properties: {
        ...propertiesData,
        // Clean up empty list items before saving
        timeline: propertiesData.timeline.filter(item => item.year || item.event),
        images: propertiesData.images.filter(url => url && url.trim() !== ''),
        documents: propertiesData.documents.filter(doc => (doc.title && doc.title.trim() !== '') || (doc.url && doc.url.trim() !== '')),
        environmentalImpact: { details: propertiesData.environmentalImpact },
        investment: { total: propertiesData.fundingDetails },
        // Add coordinates
        latitude: propertiesData.latitude,
        longitude: propertiesData.longitude,
      }
      // Consider adding a GeoJSON geometry field later if needed:
      // geometry: propertiesData.latitude && propertiesData.longitude ? {
      //   type: "Point",
      //   coordinates: [propertiesData.longitude, propertiesData.latitude]
      // } : null,
    };


    try {
      console.log("Attempting to save:", dataToSave);
      await addFacility(dataToSave); // Use the imported addFacility function
      alert('Facility created successfully!');
      navigate('/facilities'); // Navigate back to the list
    } catch (err) {
      console.error("Error creating facility:", err);
      setError(`Failed to create facility: ${err.message}`);
      alert(`Error creating facility: ${err.message}`);
    } finally {
      setLoading(false);
    }
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

  // Status options for the dropdown
  const statusOptions = [
    'Planning', 'Under Construction', 'Operational', 'On Hold', 'Cancelled', 'Decommissioned'
  ];

  // Render nothing or a loading indicator until user status is confirmed and redirection happens
  if (!user) {
    return <p>Loading or redirecting...</p>; // Or null, or a spinner
  }

  return (
    <div className="container mt-4 facility-detail-page"> {/* Reuse class for styling */}
      <form onSubmit={handleSubmit}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Create New Facility</h1>
          <div>
            <button
              type="submit"
              className="btn btn-success me-2" // Save button
              disabled={loading}
            >
              <i className="fas fa-save me-2"></i>{loading ? 'Saving...' : 'Save Facility'}
            </button>
            <Link to="/facilities" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i>Back to Facilities
            </Link>
          </div>
        </div>

        {/* Display general errors */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Tab Navigation */}
        <ul className="nav nav-tabs mb-3">
          {tabs.map(tab => (
            <li className="nav-item" key={tab.key}>
              <button
                type="button" // Prevent form submission on tab click
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
                   {/* Keep Address field for context/manual entry */}
                   <div className="col-md-6">
                    <label htmlFor="address" className="form-label"><strong>Location (Address / Description)</strong></label>
                    <input type="text" id="address" name="address" className="form-control" value={facilityData.address} onChange={handleChange} placeholder="Optional: Enter address or description"/>
                  </div>
                   {/* Map Component */}
                   <div className="col-md-6">
                     <label className="form-label"><strong>Location (Click map or drag marker)</strong></label>
                     <div style={{ height: '400px', width: '100%' }}> {/* Increased height */}
                       {/* Update MapContainer to center on existing coords or default */}
                       <MapContainer center={facilityData.latitude ? [facilityData.latitude, facilityData.longitude] : [40, -95]} zoom={facilityData.latitude ? 13 : 4} style={{ height: '100%', width: '100%' }}>
                         {/* Switched to Esri World Imagery */}
                         <TileLayer
                           attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                           url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                         />
                         <SearchField /> {/* Add the search control component */}
                         <LocationMarker />
                       </MapContainer>
                     </div>
                     {facilityData.latitude && facilityData.longitude && (
                       <div className="mt-2">
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
                    <textarea id="description" name="description" className="form-control" rows="4" value={facilityData.description} onChange={handleChange}></textarea>
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
                    <textarea id="technicalSpecs" name="technicalSpecs" className="form-control" rows="5" value={facilityData.technicalSpecs} onChange={handleChange}></textarea>
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
                                onChange={(e) => handleImageChange(index, e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => removeImageField(index)}
                                disabled={facilityData.images.length <= 1 && index === 0} // Prevent removing the last field if needed
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
                        onChange={(e) => handleListChange(index, 'year', e.target.value, 'timeline')}
                      />
                    </div>
                    <div className="col-md-7">
                      <label htmlFor={`timeline-event-${index}`} className="form-label">Event/Milestone</label>
                      <input
                        type="text"
                        id={`timeline-event-${index}`}
                        className="form-control"
                        value={item.event}
                        onChange={(e) => handleListChange(index, 'event', e.target.value, 'timeline')}
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-danger btn-sm w-100" onClick={() => removeListItem(index, 'timeline')}>
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
                 {facilityData.documents.map((doc, index) => (
                  <div key={index} className="row mb-2 align-items-end">
                    <div className="col-md-5">
                      <label htmlFor={`doc-title-${index}`} className="form-label">Document Title</label>
                      <input
                        type="text"
                        id={`doc-title-${index}`}
                        className="form-control"
                        value={doc.title}
                        onChange={(e) => handleListChange(index, 'title', e.target.value, 'documents')}
                         placeholder="e.g., Permit Application"
                      />
                    </div>
                    <div className="col-md-5">
                      <label htmlFor={`doc-url-${index}`} className="form-label">Document URL</label>
                      <input
                        type="url"
                        id={`doc-url-${index}`}
                        className="form-control"
                        value={doc.url}
                        onChange={(e) => handleListChange(index, 'url', e.target.value, 'documents')}
                        placeholder="https://example.com/document.pdf"
                      />
                    </div>
                    <div className="col-md-2">
                      <button type="button" className="btn btn-danger btn-sm w-100" onClick={() => removeListItem(index, 'documents')}>
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
                <label htmlFor="environmentalImpact" className="form-label">Details</label>
                <textarea id="environmentalImpact" name="environmentalImpact" className="form-control" rows="5" value={facilityData.environmentalImpact} onChange={handleChange}></textarea>
              </div>
            )}

            {/* Investment Tab */}
            {activeTab === 'investment' && (
              <div>
                <h2 className="section-heading mb-3">Investment & Funding</h2>
                 <label htmlFor="fundingDetails" className="form-label">Details</label>
                <textarea id="fundingDetails" name="fundingDetails" className="form-control" rows="5" value={facilityData.fundingDetails} onChange={handleChange}></textarea>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div>
                <h2 className="section-heading mb-3">Contact Information</h2>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="contactPerson" className="form-label"><strong>Contact Person</strong></label>
                    <input type="text" id="contactPerson" name="contactPerson" className="form-control" value={facilityData.contactPerson} onChange={handleChange} />
                  </div>
                   <div className="col-md-6">
                     <label htmlFor="contactEmail" className="form-label"><strong>Email</strong></label>
                     <input type="email" id="contactEmail" name="contactEmail" className="form-control" value={facilityData.contactEmail} onChange={handleChange} />
                   </div>
                </div>
                 <div className="row mb-3">
                   <div className="col-md-6">
                     <label htmlFor="contactPhone" className="form-label"><strong>Phone</strong></label>
                     <input type="tel" id="contactPhone" name="contactPhone" className="form-control" value={facilityData.contactPhone} onChange={handleChange} />
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default FacilityCreatePage;