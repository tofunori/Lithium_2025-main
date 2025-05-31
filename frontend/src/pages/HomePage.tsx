// frontend/src/pages/HomePage.tsx
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L, { Map, TileLayer as LeafletTileLayer, Marker, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Select, { SingleValue } from 'react-select';
import { useTheme } from '../context/ThemeContext';
// UPDATED: Import Facility and the correct getFacilities function
import { getFacilities, Facility } from '../supabaseDataService'; // Changed FacilityData to Facility
import {
  CanonicalStatus,
  getCanonicalStatus,
  getStatusLabel,
  ALL_CANONICAL_STATUSES // Use this to include 'unknown' in legend/colors
} from '../utils/statusUtils'; // Import status utilities
import {
  getTechnologyCategoryColor,
  getAllTechnologyCategories,
  getTechnologyCategoryLabel
} from '../utils/technologyUtils'; // Import technology utilities
import './HomePage.css';

// Define Basemap configuration type
interface BasemapConfig {
  url: string;
  attribution: string;
  name: string; // For display in the selector
}

// Define available basemaps
const basemaps: Record<string, BasemapConfig> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Satellite',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Dark Mode',
  },
  // Add more basemaps here if needed
};


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Record<string, Marker>>({}); // Type the markers ref (use facility.id as string key)
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const [sizeByCapacity, setSizeByCapacity] = useState<boolean>(false);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);
  const [selectedTechnology, setSelectedTechnology] = useState<string>('all');
  const [selectedBasemap, setSelectedBasemap] = useState<string>('osm'); // State for selected basemap key
  const [colorByTechnology, setColorByTechnology] = useState<boolean>(false); // New state for color mode
  const { isDarkMode } = useTheme(); // Keep theme state for potential future use or initial default

  // Define react-select option type
  interface OptionType {
    value: string; // Can be technology key or basemap key
    label: string;
  }

  // --- Technology Filter Options ---
  const technologyOptions = useMemo((): OptionType[] => {
     const techSet = new Set<string>();
     facilitiesData.forEach(facility => {
       const tech = facility.technology_category; // Use technology_category
       if (tech && typeof tech === 'string' && tech.trim() !== '') {
         techSet.add(tech.trim());
       }
     });
     // Map to { value, label } format and add 'All' option
     const options: OptionType[] = Array.from(techSet).sort().map(tech => ({ value: tech, label: tech }));
     return [{ value: 'all', label: 'All Categories' }, ...options];
   }, [facilitiesData]);

  const currentSelectedTechnologyOption = useMemo(() => {
    return technologyOptions.find(option => option.value === selectedTechnology);
  }, [selectedTechnology, technologyOptions]);

  // --- Basemap Filter Options ---
  const basemapOptions = useMemo((): OptionType[] => {
    return Object.keys(basemaps).map(key => ({
      value: key,
      label: basemaps[key].name,
    }));
  }, []); // No dependencies, basemaps are static

  const currentSelectedBasemapOption = useMemo(() => {
    return basemapOptions.find(option => option.value === selectedBasemap);
  }, [selectedBasemap, basemapOptions]);


  // Function to calculate marker size based on capacity
  // UPDATED: Improved scaling algorithm for better visual differentiation
  const calculateMarkerSize = useCallback((capacity: number | null | undefined): number => {
    const baseSize = 12; // Smaller base size to allow more room for growth
    const maxSize = 60; // Increased max size for larger capacity facilities
    const minSize = 8; // Smaller min size for better contrast

    // Use capacity directly as it's already number | null | undefined
    const numericCapacity = capacity ?? 0;

    if (isNaN(numericCapacity) || numericCapacity <= 0) {
      return minSize;
    }

    // Use a square root scale for better visual differentiation
    // This provides more balanced scaling across the capacity range
    // From the data: small facilities ~5,000t, large facilities ~40,000t+
    const normalizedCapacity = Math.sqrt(numericCapacity / 1000); // Normalize and take square root
    const scaledSize = baseSize + (normalizedCapacity * 2.5); // Scale factor for visual appeal

    // Ensure size is within bounds and round to nearest pixel
    const finalSize = Math.max(minSize, Math.min(maxSize, Math.round(scaledSize)));
    
    // Add some visual debugging if needed (can be removed later)
    // console.log(`Capacity: ${numericCapacity}t -> Size: ${finalSize}px`);
    
    return finalSize;
  }, []);

  // Function to create the icon HTML
  const createIconHtml = (color: string, size: number): string => {
    // Calculate proportional border and shadow based on size
    const borderWidth = Math.max(1, Math.round(size * 0.08)); // 8% of size, minimum 1px
    const shadowBlur = Math.max(2, Math.round(size * 0.15)); // 15% of size for shadow
    const shadowSpread = Math.max(1, Math.round(size * 0.05)); // 5% of size for shadow spread
    
    // Enhanced colored circle with better visual effects
    return `<div style="
      background-color: ${color}; 
      width: ${size}px; 
      height: ${size}px; 
      border-radius: 50%; 
      border: ${borderWidth}px solid rgba(255,255,255,0.8); 
      box-shadow: 
        0 0 ${shadowBlur}px rgba(0,0,0,0.4),
        0 ${Math.round(shadowSpread/2)}px ${shadowSpread}px rgba(0,0,0,0.2);
      transition: all 0.2s ease-in-out;
      cursor: pointer;
    " 
    onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 0 ${shadowBlur * 1.5}px rgba(0,0,0,0.6), 0 ${shadowSpread}px ${shadowSpread * 1.5}px rgba(0,0,0,0.3)';" 
    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 0 ${shadowBlur}px rgba(0,0,0,0.4), 0 ${Math.round(shadowSpread/2)}px ${shadowSpread}px rgba(0,0,0,0.2)';"
    ></div>`;
  };

  // Define status colors using CanonicalStatus keys
  const statusColors: Record<CanonicalStatus, string> = {
    operating: '#4CAF50', // Green
    construction: '#FFC107', // Amber
    planned: '#2196F3', // Blue
    closed: '#000000', // Black for closed
    unknown: '#6c757d' // Grey for unknown
  };

  // Define technology colors using the technology categories
  const technologyColors: Record<string, string> = useMemo(() => {
    const colors: Record<string, string> = {};
    getAllTechnologyCategories().forEach(category => {
      colors[category] = getTechnologyCategoryColor(category);
    });
    return colors;
  }, []);
  
  // Function to update all marker sizes and styles
  const updateMarkerSizes = useCallback(() => {
    // Add validation to filter out facilities with invalid coordinates before creating markers
    const validFacilities = facilitiesData.filter(facility => 
      facility.Latitude !== null && facility.Longitude !== null &&
      typeof facility.Latitude === 'number' && typeof facility.Longitude === 'number'
    );

    // Update the loop to use validFacilities instead of facilitiesData
    validFacilities.forEach(facility => {
      const marker = markersRef.current[facility.ID]; // Use facility.ID (uppercase)
      if (!marker) return;

      // Use correct DB column name "Operational Status"
      const statusName = facility["Operational Status"]; // Use DB column name
      const canonicalStatus = getCanonicalStatus(statusName);
      
      // Determine color based on color mode
      let color: string;
      if (colorByTechnology) {
        const techCategory = facility.technology_category || 'Other';
        color = technologyColors[techCategory] || technologyColors['Other'];
      } else {
        color = statusColors[canonicalStatus];
      }

      let size = 16; // Default fixed size

      if (sizeByCapacity) {
        // Use correct property name from Facility interface
        size = calculateMarkerSize(facility.capacity_tonnes_per_year);
      }

      const newIcon: DivIcon = L.divIcon({
        className: 'custom-div-icon', // Keep class for potential global styling
        html: createIconHtml(color, size),
        iconSize: [size, size], // Icon size matches the div size
        iconAnchor: [size / 2, size / 2] // Anchor to the center
      });

      marker.setIcon(newIcon);
    });
  }, [sizeByCapacity, facilitiesData, calculateMarkerSize, statusColors, colorByTechnology, technologyColors]); // Dependencies updated


  // Effect to load map and initial facilities
  useEffect(() => {
    const loadMapAndFacilities = async () => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        // Create map instance
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: [40, -95],
          zoom: 4,
        });

        // Initial Tile Layer setup is now handled by the basemap effect below
        // tileLayerRef.current = L.tileLayer(...) // Remove initial setup here

        try {
          // Fetch facilities
          const facilities = await getFacilities();
          setFacilitiesData(facilities); // Store facilities data in state (now Facility[])

          // Status colors are defined outside useEffect now

          // Clear existing markers before adding new ones (important for re-renders if needed)
          Object.values(markersRef.current).forEach(marker => marker.remove());
          markersRef.current = {}; // Clear marker references

          // Initial marker rendering (will be updated by filter effect)
          // We don't need to draw markers here initially if the filter effect handles it
          // setFacilitiesData(facilities); // Set data, which triggers the filter/marker effect

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


  // Effect to update markers based on filters (technology, size) and data changes
  useEffect(() => {
    if (!mapInstanceRef.current || facilitiesData.length === 0) {
      return; // Don't run if map isn't ready or no data
    }

    // Clear existing markers from the map AND the ref
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Filter facilities based on selected technology
    const filteredFacilities = facilitiesData.filter(facility => {
      if (selectedTechnology === 'all') {
         return true; // Show all if 'all' is selected
       }
       // Use technology_category for filtering
       const facilityCategory = facility.technology_category; // Use technology_category
       return facilityCategory === selectedTechnology;
     });

    // Add markers for filtered facilities
    filteredFacilities.forEach(facility => {
      const lat = facility.Latitude; // Use facility.Latitude (uppercase)
            const lng = facility.Longitude; // Use facility.Longitude (uppercase)

      if (lat !== null && lng !== null && typeof lat === 'number' && typeof lng === 'number') {
        // Use correct DB column name "Operational Status"
        const statusName = facility["Operational Status"]; // Use DB column name
        const canonicalStatus = getCanonicalStatus(statusName);
        
        // Determine color based on color mode
        let color: string;
        if (colorByTechnology) {
          const techCategory = facility.technology_category || 'Other';
          color = technologyColors[techCategory] || technologyColors['Other'];
        } else {
          color = statusColors[canonicalStatus];
        }

        // Determine size based on toggle
        let size = 16; // Default fixed size
        if (sizeByCapacity) {
          // Use correct property name from Facility interface
          size = calculateMarkerSize(facility.capacity_tonnes_per_year);
        }

        // Create DivIcon with correct color and size
        const icon: DivIcon = L.divIcon({
          className: 'custom-div-icon',
          html: createIconHtml(color, size),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker([lat, lng], { icon: icon });

              // Create popup content dynamically
              const popupContent = document.createElement('div');
              popupContent.className = 'facility-popup'; // Add class for styling
              
              // Build popup HTML with minimalist academic design
              let popupHtml = `
                <div class="popup-content-wrapper">
                  <h3 class="popup-title">${facility.Company || 'Unknown Facility'}</h3>
              `;
              
              // Technology row (always show if available)
              if (facility.technology_category) {
                popupHtml += `
                  <div class="popup-detail-row">
                    <span class="popup-detail-label">Technology</span>
                    <span class="popup-detail-value popup-tech-value">${getTechnologyCategoryLabel(facility.technology_category)}</span>
                  </div>
                `;
              }
              
              // Status row
              const statusClass = canonicalStatus.replace(/\s+/g, '-').toLowerCase();
              popupHtml += `
                <div class="popup-detail-row">
                  <span class="popup-detail-label">Status</span>
                  <span class="popup-detail-value">
                    <span class="popup-status status-${statusClass}">${getStatusLabel(canonicalStatus)}</span>
                  </span>
                </div>
              `;
              
              // Capacity row if available
              if (facility.capacity_tonnes_per_year) {
                popupHtml += `
                  <div class="popup-detail-row">
                    <span class="popup-detail-label">Capacity</span>
                    <span class="popup-detail-value popup-capacity-value">${facility.capacity_tonnes_per_year.toLocaleString()} t/yr</span>
                  </div>
                `;
              }
              
              // Location row (moved to last)
              if (facility.Location) {
                popupHtml += `
                  <div class="popup-detail-row">
                    <span class="popup-detail-label">Location</span>
                    <span class="popup-detail-value">${facility.Location}</span>
                  </div>
                `;
              }
              
              // Add divider and link
              popupHtml += `
                  <div class="popup-divider"></div>
                  <a href="#" class="popup-details-link" data-facility-id="${facility.ID}">View full details →</a>
                </div>
              `;
              
              popupContent.innerHTML = popupHtml;
              
              // Add click handler to the link
              const link = popupContent.querySelector('.popup-details-link');
              if (link) {
                link.addEventListener('click', (e) => {
                  e.preventDefault();
                  navigate(`/facilities/${facility.ID}`);
                });
              }

        marker.addTo(mapInstanceRef.current as Map) // Assert map instance is not null here
              .bindPopup(popupContent, {
                maxWidth: 320,
                minWidth: 260,
                className: 'academic-popup'
              });

        // Use facility.ID as string key (uppercase)
        markersRef.current[facility.ID] = marker;
      } else {
          // Log the actual lat/lng values that were found to be invalid
          console.warn(`Facility ${facility.ID} has invalid or incomplete coordinates: lat=${lat}, lng=${lng}`); // Use facility.ID (uppercase)
      }
    });

    // No need to call updateMarkerSizes separately, as sizes are set during creation now
    // updateMarkerSizes(); // Remove this call

  // Dependencies: map instance, data, filters, and sizing logic
  }, [mapInstanceRef, facilitiesData, selectedTechnology, sizeByCapacity, calculateMarkerSize, statusColors, navigate, createIconHtml, colorByTechnology, technologyColors]); // Added selectedTechnology


  // Handler for the size toggle switch - Type event
  const handleSizeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setSizeByCapacity(event.target.checked);
  };

  // Handler for the color mode toggle
  const handleColorModeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setColorByTechnology(event.target.checked);
  };

  const handleTechnologyChange = (selectedOption: SingleValue<OptionType>) => {
    setSelectedTechnology(selectedOption ? selectedOption.value : 'all');
  };

  // Handler for the react-select basemap filter dropdown
  const handleBasemapChange = (selectedOption: SingleValue<OptionType>) => {
    setSelectedBasemap(selectedOption ? selectedOption.value : 'osm'); // Default to 'osm' if null
  };

  // Custom styles for react-select to match Bootstrap's form-select-sm and control width
  const selectStyles = {
    control: (provided: any, state: { isFocused: boolean }) => ({
      ...provided,
      minHeight: 'calc(1.5em + 0.5rem + 2px)', // Match form-select-sm height
      height: 'calc(1.5em + 0.5rem + 2px)',
       fontSize: '.875rem', // Match form-select-sm font size
       borderColor: state.isFocused ? '#86b7fe' : '#ced4da', // Bootstrap focus/default border
       boxShadow: 'none', // REMOVED focus shadow to prevent layout shift
       '&:hover': {
         borderColor: state.isFocused ? '#86b7fe' : '#adb5bd' // Slightly darker border on hover
       },
      width: '100%', // Force control width
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: 'calc(1.5em + 0.5rem + 2px)', // Match control height
      padding: '0.25rem 0.5rem', // Match form-select-sm padding
      top: '50%', // Adjust vertical alignment if needed
      transform: 'translateY(-50%)'
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: 'auto', // Let container control height
    }),
    indicatorSeparator: () => ({
      display: 'none', // Hide separator
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: 'calc(1.5em + 0.5rem + 2px)', // Match control height
    }),
    menu: (provided: any) => ({
      ...provided,
       width: '100%', // Force menu width to match control
       minWidth: '100%',
       boxSizing: 'border-box',
       zIndex: 1001, // Ensure menu appears above legend (legend z-index is 1000)
      }),
      // Style the portal itself to ensure it's above other elements like the legend
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999 // Use a high z-index for the portal
      }),
       option: (provided: any, state: { isSelected: boolean, isFocused: boolean }) => ({
      ...provided,
      fontSize: '.875rem', // Match sm font size
      backgroundColor: state.isSelected ? '#0d6efd' : state.isFocused ? '#e9ecef' : provided.backgroundColor,
      color: state.isSelected ? 'white' : provided.color,
      '&:active': {
        backgroundColor: !state.isSelected ? '#dee2e6' : undefined, // Mimic Bootstrap active state
      },
    }),
  };

  // Effect to update tile layer based on selectedBasemap
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const basemapConfig = basemaps[selectedBasemap] || basemaps.osm; // Fallback to OSM

    // Remove old layer if it exists
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Add new layer and update ref
    tileLayerRef.current = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      maxZoom: 19, // Adjust as needed
    }).addTo(mapInstanceRef.current);

    // Optional: Bring markers to front if needed after tile change
    // Object.values(markersRef.current).forEach(marker => marker.bringToFront());

  }, [selectedBasemap]); // Dependency on selected basemap


  return (
    <div className="home-page-container"> {/* This will be the flex container */}
      {/* Map Area */}
      <div className="map-area">
        <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
      </div>

      {/* Sidebar Area */}
      <div className="map-sidebar">
        {/* Legend and Filters moved here */}
        <div className="legend card shadow-sm"> {/* Keep card styling for the content block */}
          <div className="card-body p-2">
            <h6 className="mb-2 card-title">
              {colorByTechnology ? 'Technology Categories' : 'Facility Status'}
            </h6>
            {/* Dynamically generate legend items based on color mode */}
            {colorByTechnology ? (
              // Show technology categories
              getAllTechnologyCategories().map(techCategory => (
                <div className="legend-item" key={techCategory}>
                  <div className="legend-color" style={{ backgroundColor: technologyColors[techCategory] }}></div>
                  <span>{getTechnologyCategoryLabel(techCategory)}</span>
                </div>
              ))
            ) : (
              // Show status categories
              ALL_CANONICAL_STATUSES.map(statusKey => (
                <div className="legend-item" key={statusKey}>
                  <div className="legend-color" style={{ backgroundColor: statusColors[statusKey] }}></div>
                  <span>{getStatusLabel(statusKey)}</span>
                </div>
              ))
            )}
                <hr />
                
                {/* Toggle Controls Section */}
                <div className="toggle-section">
                  {/* Color Mode Toggle */}
                  <div className="form-check form-switch form-check-sm">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="colorByTechnologyToggle"
                      checked={colorByTechnology}
                      onChange={handleColorModeToggle}
                    />
                    <label className="form-check-label" htmlFor="colorByTechnologyToggle" style={{ fontSize: '0.9em' }}>
                      Color by Technology
                    </label>
                  </div>
                  
                  {/* Size by Capacity Toggle */}
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
                  
                  {/* Size by Capacity Helper Text */}
                  {sizeByCapacity && (
                    <div className="capacity-helper">
                      <i className="fas fa-info-circle"></i>
                      Larger markers = higher capacity
                    </div>
                  )}
                </div>
                
                <hr />
                
                {/* Technology Filter Dropdown using react-select */}
                  <div className="technology-filter-container"> {/* Keep container for label spacing */}
                    <label htmlFor="technologySelect" className="form-label mb-1" style={{ fontSize: '0.9em' }}>Category:</label>
                    <Select<OptionType>
                      inputId="technologySelect"
                      options={technologyOptions}
                     value={currentSelectedTechnologyOption} // Use correct state value
                     onChange={handleTechnologyChange}
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isSearchable={false}
                      aria-label="Select Technology Filter"
                    />
                  </div>
                  {/* Basemap Filter Dropdown */}
                  <hr />
                  <div className="basemap-filter-container">
                    <label htmlFor="basemapSelect" className="form-label mb-1" style={{ fontSize: '0.9em' }}>Basemap:</label>
                    <Select<OptionType>
                      inputId="basemapSelect"
                      options={basemapOptions}
                      value={currentSelectedBasemapOption}
                      onChange={handleBasemapChange}
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isSearchable={false}
                      aria-label="Select Basemap"
                    />
                  </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
