import React, { useState, useCallback } from 'react';
import { Map } from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import './MapControls.css';

interface MapControlsProps {
  map: Map | null;
  facilitiesCount?: number;
  filteredCount?: number;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  map, 
  facilitiesCount = 0,
  filteredCount = 0
}) => {
  const { isDarkMode } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Reset map to default view
  const handleResetView = useCallback(() => {
    if (map) {
      map.setView([40, -95], 4); // Default center on US
    }
  }, [map]);

  // Toggle fullscreen
  const handleFullscreen = useCallback(() => {
    const mapContainer = map?.getContainer();
    if (!mapContainer) return;

    if (!isFullscreen) {
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
      } else if ((mapContainer as any).webkitRequestFullscreen) {
        (mapContainer as any).webkitRequestFullscreen();
      } else if ((mapContainer as any).msRequestFullscreen) {
        (mapContainer as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [map, isFullscreen]);

  // Zoom to user location
  const handleLocateUser = useCallback(() => {
    if (!map) return;

    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos: [number, number] = [latitude, longitude];
          map.setView(userPos, 10);
          
          // Add a temporary marker for user location
          import('leaflet').then(L => {
            const userMarker = L.marker(userPos, {
              icon: L.divIcon({
                className: 'user-location-marker',
                html: '<div class="user-location-pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })
            }).addTo(map);

            // Remove marker after 5 seconds
            setTimeout(() => {
              map.removeLayer(userMarker);
            }, 5000);
          });
          
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please check your browser permissions.');
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
      setIsLocating(false);
    }
  }, [map]);

  // Export map as image
  const handleExportMap = useCallback(() => {
    setShowExportModal(true);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (map) {
      map.zoomIn();
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      map.zoomOut();
    }
  }, [map]);

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!map) return null;

  return (
    <div className="map-controls">
      {/* Zoom Controls */}
      <div className="map-control-group zoom-controls">
        <button 
          className="map-control-button"
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <i className="fas fa-plus"></i>
        </button>
        <button 
          className="map-control-button"
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <i className="fas fa-minus"></i>
        </button>
      </div>

      {/* Location Controls */}
      <div className="map-control-group location-controls">
        <button 
          className="map-control-button"
          onClick={handleResetView}
          title="Reset View"
          aria-label="Reset View"
        >
          <i className="fas fa-home"></i>
        </button>
        <button 
          className={`map-control-button ${isLocating ? 'locating' : ''}`}
          onClick={handleLocateUser}
          disabled={isLocating}
          title="Go to My Location"
          aria-label="Go to My Location"
        >
          <i className={`fas fa-crosshairs ${isLocating ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      {/* View Controls */}
      <div className="map-control-group view-controls">
        <button 
          className="map-control-button"
          onClick={handleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
        </button>
      </div>

      {/* Facility Counter */}
      {(facilitiesCount > 0 || filteredCount > 0) && (
        <div className="map-facility-counter">
          <div className="facility-count">
            <i className="fas fa-map-marker-alt me-1"></i>
            {filteredCount < facilitiesCount ? (
              <>
                <strong>{filteredCount}</strong> of <strong>{facilitiesCount}</strong> facilities
              </>
            ) : (
              <>
                <strong>{facilitiesCount}</strong> facilities
              </>
            )}
          </div>
        </div>
      )}

      {/* Coordinates Display */}
      <div className="map-coordinates">
        <span className="coordinates-label">
          <i className="fas fa-location-dot me-1"></i>
          <span id="map-coordinates">40.0000°N, 95.0000°W</span>
        </span>
      </div>
    </div>
  );
};

export default MapControls;