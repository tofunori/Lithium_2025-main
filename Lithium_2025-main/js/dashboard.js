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
    console.log("Initializing map..."); // Debug log
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error("Map container (#map) not found during map initialization.");
        return;
    }

    // --- Check if Map Instance Exists and is Valid ---
    let isNewInstance = false;
    if (mapInstance && document.body.contains(mapInstance.getContainer())) {
        console.log("Reusing existing map instance.");
        // Clear old data layer if it exists
        if (currentGeoJsonLayer && mapInstance.hasLayer(currentGeoJsonLayer)) {
            mapInstance.removeLayer(currentGeoJsonLayer);
            console.log("Removed old GeoJSON layer.");
        }
        currentGeoJsonLayer = null;
    } else {
        console.log("Creating new map instance.");
        isNewInstance = true;
        // If instance exists but container is detached, try removing it first
        if (mapInstance) {
            try { mapInstance.remove(); } catch(e) { console.warn("Error removing detached map instance:", e); }
        }
        mapInstance = null; // Ensure it's null before creating

        // DEBUG: Log map container size before initialization
        const mapStyle = window.getComputedStyle(mapContainer);
        console.log(`Map container computed size before L.map: ${mapStyle.width} x ${mapStyle.height}`);

        mapInstance = L.map('map').setView([39.8283, -98.5795], 4);

    // Add OpenStreetMap as base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(mapInstance);

    // Add alternate basemaps
    const basemaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }),
        "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        }),
        "Terrain": L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
            attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        })
    };
    // Default to Satellite view
    basemaps["Satellite"].addTo(mapInstance);
    L.control.layers(basemaps).addTo(mapInstance);

    // Setup base layers, controls, and event listeners ONLY when creating a new instance
    if (isNewInstance) {
        // Add OpenStreetMap as base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(mapInstance);

        // Add alternate basemaps
        const basemaps = {
            "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }),
            "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            }),
            "Terrain": L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
                attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            })
        };
        // Default to Satellite view
        basemaps["Satellite"].addTo(mapInstance);
        L.control.layers(basemaps).addTo(mapInstance);

        // Setup event listeners ONLY when the map is first created
        setupEventListeners();
    }
    }
    // Function to get marker color based on status
    function getMarkerColor(status) {
        switch(status.toLowerCase()) {
            case 'operating':
                return '#4CAF50'; // Green
            case 'under construction':
                return '#FFC107'; // Amber
            case 'planned':
                return '#2196F3'; // Blue
            case 'pilot':
                return '#9C27B0'; // Purple
            default:
                return '#757575'; // Grey
        }
    }

    // --- Add GeoJSON Data Layer (Always happens) ---
    // Ensure previous layer is removed if reusing instance (handled above)
    if (currentGeoJsonLayer) {
         console.warn("currentGeoJsonLayer was not null before creating new layer.");
         currentGeoJsonLayer = null; // Ensure it's reset
    }

    const sizeToggle = document.getElementById('sizeByCapacityToggle');
    const sizeByCapacity = sizeToggle ? sizeToggle.checked : false; // Check if toggle exists before accessing checked property

    console.log("Adding GeoJSON layer. Size by capacity:", sizeByCapacity); // Debug log

    currentGeoJsonLayer = L.geoJSON(facilityCollection, {
        pointToLayer: function(feature, latlng) {
            const props = feature.properties;
            const status = props.status;
            const color = getMarkerColor(status);
            let radius = 8; // Default fixed radius

            if (sizeByCapacity) {
                const capacityNum = parseCapacity(props.capacity);
                radius = calculateRadius(capacityNum);
            }

            return L.circleMarker(latlng, {
                radius: radius, // Use dynamic or fixed radius
                fillColor: color,
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: function(feature, layer) {
            // Create popup content
            const props = feature.properties;
            const popupContent = `
                <div class="info-box">
                    <h3>${props.name}</h3>
                    <p class="info-company">Company: ${props.company}</p>
                    <p>Location: ${props.address}</p>
                    <p>Status: <strong>${props.status}</strong></p>
                    <p class="info-capacity">Capacity: ${props.capacity}</p>
                    <p>Technology: ${props.technology}</p>
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
        if (mapInstance) { // Check if map still exists (might have been removed by rapid navigation)
             mapInstance.invalidateSize();
             console.log("Map size invalidated (delayed).");
             // Also reset the view to potentially trigger tile loading
             mapInstance.setView(mapInstance.getCenter(), mapInstance.getZoom());
             console.log("Map view reset (delayed).");
        } else {
             console.log("Map instance no longer exists, skipping delayed invalidateSize.");
        }
    }, 10); // Delay by 10 milliseconds
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
