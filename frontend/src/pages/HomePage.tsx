import React, { useState, useEffect, useRef, useCallback, ChangeEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import L, { Map, TileLayer as LeafletTileLayer, Marker, DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Select, { SingleValue } from 'react-select';
import { useTheme } from '../context/ThemeContext';
import MapControls from '../components/MapControls';
import MapExportModal from '../components/MapExportModal';
import { getFacilities, Facility } from '../services';
import {
  CanonicalStatus,
  getCanonicalStatus,
  getStatusLabel,
  ALL_CANONICAL_STATUSES
} from '../utils/statusUtils';
import {
  getTechnologyCategoryColor,
  getAllTechnologyCategories,
  getTechnologyCategoryLabel
} from '../utils/technologyUtils';

interface BasemapConfig {
  url: string;
  attribution: string;
  name: string;
}

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
  osm: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Minimal',
  },
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const [sizeByCapacity, setSizeByCapacity] = useState<boolean>(false);
  const [facilitiesData, setFacilitiesData] = useState<Facility[]>([]);
  const [selectedTechnology, setSelectedTechnology] = useState<string>('all');
  const [selectedBasemap, setSelectedBasemap] = useState<string>(isDarkMode ? 'dark' : 'modern');
  const [colorByTechnology, setColorByTechnology] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState(false);

  interface OptionType {
    value: string;
    label: string;
  }

  const technologyOptions = useMemo((): OptionType[] => {
     const techSet = new Set<string>();
     facilitiesData.forEach(facility => {
       const tech = facility.technology_category;
       if (tech && typeof tech === 'string' && tech.trim() !== '') {
         techSet.add(tech.trim());
       }
     });
     const options: OptionType[] = Array.from(techSet).sort().map(tech => ({ value: tech, label: tech }));
     return [{ value: 'all', label: 'All Categories' }, ...options];
   }, [facilitiesData]);

  const currentSelectedTechnologyOption = useMemo(() => {
    return technologyOptions.find(option => option.value === selectedTechnology);
  }, [selectedTechnology, technologyOptions]);

  const basemapOptions = useMemo((): OptionType[] => {
    return Object.keys(basemaps).map(key => ({
      value: key,
      label: basemaps[key].name,
    }));
  }, []);

  const currentSelectedBasemapOption = useMemo(() => {
    return basemapOptions.find(option => option.value === selectedBasemap);
  }, [selectedBasemap, basemapOptions]);

  const calculateMarkerSize = useCallback((capacity: number | null | undefined): number => {
    const baseSize = 12;
    const maxSize = 60;
    const minSize = 8;

    const numericCapacity = capacity ?? 0;

    if (isNaN(numericCapacity) || numericCapacity <= 0) {
      return minSize;
    }

    const normalizedCapacity = Math.sqrt(numericCapacity / 1000);
    const scaledSize = baseSize + (normalizedCapacity * 2.5);

    const finalSize = Math.max(minSize, Math.min(maxSize, Math.round(scaledSize)));
    
    return finalSize;
  }, []);

  const createIconHtml = (color: string, size: number): string => {
    const innerSize = Math.round(size * 0.65);
    
    return `
    <div class="modern-map-marker" style="
      width: ${size}px;
      height: ${size}px;
      position: relative;
      cursor: pointer;
    ">
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

  const statusColors: Record<CanonicalStatus, string> = {
    operating: '#10b981',
    construction: '#f59e0b',
    planned: '#3b82f6',
    closed: '#dc2626',
    unknown: '#94a3b8'
  };

  useEffect(() => {
    const loadMapAndFacilities = async () => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          center: [40, -95],
          zoom: 4,
          zoomControl: false,
        });

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

        try {
          const facilities = await getFacilities();
          setFacilitiesData(facilities);

          Object.values(markersRef.current).forEach(marker => marker.remove());
          markersRef.current = {};

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
  }, []);

  const filteredFacilities = useMemo(() => {
    return facilitiesData.filter(facility => {
      if (selectedTechnology === 'all') {
         return true;
       }
       const facilityCategory = facility.technology_category;
       return facilityCategory === selectedTechnology;
     });
  }, [facilitiesData, selectedTechnology]);

  useEffect(() => {
    if (!mapInstanceRef.current || facilitiesData.length === 0) {
      return;
    }

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    filteredFacilities.forEach(facility => {
      const lat = facility.Latitude;
      const lng = facility.Longitude;

      if (lat !== null && lng !== null && typeof lat === 'number' && typeof lng === 'number') {
        const statusName = facility["Operational Status"];
        const canonicalStatus = getCanonicalStatus(statusName);
        
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

        let size = 16;
        if (sizeByCapacity) {
          size = calculateMarkerSize(facility.capacity_tonnes_per_year);
        }

        const icon: DivIcon = L.divIcon({
          className: 'custom-div-icon',
          html: createIconHtml(color, size),
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker([lat, lng], { icon: icon });

        const popupContent = document.createElement('div');
        popupContent.className = 'facility-popup';
        
        let popupHtml = `
          <div class="popup-content-wrapper">
            <h3 class="popup-title">${facility.Company || 'Unknown Facility'}</h3>
        `;
        
        if (facility.technology_category) {
          popupHtml += `
            <div class="popup-detail-row">
              <span class="popup-detail-label">Technology</span>
              <span class="popup-detail-value popup-tech-value">${getTechnologyCategoryLabel(facility.technology_category)}</span>
            </div>
          `;
        }
        
        const statusClass = canonicalStatus.replace(/\s+/g, '-').toLowerCase();
        popupHtml += `
          <div class="popup-detail-row">
            <span class="popup-detail-label">Status</span>
            <span class="popup-detail-value">
              <span class="popup-status status-${statusClass}">${getStatusLabel(canonicalStatus)}</span>
            </span>
          </div>
        `;
        
        if (facility.capacity_tonnes_per_year) {
          popupHtml += `
            <div class="popup-detail-row">
              <span class="popup-detail-label">Capacity</span>
              <span class="popup-detail-value popup-capacity-value">${facility.capacity_tonnes_per_year.toLocaleString()} t/yr</span>
            </div>
          `;
        }
        
        if (facility.Location) {
          popupHtml += `
            <div class="popup-detail-row">
              <span class="popup-detail-label">Location</span>
              <span class="popup-detail-value">${facility.Location}</span>
            </div>
          `;
        }
        
        popupHtml += `
            <div class="popup-divider"></div>
            <a href="#" class="popup-details-link" data-facility-id="${facility.ID}">View full details →</a>
          </div>
        `;
        
        popupContent.innerHTML = popupHtml;
        
        const link = popupContent.querySelector('.popup-details-link');
        if (link) {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(`/facilities/${facility.ID}`);
          });
        }

        marker.addTo(mapInstanceRef.current as Map)
              .bindPopup(popupContent, {
                maxWidth: 320,
                minWidth: 260,
                className: 'academic-popup'
              });

        markersRef.current[facility.ID] = marker;
      } else {
          console.warn(`Facility ${facility.ID} has invalid or incomplete coordinates: lat=${lat}, lng=${lng}`);
      }
    });

  }, [filteredFacilities, sizeByCapacity, colorByTechnology, navigate]);

  const handleSizeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setSizeByCapacity(event.target.checked);
  };

  const handleColorModeToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setColorByTechnology(event.target.checked);
  };

  const handleTechnologyChange = (selectedOption: SingleValue<OptionType>) => {
    setSelectedTechnology(selectedOption ? selectedOption.value : 'all');
  };

  const handleBasemapChange = (selectedOption: SingleValue<OptionType>) => {
    setSelectedBasemap(selectedOption ? selectedOption.value : 'osm');
  };

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

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const basemapConfig = basemaps[selectedBasemap] || basemaps.osm;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    tileLayerRef.current = L.tileLayer(basemapConfig.url, {
      attribution: basemapConfig.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

  }, [selectedBasemap]);

  useEffect(() => {
    if (isDarkMode) {
      setSelectedBasemap('dark');
    } else {
      setSelectedBasemap('modern');
    }
  }, [isDarkMode]);

  return (
    <div className="home-page-container">
      <div className="map-area">
        <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>
        <MapControls 
          map={mapInstanceRef.current}
          facilitiesCount={facilitiesData.length}
          filteredCount={filteredFacilities.length}
        />
      </div>

      <div className="map-sidebar">
        <div className="legend card shadow-sm">
          <div className="card-body p-2">
            <h6 className="mb-2 card-title">
              {colorByTechnology ? 'Technology Categories' : 'Facility Status'}
            </h6>
            {colorByTechnology ? (
              getAllTechnologyCategories().map(techCategory => (
                <div className="legend-item" key={techCategory}>
                  <div className="legend-color" style={{ backgroundColor: getTechnologyCategoryColor(techCategory) }}></div>
                  <span>{getTechnologyCategoryLabel(techCategory)}</span>
                </div>
              ))
            ) : (
              ALL_CANONICAL_STATUSES.map(statusKey => (
                <div className="legend-item" key={statusKey}>
                  <div className="legend-color" style={{ backgroundColor: statusColors[statusKey] }}></div>
                  <span>{getStatusLabel(statusKey)}</span>
                </div>
              ))
            )}
                <hr />
                
                <div className="toggle-section">
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
                  
                  {sizeByCapacity && (
                    <div className="capacity-helper">
                      <i className="fas fa-info-circle"></i>
                      Larger markers = higher capacity
                    </div>
                  )}
                </div>
                
                <hr />
                
                  <div className="technology-filter-container">
                    <label htmlFor="technologySelect" className="form-label mb-1" style={{ fontSize: '0.9em' }}>Category:</label>
                    <Select<OptionType>
                      inputId="technologySelect"
                      options={technologyOptions}
                     value={currentSelectedTechnologyOption}
                     onChange={handleTechnologyChange}
                      styles={selectStyles}
                      menuPortalTarget={document.body}
                      isSearchable={false}
                      aria-label="Select Technology Filter"
                    />
                  </div>
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