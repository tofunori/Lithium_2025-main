 // frontend/src/pages/HomePage.tsx
import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import L, { Map, TileLayer as LeafletTileLayer, Marker, DivIcon } from 'leaflet'; // Import Leaflet types
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
// UPDATED: Import Facility and the correct getFacilities function
import { getFacilities, Facility } from '../supabaseDataService'; // Changed FacilityData to Facility
import {
  CanonicalStatus,
  getCanonicalStatus,
  getStatusLabel,
  ALL_CANONICAL_STATUSES // Use this to include 'unknown' in legend/colors
} from '../utils/statusUtils'; // Import status utilities
import './HomePage.css';

// Removed local StatusKey type

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null); // Type the ref for the map container div
  const mapInstanceRef = useRef<Map | null>(null); // Type the ref for the map instance
  const markersRef = useRef<Record<string, Marker>>({}); // Type the markers ref (use facility.id as string key)
  const tileLayerRef = useRef<LeafletTileLayer | null>(null); // Type the ref for the tile layer
  const [sizeByCapacity, setSizeByCapacity] = useState<boolean>(false);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]); // UPDATED: Use Facility type
  const { isDarkMode } = useTheme(); // Get theme state

  // Function to calculate marker size based on capacity
  // UPDATED: Parameter type to match Facility.processing_capacity_mt_year
  const calculateMarkerSize = useCallback((capacity: number | null | undefined): number => {
    const baseSize = 16; // Base size for the circle diameter
    const maxSize = 50; // Max size for the largest capacity
    const minSize = 10; // Min size for zero or small capacity

    // Use capacity directly as it's already number | null | undefined
    const numericCapacity = capacity ?? 0;

    if (isNaN(numericCapacity) || numericCapacity <= 0) {
      return minSize;
    }

    // Use a logarithmic scale for better visual differentiation
    // Adjust the scaling factor (e.g., 5) and base (e.g., 1000) as needed
    const scaledSize = baseSize + Math.log(numericCapacity / 1000 + 1) * 5;

    return Math.max(minSize, Math.min(maxSize, Math.round(scaledSize)));
  }, []);

  // Function to create the icon HTML
  const createIconHtml = (color: string, size: number): string => {
    // Simple colored circle
    return `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 0 3px rgba(0,0,0,0.5);"></div>`;
  };

  // Define status colors using CanonicalStatus keys
  const statusColors: Record<CanonicalStatus, string> = {
    operating: '#4CAF50', // Green
    construction: '#FFC107', // Amber
    planned: '#2196F3', // Blue
    unknown: '#6c757d' // Grey for unknown
  };

  // Function to update all marker sizes and styles
  const updateMarkerSizes = useCallback(() => {
    facilitiesData.forEach(facility => {
      const marker = markersRef.current[facility.ID]; // Use facility.ID (uppercase)
      if (!marker) return;

      // Use correct DB column name "Operational Status"
      const statusName = facility["Operational Status"]; // Use DB column name
      const canonicalStatus = getCanonicalStatus(statusName);
      const color = statusColors[canonicalStatus]; // Use the map defined above
      let size = 16; // Default fixed size

      if (sizeByCapacity) {
        // Use correct DB column name "Annual Processing Capacity (tonnes/year)"
        size = calculateMarkerSize(facility["Annual Processing Capacity (tonnes/year)"]); // Use DB column name
      }

      const newIcon: DivIcon = L.divIcon({
        className: 'custom-div-icon', // Keep class for potential global styling
        html: createIconHtml(color, size),
        iconSize: [size, size], // Icon size matches the div size
        iconAnchor: [size / 2, size / 2] // Anchor to the center
      });

      marker.setIcon(newIcon);
    });
  }, [sizeByCapacity, facilitiesData, calculateMarkerSize, statusColors]); // Dependencies updated

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
          setFacilitiesData(facilities); // Store facilities data in state (now Facility[])

          // Status colors are defined outside useEffect now

          // Clear existing markers before adding new ones (important for re-renders if needed)
          Object.values(markersRef.current).forEach(marker => marker.remove());
          markersRef.current = {};

          facilities.forEach(facility => {
            // UPDATED: Check for valid latitude and longitude directly from facility
            const lat = facility.Latitude; // Use facility.Latitude (uppercase)
            const lng = facility.Longitude; // Use facility.Longitude (uppercase)

            if (lat !== null && lng !== null && typeof lat === 'number' && typeof lng === 'number') {
              // Use correct DB column name "Operational Status"
              const statusName = facility["Operational Status"]; // Use DB column name
              const canonicalStatus = getCanonicalStatus(statusName);
              const color = statusColors[canonicalStatus]; // Use the map defined above
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
              // Use correct DB column names
              popupContent.innerHTML = `
                <strong class="popup-title">${facility.Company || 'Unknown'}</strong><br>
                <span class="popup-detail">Location: ${facility.Location || 'N/A'}</span><br>
                <span class="popup-detail">Status: ${statusName || 'N/A'}</span><br>
              `;

              const viewDetailsButton = document.createElement('button');
              viewDetailsButton.innerText = 'View Details';
              viewDetailsButton.className = 'popup-details-link';
              // Use facility.ID for navigation (uppercase)
              viewDetailsButton.onclick = () => navigate(`/facilities/${facility.ID}`);

              popupContent.appendChild(viewDetailsButton);

              marker.addTo(mapInstanceRef.current as Map) // Assert map instance is not null here
                    .bindPopup(popupContent);

              // Use facility.ID as string key (uppercase)
              markersRef.current[facility.ID] = marker;
            } else {
                // Log the actual lat/lng values that were found to be invalid
                console.warn(`Facility ${facility.ID} has invalid or incomplete coordinates: lat=${lat}, lng=${lng}`); // Use facility.ID (uppercase)
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
      // Use Esri Satellite for dark mode
      const darkTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      const darkTileAttribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

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
          <div className="legend card shadow-sm">
            <div className="card-body p-2">
                <h6 className="mb-2 card-title">Facility Status</h6>
                {/* Dynamically generate legend items from statusUtils */}
                {ALL_CANONICAL_STATUSES.map(statusKey => (
                  <div className="legend-item" key={statusKey}>
                    <div className="legend-color" style={{ backgroundColor: statusColors[statusKey] }}></div>
                    <span>{getStatusLabel(statusKey)}</span>
                  </div>
                ))}
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
