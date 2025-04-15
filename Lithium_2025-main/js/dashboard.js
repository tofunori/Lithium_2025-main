// Dashboard JavaScript - Map Page Logic

// Removed DOMContentLoaded listener

// --- Data Loading ---

var allFacilityData = null; // Store fetched data globally within this script's scope
var mapInstance = null; // Store map instance globally for reuse/check
var currentGeoJsonLayer = null; // Store the GeoJSON layer to easily remove/re-add

// NEW: Initialization function to be called by the router
window.initDashboardPage = function() {
    console.log("Initializing Dashboard Page..."); // Debug log
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("Map container element (#map) not found. Aborting dashboard initialization.");
        return;
    }
    // Check if data needs to be loaded or if map just needs update
    // For simplicity now, always reload data and re-initialize map display
    // A more advanced version could cache data or check if mapInstance exists and just update layers
    loadDashboardData(); // Start by loading data
}


async function loadDashboardData() {
    console.log("Loading dashboard data..."); // Debug log
    try {
        // Prevent fetching if data already exists (simple cache)
        // if (allFacilityData) {
        //     console.log("Using cached facility data.");
        //     initializeDashboard();
        //     return;
        // }
        const response = await fetch('/api/facilities');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allFacilityData = await response.json(); // Store the fetched data

        if (!allFacilityData || !allFacilityData.features) {
             console.error('Fetched data is not in the expected format:', allFacilityData);
             // Display error message to user?
             const mapElement = document.getElementById('map');
             if (mapElement) {
                mapElement.innerHTML = '<p class="text-danger text-center">Facility data is not in the expected format.</p>';
             }
             return;
        }

        // Once data is loaded, initialize the dashboard components
        initializeDashboard();

    } catch (error) {
        console.error('Error fetching facility data:', error);
        // Display an error message on the page
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = '<p class="text-danger text-center">Failed to load facility data. Please try again later.</p>';
        }
         // Removed list/chart error handling as they are on different pages
    }
}

// --- Initialization ---

function initializeDashboard() {
    console.log("Initializing dashboard components..."); // Debug log
    if (!allFacilityData) {
        console.error("Facility data not loaded, cannot initialize dashboard.");
        return;
    }
    // Initialize the map
    initializeMap(allFacilityData);

    // Event listeners are now set up inside initializeMap only when map is first created
    // setupEventListeners(); // MOVED
}


// --- Helper Functions (Only those needed for Map) ---

// Get CSS class for facility status (needed for marker color)
function getStatusClass(status) {
    switch(status.toLowerCase()) {
        case 'operating':
            return 'status-operating';
        case 'under construction':
            return 'status-construction';
        case 'planned':
            return 'status-planned';
        case 'pilot':
            return 'status-pilot';
        default:
            return '';
    }
}

// --- Capacity Parsing and Radius Calculation (Needed for Map Markers) ---
function parseCapacity(capacityStr) {
    if (!capacityStr || typeof capacityStr !== 'string') return null;
    // Remove commas, '+' signs, and non-numeric characters except the first number part
    const cleanedStr = capacityStr.replace(/,/g, '').replace(/\+/g, '');
    const match = cleanedStr.match(/(\d+)/); // Find the first sequence of digits
    if (match) {
        const num = parseInt(match[0], 10);
        return isNaN(num) ? null : num;
    }
    return null;
}

function calculateRadius(capacityNum) {
    const minRadius = 6;
    const maxRadius = 20;
    const scaleFactor = 0.0002; // Adjust this to control sensitivity

    if (capacityNum === null || capacityNum <= 0) {
        return minRadius; // Default size for unknown/zero capacity
    }
    // Simple linear scale, capped at maxRadius
    let radius = minRadius + capacityNum * scaleFactor;
    return Math.min(radius, maxRadius);
}


// --- Map Initialization (Adapted) ---
// mapInstance and currentGeoJsonLayer moved to global scope

