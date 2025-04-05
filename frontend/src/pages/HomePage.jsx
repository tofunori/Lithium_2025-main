import React, { useEffect, useRef } from 'react';
import L from 'leaflet'; // Import Leaflet
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import './HomePage.css'; // Import component-specific CSS

function HomePage() {
  const mapContainerRef = useRef(null); // Ref for the map container div
  const mapInstanceRef = useRef(null); // Ref to store the map instance

  useEffect(() => {
    // Initialize map only if the container exists and map hasn't been initialized yet
    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Create map instance
      mapInstanceRef.current = L.map(mapContainerRef.current, { // Use the ref here
        center: [40, -95], // Centered roughly on the US
        zoom: 4, // Initial zoom level
      });

      // Add Tile Layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      // --- Placeholder for adding markers/data ---
      // In a real app, you would fetch data here and add markers/clusters
      // Example: L.marker([51.5, -0.09]).addTo(mapInstanceRef.current).bindPopup('A sample marker.');
      // --- End Placeholder ---
    }

    // Cleanup function: Remove map when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="row" style={{ margin: 0, width: '100%' }}>
      <div className="col-12" style={{ padding: '0 15px' }}>
        <div className="map-container">
          {/* The map div - assign the ref here */}
          <div id="map" ref={mapContainerRef} style={{ height: '100%', width: '100%' }}></div>

          {/* Legend remains the same */}
          <div className="legend">
            <h6 className="mb-2">Facility Status</h6>
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
              <input className="form-check-input" type="checkbox" role="switch" id="sizeByCapacityToggle" />
              <label className="form-check-label" htmlFor="sizeByCapacityToggle" style={{ fontSize: '0.9em' }}>Size by Capacity</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;