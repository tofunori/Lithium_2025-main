import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import L, { Map, TileLayer as LeafletTileLayer, Marker, DivIcon } from 'leaflet'; // Import Leaflet types
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import { getFacilities, FacilityData } from '../firebase'; // Import getFacilities and FacilityData type
import './HomePage.css';

// Define status keys for color mapping
type StatusKey = 'operating' | 'construction' | 'planned' | 'pilot' | 'default';

const HomePage: React.FC = () => {
  const navigate = useNavigate(); // Get navigate function
  const mapContainerRef = useRef<HTMLDivElement>(null); // Type the ref for the map container div
  const mapInstanceRef = useRef<Map | null>(null); // Type the ref for the map instance
  const markersRef = useRef<Record<string, Marker>>({}); // Type the markers ref
  const tileLayerRef = useRef<LeafletTileLayer | null>(null); // Type the ref for the tile layer
  const [sizeByCapacity, setSizeByCapacity] = useState<boolean>(false);
  const [facilitiesData, setFacilitiesData] = useState<FacilityData[]>([]);
  const { isDarkMode } = useTheme(); // Get theme state

  // Function to calculate marker size based on capacity
  const calculateMarkerSize = useCallback((capacityString: string | number | undefined | null): number => {
    const baseSize = 16; // Base size for the circle diameter
    const maxSize = 50; // Max size for the largest capacity
    const minSize = 10; // Min size for zero or small capacity

    // Extract number from string like "20,000 tonnes per year" or just "20000"
    const capacity = parseInt(String(capacityString || '0').replace(/[^0-9]/g, ''), 10);

    if (isNaN(capacity) || capacity <= 0) {
      return minSize;
    }

    // Use a logarithmic scale for better visual differentiation
    // Adjust the scaling factor (e.g., 5) and base (e.g., 1000) as needed
    const scaledSize = baseSize + Math.log(capacity / 1000 + 1) * 5;

    return Math.max(minSize, Math.min(maxSize, Math.round(scaledSize)));
  }, []);

  // Function to create the icon HTML
  const createIconHtml = (color: string, size: number): string => {
    // Simple colored circle
    return `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 0 3px rgba(0,0,0,0.5);"></div>`;
  };

  // Function to update all marker sizes and styles
  const updateMarkerSizes = useCallback(() => {
    const statusColors: Record<StatusKey, string> = {
      operating: '#4CAF50', construction: '#FFC107', planned: '#2196F3', pilot: '#9C27B0', default: '#6c757d' // Grey default
    };

    facilitiesData.forEach(facility => {
      const marker = markersRef.current[facility.id];
      if (!marker) return;

      const status = (facility.properties?.status?.toLowerCase() || 'default') as StatusKey;
      const color = statusColors[status] || statusColors.default;
      let size = 16; // Default fixed size

      if (sizeByCapacity) {
        size = calculateMarkerSize(facility.properties?.capacity);
      }

      const newIcon: DivIcon = L.divIcon({
        className: 'custom-div-icon', // Keep class for potential global styling
        html: createIconHtml(color, size),
        iconSize: [size, size], // Icon size matches the div size
        iconAnchor: [size / 2, size / 2] // Anchor to the center
      });

      marker.setIcon(newIcon);
    });
  }, [sizeByCapacity, facilitiesData, calculateMarkerSize]); // Dependencies


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
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        try {
          // Fetch facilities (already imported)
          const facilities = await getFacilities();
          setFacilitiesData(facilities); // Store facilities data in state

          // Define status colors
          const statusColors: Record<StatusKey, string> = {
            operating: '#4CAF50', construction: '#FFC107', planned: '#2196F3', pilot: '#9C27B0', default: '#6c757d'
          };

          // Clear existing markers before adding new ones (important for re-renders if needed)
          Object.values(markersRef.current).forEach(marker => marker.remove());
          markersRef.current = {};

          facilities.forEach(facility => {
            // Check for valid geometry and coordinates
            if (
              facility.geometry &&
              Array.isArray(facility.geometry.coordinates) &&
              facility.geometry.coordinates.length >= 2 &&
              typeof facility.geometry.coordinates[1] === 'number' && // Latitude
              typeof facility.geometry.coordinates[0] === 'number'    // Longitude
            ) {
              const lat = facility.geometry.coordinates[1];
              const lng = facility.geometry.coordinates[0];

              // Use optional chaining and provide default for status
              const status = (facility.properties?.status?.toLowerCase() || 'default') as StatusKey;
              const color = statusColors[status] || statusColors.default;
              const initialSize = 16; // Initial fixed size

              // Create initial DivIcon
              const initialIcon: DivIcon = L.divIcon({
                className: 'custom-div-icon',
                html: createIconHtml(color, initialSize),
                iconSize: [initialSize, initialSize],
                iconAnchor: [initialSize / 2, initialSize / 2]
              });

              const marker = L.marker([lat, lng], { icon: initialIcon });

              // Create popup content dynamically
              const popupContent = document.createElement('div');
              popupContent.className = 'facility-popup'; // Add class for styling
              popupContent.innerHTML = `
                <strong class="popup-title">${facility.properties?.company || 'Unknown'}</strong><br>
                <span class="popup-detail">Location: ${facility.properties?.address || 'N/A'}</span><br>
                <span class="popup-detail">Status: ${facility.properties?.status || 'N/A'}</span><br>
              `;

              const viewDetailsButton = document.createElement('button');
              viewDetailsButton.innerText = 'View Details';
              viewDetailsButton.className = 'popup-details-link';
              viewDetailsButton.onclick = () => navigate(`/facilities/${facility.id}`);

              popupContent.appendChild(viewDetailsButton);

              marker.addTo(mapInstanceRef.current as Map) // Assert map instance is not null here
                    .bindPopup(popupContent);

              markersRef.current[facility.id] = marker;
            } else {
                // Log the actual lat/lng values that were found to be invalid
                console.warn(`Facility ${facility.id} has invalid coordinates: lat=${lat}, lng=${lng}`);
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

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial map load only

  // Effect to update markers when toggle changes or data loads
  useEffect(() => {
    if (mapInstanceRef.current && facilitiesData.length > 0) {
       updateMarkerSizes();
    }
  }, [sizeByCapacity, facilitiesData, updateMarkerSizes]);


  // Handler for the toggle switch - Type event
  const handleSizeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setSizeByCapacity(event.target.checked);
  };

    // Effect to update tile layer when theme changes
    useEffect(() => {
      if (!mapInstanceRef.current) return; // Map not yet initialized

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
    // Use a wrapper div that controls the overall layout if needed
    <div className="home-page-container">
        <div className="map-container">
          {/* The map div */}
          <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>

          {/* Legend */}
          <div className="legend card shadow-sm"> {/* Added card and shadow */}
            <div className="card-body p-2"> {/* Added padding */}
                <h6 className="mb-2 card-title">Facility Status</h6>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                    <span>Operating</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#FFC107' }}></div>
                    <span>Construction</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#2196F3' }}></div>
                    <span>Planned</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#9C27B0' }}></div>
                    <span>Pilot</span>
                </div>
                 <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#6c757d' }}></div>
                    <span>Unknown</span>
                </div>
                <hr style={{ margin: '8px 0' }} />
                <div className="form-check form-switch form-check-sm">
                <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="sizeByCapacityToggle"
                    checked={sizeByCapacity}
                    onChange={handleSizeToggle}
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