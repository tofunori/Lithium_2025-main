// frontend/src/pages/HomePage.tsx
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L, { Map, TileLayer as LeafletTileLayer, Marker, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Select, { SingleValue } from 'react-select';
import { useTheme } from '../context/ThemeContext';
import MapControls from '../components/MapControls';
import MapExportModal from '../components/MapExportModal';
// UPDATED: Import Facility and the correct getFacilities function
import { getFacilities, Facility } from '../services'; // Changed FacilityData to Facility
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
  modern: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Modern Light',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Modern Dark',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Satellite',
  },
  terrain: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'Terrain',
  },
  watercolor: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Minimal',
  },
};


const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme(); // Get theme context
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Record<string, Marker>>({}); // Type the markers ref (use facility.id as string key)
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const [sizeByCapacity, setSizeByCapacity] = useState<boolean>(false);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);
  const [selectedTechnology, setSelectedTechnology] = useState<string>('all');
  const [selectedBasemap, setSelectedBasemap] = useState<string>(isDarkMode ? 'dark' : 'modern'); // State for selected basemap key
  const [colorByTechnology, setColorByTechnology] = useState<boolean>(false); // New state for color mode
  const [showExportModal, setShowExportModal] = useState(false);

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
    // Modern marker with glassmorphism and subtle animations
    const innerSize = Math.round(size * 0.65);
    
    return `
    <div class="modern-map-marker" style="
      width: ${size}px;
      height: ${size}px;
      position: relative;
      cursor: pointer;
    ">
      <!-- Background glow -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${size + 4}px;
        height: ${size + 4}px;
        background: ${color};
        opacity: 0.2;
        border-radius: 50%;
        filter: blur(4px);
      "></div>
      
      <!-- Main marker -->
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(10px);
        box-shadow: 
          0 2px 10px rgba(0, 0, 0, 0.1),
          0 4px 20px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      "></div>
      
      <!-- Inner color dot -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${innerSize}px;
        height: ${innerSize}px;
        background: ${color};
        border-radius: 50%;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      "></div>
      
      <!-- Center highlight -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: ${Math.round(innerSize * 0.3)}px;
        height: ${Math.round(innerSize * 0.3)}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        filter: blur(2px);
      "></div>
    </div>`;
  };

  // Define modern status colors using CanonicalStatus keys
  const statusColors: Record<CanonicalStatus, string> = {
    operating: '#10b981', // Emerald green
    construction: '#f59e0b', // Amber
    planned: '#3b82f6', // Blue
    closed: '#dc2626', // Red
    unknown: '#94a3b8' // Slate gray
  };

  // Effect to load map and initial facilities
  useEffect(() => {
    const loadMapAndFacilities = async () => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        // Create map instance
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: [40, -95],
          zoom: 4,
          zoomControl: false, // Disable default zoom control
        });

        // Add mouse move listener for coordinates
        mapInstanceRef.current.on('mousemove', (e: L.LeafletMouseEvent) => {
          const coordsElement = document.getElementById('map-coordinates');
          if (coordsElement) {
            const lat = e.latlng.lat.toFixed(4);
            const lng = e.latlng.lng.toFixed(4);
            const latDir = e.latlng.lat >= 0 ? 'N' : 'S';
            const lngDir = e.latlng.lng >= 0 ? 'E' : 'W';
            coordsElement.textContent = `${Math.abs(parseFloat(lat))}°${latDir}, ${Math.abs(parseFloat(lng))}°${lngDir}`;
          }
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


  // Filter facilities based on selected technology
  const filteredFacilities = useMemo(() => {
    return facilitiesData.filter(facility => {
      if (selectedTechnology === 'all') {
         return true; // Show all if 'all' is selected
       }
       // Use technology_category for filtering
       const facilityCategory = facility.technology_category; // Use technology_category
       return facilityCategory === selectedTechnology;
     });
  }, [facilitiesData, selectedTechnology]);

  // Effect to update markers based on filters (technology, size) and data changes
  useEffect(() => {
    if (!mapInstanceRef.current || facilitiesData.length === 0) {
      return; // Don't run if map isn't ready or no data
    }

    // Clear existing markers from the map AND the ref
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

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
          const rawCategory = facility.technology_category || 'Mechanical';
          const techCategory = rawCategory.trim();
          const normalized = techCategory.toLowerCase();
          const validCategories = ['hydrometallurgy', 'pyrometallurgy', 'mechanical', 'hybrid'];
          const categoryToUse = validCategories.includes(normalized) ? techCategory : 'Mechanical';
          color = getTechnologyCategoryColor(categoryToUse);
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
  }, [mapInstanceRef, facilitiesData, selectedTechnology, sizeByCapacity, calculateMarkerSize, statusColors, navigate, createIconHtml, colorByTechnology]); // Added selectedTechnology


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

  // Custom styles for react-select to match Bootstrap's form-select-sm with theme support
  const selectStyles = {
    control: (provided: any, state: { isFocused: boolean }) => ({
      ...provided,
      minHeight: 'calc(1.5em + 0.5rem + 2px)',
      height: 'calc(1.5em + 0.5rem + 2px)',
      fontSize: '.875rem',
      borderColor: state.isFocused 
        ? (isDarkMode ? '#60a5fa' : '#86b7fe') 
        : (isDarkMode ? '#374151' : '#ced4da'),
      boxShadow: 'none',
      '&:hover': {
        borderColor: state.isFocused 
          ? (isDarkMode ? '#60a5fa' : '#86b7fe') 
          : (isDarkMode ? '#4b5563' : '#adb5bd')
      },
      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
      color: isDarkMode ? '#f5f5f5' : '#000000',
      width: '100%',
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: 'calc(1.5em + 0.5rem + 2px)',
      padding: '0.25rem 0.5rem',
      top: '50%',
      transform: 'translateY(-50%)'
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: 'auto',
      color: isDarkMode ? '#f5f5f5' : '#000000',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: isDarkMode ? '#f5f5f5' : '#000000',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: 'calc(1.5em + 0.5rem + 2px)',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: isDarkMode ? '#f5f5f5' : '#6c757d',
      '&:hover': {
        color: isDarkMode ? '#f5f5f5' : '#495057',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      width: '100%',
      minWidth: '100%',
      boxSizing: 'border-box',
      zIndex: 1001,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
      border: `1px solid ${isDarkMode ? '#374151' : '#ced4da'}`,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999
    }),
    option: (provided: any, state: { isSelected: boolean, isFocused: boolean }) => ({
      ...provided,
      fontSize: '.875rem',
      backgroundColor: state.isSelected 
        ? (isDarkMode ? '#60a5fa' : '#0d6efd')
        : state.isFocused 
          ? (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e9ecef')
          : (isDarkMode ? '#1f1f1f' : '#ffffff'),
      color: state.isSelected 
        ? '#ffffff'
        : (isDarkMode ? '#f5f5f5' : '#000000'),
      '&:active': {
        backgroundColor: !state.isSelected 
          ? (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#dee2e6')
          : undefined,
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

  // Effect to automatically switch basemap based on theme
  useEffect(() => {
    if (isDarkMode) {
      setSelectedBasemap('dark'); // Switch to dark basemap in dark mode
    } else {
      setSelectedBasemap('modern'); // Switch to modern light basemap in light mode
    }
  }, [isDarkMode]); // Dependency on theme

  return (
    <div className="home-page-container"> {/* This will be the flex container */}
      {/* Map Area */}
      <div className="map-area">
        <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
        <MapControls 
          map={mapInstanceRef.current}
          facilitiesCount={facilitiesData.length}
          filteredCount={filteredFacilities.length}
        />
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
                  <div className="legend-color" style={{ backgroundColor: getTechnologyCategoryColor(techCategory) }}></div>
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
                  
                  {/* Export Map Section */}
                  <hr />
                  <div className="export-section">
                    <h6 className="mb-2" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-color)' }}>
                      Export Map
                    </h6>
                    <button 
                      className="btn btn-primary w-100"
                      onClick={() => setShowExportModal(true)}
                      style={{
                        padding: '0.75rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <i className="fas fa-download"></i>
                      Export Map
                    </button>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted-color)', marginTop: '0.5rem', textAlign: 'center' }}>
                      Multiple formats & templates available
                    </div>
                  </div>
          </div>
        </div>
        
        {/* Export Modal */}
        <MapExportModal 
          map={mapInstanceRef.current}
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
        />
      </div>
    </div>
  );
}

export default HomePage;