function initializeMap(facilityCollection) {
    console.log("Initializing map with data:", facilityCollection); // Debug log
    // Create map if it doesn't already exist
    if (!mapInstance) {
        // Create a Leaflet map instance in "map-container" element
        mapInstance = L.map('map-container', {
            minZoom: 2,
            zoomControl: false // We'll add it in a custom position
        });
        // Add custom positioned zoom controls
        L.control.zoom({
            position: 'topright'
        }).addTo(mapInstance);
    }

    if (currentGeoJsonLayer) {
        mapInstance.removeLayer(currentGeoJsonLayer); // Remove old data
    }

    if (!facilityCollection || !facilityCollection.features || facilityCollection.features.length === 0) {
        console.warn("No valid facility data to display on map.");
        // Set a default center view if data is missing or empty
        mapInstance.setView([39.8283, -98.5795], 4); // Center on US
        mapInstance.setMaxBounds([[-90, -180], [90, 180]]); // World bounds
        return;
    }

    // Configure the tile layer (Only create once)
    if (!mapInstance.hasLayer(L.tileLayer)) {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(mapInstance);
    }

    // Calculate map bounds from all facility locations
    const bounds = L.latLngBounds();
    facilityCollection.features.forEach(feature => {
        if (feature.geometry && feature.geometry.type === 'Point') {
            bounds.extend([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
        }
    });

    // Fit map to these bounds with padding
    if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 7 // Don't zoom in too much when there's just one marker
        });
    } else {
        // Fallback center if no valid bounds
        mapInstance.setView([39.8283, -98.5795], 4); // Center on US
    }

    // Add GeoJSON layer with facilities
    currentGeoJsonLayer = L.geoJSON(facilityCollection, {
        pointToLayer: function(feature, latlng) {
            const props = feature.properties;
            const statusClass = getStatusClass(props.status);
            // Determine marker color based on status
            let markerColor;
            switch(statusClass) {
                case 'status-operating':
                    markerColor = '#4CAF50'; // Green
                    break;
                case 'status-construction':
                    markerColor = '#FFC107'; // Yellow/Amber
                    break;
                case 'status-planned':
                    markerColor = '#2196F3'; // Blue
                    break;
                case 'status-pilot':
                    markerColor = '#9C27B0'; // Purple
                    break;
                default:
                    markerColor = '#9E9E9E'; // Grey as fallback
            }

            // Create custom icon
            const customIcon = L.divIcon({
                className: 'custom-map-marker ' + statusClass,
                html: `<div style="background-color: ${markerColor};"></div>`,
                iconSize: [15, 15],
                iconAnchor: [7, 7]
            });

            return L.marker(latlng, {
                icon: customIcon,
                title: props.name
            });
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties;
            
            // Use the technology_category field if it exists, otherwise fall back to the original technology name
            const technologyDisplay = props.technology_category || props.technology || 'N/A';
            
            // Create popup content
            const popupContent = `
                <div class="facility-popup">
                    <h4>${props.name || 'Unnamed Facility'}</h4>
                    <p><strong>Company:</strong> ${props.company || 'N/A'}</p>
                    <p>Location: ${props.address}</p>
                    <p>Status: <strong>${props.status}</strong></p>
                    <p class="info-capacity">Capacity: ${props.capacity}</p>
                    <p>Technology: ${technologyDisplay}</p>
                    <p>${props.description}</p>
                    <a href="facilities/${props.id}.html" class="btn btn-sm btn-primary mt-2" style="color: #ffffff !important;">View Details</a>
                    <a href="${props.website}" target="_blank" class="btn btn-sm btn-outline-secondary mt-2">Visit Website</a>
                </div>
            `;

            layer.bindPopup(popupContent);

            // REMOVED click listener call to highlight facility in list
        }
    }).addTo(mapInstance);
    console.log("GeoJSON layer added."); // Debug log
    // Force map to re-evaluate its size after potential DOM changes, with a slight delay
    setTimeout(() => {
        mapInstance.invalidateSize();
        console.log("Map size invalidated."); // Debug log
    }, 100);
}


// --- Event Listeners (Only Map-Related) ---

function setupEventListeners() {
    console.log("Setting up event listeners..."); // Debug log
    // Size by Capacity Toggle Listener
    // Need to ensure this element exists *after* content is loaded.
    const sizeToggle = document.getElementById('sizeByCapacityToggle');
    if (sizeToggle) {
        // Check if listener already exists to avoid duplicates (simple check using data attribute)
        if (!sizeToggle.hasAttribute('data-listener-added')) {
             console.log("Adding size toggle listener."); // Debug log
             sizeToggle.addEventListener('change', function() {
                console.log("Size toggle changed."); // Debug log
                // Redraw map markers with the new setting
                if (allFacilityData) { // Ensure data is available
                   // Re-initialize map will re-add the layer with correct radii
                   initializeMap(allFacilityData);
                }
             });
             sizeToggle.setAttribute('data-listener-added', 'true');
        } else {
             console.log("Size toggle listener already exists."); // Debug log
        }
    } else {
        // This might happen if the listener setup runs before the #main-content is fully populated
        console.warn("Size toggle element (#sizeByCapacityToggle) not found when setting up listeners.");
    }

    // REMOVED Filter tabs listener
    // REMOVED Search input listener
}

// REMOVED populateFacilitiesList function
// REMOVED highlightFacilityInList function
// REMOVED filterFacilities function
// REMOVED searchFacilities function
// REMOVED initializeCharts function
// REMOVED createCapacityChart function
// REMOVED createTechnologiesChart function
// REMOVED createRegionsChart function
// REMOVED updateStatistics function
