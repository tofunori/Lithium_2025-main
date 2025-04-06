import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import './HomePage.css';

function HomePage() {
  const mapContainerRef = useRef(null); // Ref for the map container div
  const mapInstanceRef = useRef(null); // Ref to store the map instance
  const markersRef = useRef({});
  const tileLayerRef = useRef(null); // Ref to store the current tile layer
  const [sizeByCapacity, setSizeByCapacity] = useState(false);
  const [facilitiesData, setFacilitiesData] = useState([]);
  const { isDarkMode } = useTheme(); // Get theme state

  useEffect(() => {
    const loadMapAndFacilities = async () => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        // Create map instance
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: [40, -95],
          zoom: 4,
        });

        // Tile Layer URLs
        const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const lightTileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        const darkTileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

        // Initial Tile Layer based on theme
        const initialTileUrl = isDarkMode ? darkTileUrl : lightTileUrl;
        const initialAttribution = isDarkMode ? darkTileAttribution : lightTileAttribution;

        tileLayerRef.current = L.tileLayer(initialTileUrl, {
          attribution: initialAttribution,
          maxZoom: 19, // CartoDB max zoom
        }).addTo(mapInstanceRef.current);

        try {
          const { getFacilities } = await import('../firebase');
          const facilities = await getFacilities();
          setFacilitiesData(facilities); // Store facilities data in state

          // Define status colors based on the legend
          const statusColors = {
            operating: '#4CAF50', // Green
            construction: '#FFC107', // Yellow
            planned: '#2196F3', // Blue
            pilot: '#9C27B0', // Purple
            default: '#2196F3' // Default blue for unknown/missing status
          };

          facilities.forEach(facility => {
            const coords = facility.geometry?.coordinates;
            const status = facility.properties?.status?.toLowerCase() || 'default';
            const color = statusColors[status] || statusColors.default;

            if (coords && coords.length === 2) {
              const [lng, lat] = coords; // GeoJSON order: [lng, lat]

              // Create a custom DivIcon for the marker
              const customIcon = L.divIcon({
                className: 'custom-div-icon', // Add a class for potential global styling
                html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                iconSize: [20, 20], // Size of the icon
                iconAnchor: [10, 10] // Point of the icon which will correspond to marker's location
              });

              // Create the marker and assign it to a variable
              const marker = L.marker([lat, lng], { icon: customIcon });

              // Add to map and bind popup
              marker.addTo(mapInstanceRef.current)
                    .bindPopup(`
                      <strong>${facility.properties?.company || 'Unknown'}</strong><br>
                      ${facility.properties?.name || ''}<br>
                      Location: ${facility.properties?.address || 'N/A'}<br>
                      Status: ${facility.properties?.status || 'N/A'}<br>
                      <a href="/facilities/${facility.id}">View Details</a>
                    `); // Removed target="_blank"
    
                  // Store the marker instance *after* it's created, using the correct variable
              markersRef.current[facility.id] = marker;
            }
          });
          // Initial marker size update after loading all markers
          updateMarkerSizes();
        } catch (error) {
          console.error('Error loading facilities for map:', error);
        }
      }
    };

    loadMapAndFacilities();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Initial map load

  // Function to calculate marker size based on capacity
  const calculateMarkerSize = useCallback((capacityString) => {
    const baseSize = 16; // Base size for the circle diameter
    const maxSize = 50; // Max size for the largest capacity
    const minSize = 10; // Min size for zero or small capacity

    // Extract number from string like "20,000 tonnes per year" or just "20000"
    const capacity = parseInt(String(capacityString).replace(/[^0-9]/g, ''), 10);

    if (isNaN(capacity) || capacity <= 0) {
      return minSize;
    }

    // Use a logarithmic scale for better visual differentiation
    // Adjust the scaling factor (e.g., 5) and base (e.g., 1000) as needed
    const scaledSize = baseSize + Math.log(capacity / 1000 + 1) * 5;

    return Math.max(minSize, Math.min(maxSize, Math.round(scaledSize)));
  }, []);


  // Function to create the icon HTML
  const createIconHtml = (color, size) => {
    return `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%;"></div>`; // Removed border, shadow, and opacity for uniform color
  };

  // Function to update all marker sizes
  const updateMarkerSizes = useCallback(() => {
    const statusColors = { /* Re-define or access from scope */
      operating: '#4CAF50', construction: '#FFC107', planned: '#2196F3', pilot: '#9C27B0', default: '#2196F3'
    };

    facilitiesData.forEach(facility => {
      const marker = markersRef.current[facility.id];
      if (!marker) return;

      const status = facility.properties?.status?.toLowerCase() || 'default';
      const color = statusColors[status] || statusColors.default;
      let size = 16; // Default fixed size

      if (sizeByCapacity) {
        size = calculateMarkerSize(facility.properties?.capacity);
      }

      const newIcon = L.divIcon({
        className: 'custom-div-icon',
        html: createIconHtml(color, size),
        iconSize: [size + 4, size + 4], // Add padding for border/shadow
        iconAnchor: [(size + 4) / 2, (size + 4) / 2]
      });

      marker.setIcon(newIcon);
    });
  }, [sizeByCapacity, facilitiesData, calculateMarkerSize]); // Dependencies

  // Effect to update markers when toggle changes or data loads
  useEffect(() => {
    // Ensure map and markers are loaded before updating
    if (mapInstanceRef.current && Object.keys(markersRef.current).length > 0) {
       updateMarkerSizes();
    }
  }, [sizeByCapacity, facilitiesData, updateMarkerSizes]);


  // Handler for the toggle switch
  const handleSizeToggle = (event) => {
    setSizeByCapacity(event.target.checked);
  };
  
    // Effect to update tile layer when theme changes
    useEffect(() => {
      if (!mapInstanceRef.current) return; // Map not yet initialized
  
      // Tile Layer URLs (repeated for clarity, could be defined outside)
      const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const lightTileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const darkTileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
  
      const newTileUrl = isDarkMode ? darkTileUrl : lightTileUrl;
      const newAttribution = isDarkMode ? darkTileAttribution : lightTileAttribution;
  
      // Remove old layer if it exists
      if (tileLayerRef.current) {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      }
  
      // Add new layer and update ref
      tileLayerRef.current = L.tileLayer(newTileUrl, {
        attribution: newAttribution,
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
  
    }, [isDarkMode]); // Dependency on theme state


  return (
    <div className="row" style={{ margin: 0, width: '100%' }}>
      <div className="col-12" style={{ padding: '0 15px' }}>
        <div className="map-container">
          {/* The map div - assign the ref here */}
          <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>

          {/* Legend remains the same */}
          <div className="legend">
            <h6 className="mb-2">Facility Status</h6>
            {/* ... legend items ... */}
             <div className="legend-item">
               <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
               <span>Operating</span>
             </div>
             <div className="legend-item">
               <div className="legend-color" style={{ backgroundColor: '#FFC107' }}></div>
               <span>Under Construction</span>
             </div>
             <div className="legend-item">
               <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
               <span>Planned</span>
             </div>
             <div className="legend-item">
               <div className="legend-color" style={{ backgroundColor: '#9C27B0' }}></div>
               <span>Pilot</span>
             </div>
            <hr style={{ margin: '8px 0' }} />
            <div className="form-check form-switch form-check-sm">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="sizeByCapacityToggle"
                checked={sizeByCapacity} // Control component state
                onChange={handleSizeToggle} // Attach handler
              />
              <label className="form-check-label" htmlFor="sizeByCapacityToggle" style={{ fontSize: '0.9em' }}>Size by Capacity</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;