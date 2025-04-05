// charts-page.js - Logic for the Charts & Stats page

// Removed DOMContentLoaded listener

var chartsPageData = null; // Cache data for this page scope
var capacityChartInstance = null;
var technologiesChartInstance = null;
var regionsChartInstance = null;

// NEW: Initialization function called by router
window.initChartsPage = function() {
    console.log("Initializing Charts Page..."); // Debug log
    // Check if essential elements exist before proceeding
    const capacityCanvas = document.getElementById('capacityChart');
    const statsContainer = document.querySelector('.total-facilities'); // Check for one stats element

    if (!capacityCanvas || !statsContainer) {
        console.error("Required chart or stats elements not found. Aborting charts page initialization.");
        return;
    }
    loadChartsPageData();
    // Removed auth check - handled by common.js
}

async function loadChartsPageData() {
    console.log("Loading charts page data..."); // Debug log
    try {
        // Use cached data if available
        // if (chartsPageData) {
        //     console.log("Using cached charts page data.");
        //     updateStatistics(chartsPageData);
        //     initializeCharts(chartsPageData);
        //     return;
        // }

        const response = await fetch('/api/facilities');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        chartsPageData = await response.json();

        if (!chartsPageData || !chartsPageData.features) {
             console.error('Fetched data is not in the expected format:', chartsPageData);
             // Display error message?
             return;
        }

        // Initialize components
        updateStatistics(chartsPageData);
        initializeCharts(chartsPageData);

    } catch (error) {
        console.error('Error fetching facility data for charts:', error);
        // Display error messages on the page if needed
        const totalEl = document.querySelector('.total-facilities');
        if (totalEl) totalEl.textContent = 'Err';
        // Could add error messages to chart canvases
    }
}

// --- Helper Functions (Copied/adapted from original dashboard.js) ---

// Helper function to count facilities by status
function getFacilitiesByStatus(facilityCollection) {
  const counts = {
    "Operating": 0,
    "Under Construction": 0,
    "Planned": 0,
    "Pilot": 0,
    "Closed": 0 // Added Closed status if needed
  };
  if (!facilityCollection || !facilityCollection.features) return counts;

  facilityCollection.features.forEach(feature => {
    const status = feature.properties.status;
    if (counts[status] !== undefined) {
      counts[status]++;
    } else {
        // console.warn("Unknown status found:", status); // Log unknown statuses
    }
  });
  return counts;
}

// Helper function to count facilities by region
function getFacilitiesByRegion(facilityCollection) {
  const counts = {};
   if (!facilityCollection || !facilityCollection.features) return counts;

  facilityCollection.features.forEach(feature => {
    const region = feature.properties.region || "Unknown"; // Handle missing region
    if (!counts[region]) {
      counts[region] = 0;
    }
    counts[region]++;
  });
  return counts;
}

// Helper function to count facilities by technology
function getFacilitiesByTechnology(facilityCollection) {
  const counts = {};
   if (!facilityCollection || !facilityCollection.features) return counts;

  facilityCollection.features.forEach(feature => {
    const technology = feature.properties.technology || "Unknown"; // Handle missing technology
    if (!counts[technology]) {
      counts[technology] = 0;
    }
    counts[technology]++;
  });
  return counts;
}

// --- Statistics Update ---

function updateStatistics(facilityCollection) {
    console.log("Updating statistics..."); // Debug log
    const statusCounts = getFacilitiesByStatus(facilityCollection);
    const totalFacilities = facilityCollection?.features?.length ?? 0;

    // Update counters - Check if elements exist first
    const totalEl = document.querySelector('.total-facilities');
    const operatingEl = document.querySelector('.operating-facilities');
    const constructionEl = document.querySelector('.construction-facilities');
    const plannedEl = document.querySelector('.planned-facilities');

    if (totalEl) totalEl.textContent = totalFacilities;
    if (operatingEl) operatingEl.textContent = statusCounts['Operating'] || 0;
    if (constructionEl) constructionEl.textContent = statusCounts['Under Construction'] || 0;
    // Combine Planned and Pilot for the card display as before
    if (plannedEl) plannedEl.textContent = (statusCounts['Planned'] || 0) + (statusCounts['Pilot'] || 0);
}


// --- Charts Initialization ---
// Chart instances moved to global scope

function initializeCharts(facilityCollection) {
    console.log("Initializing charts..."); // Debug log
    createCapacityChart(facilityCollection);
    createTechnologiesChart(facilityCollection);
    createRegionsChart(facilityCollection);
}

// Create capacity by status chart
function createCapacityChart(facilityCollection) {
    const ctx = document.getElementById('capacityChart');
    if (!ctx) {
        console.warn("Capacity chart canvas not found.");
        return;
    }
    if (capacityChartInstance) capacityChartInstance.destroy(); // Destroy existing chart if it exists

    const capacities = {
        'Operating': 0,
        'Under Construction': 0,
        'Planned': 0,
        'Pilot': 0
    };
     if (!facilityCollection || !facilityCollection.features) {
         console.warn("No data for capacity chart.");
         // Optionally display a message on the canvas
         return;
     }

    // Helper to parse capacity (copied from dashboard.js)
    function parseCapacity(capacityStr) {
        if (!capacityStr || typeof capacityStr !== 'string') return null;
        const cleanedStr = capacityStr.replace(/,/g, '').replace(/\+/g, '');
        const match = cleanedStr.match(/(\d+)/);
        if (match) {
            const num = parseInt(match[0], 10);
            return isNaN(num) ? null : num;
        }
        return null;
    }

    facilityCollection.features.forEach(feature => {
        const props = feature.properties;
        const capacityNum = parseCapacity(props.capacity);
        const status = props.status;
        if (capacityNum !== null && capacities[status] !== undefined) {
             capacities[status] += capacityNum;
        }
    });

    console.log("Creating Capacity Chart with data:", capacities); // Debug log
    capacityChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(capacities),
            datasets: [{
                label: 'Processing Capacity (tonnes/year)',
                data: Object.values(capacities),
                backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, title: { display: true, text: 'Tonnes per Year' } } }
        }
    });
}

// Create technologies distribution chart
function createTechnologiesChart(facilityCollection) {
    const ctx = document.getElementById('technologiesChart');
    if (!ctx) {
         console.warn("Technologies chart canvas not found.");
         return;
    }
     if (technologiesChartInstance) technologiesChartInstance.destroy();

    const techCounts = getFacilitiesByTechnology(facilityCollection);
     if (Object.keys(techCounts).length === 0) {
         console.warn("No data for technologies chart.");
         return;
     }

    console.log("Creating Technologies Chart with data:", techCounts); // Debug log
    technologiesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(techCounts),
            datasets: [{
                data: Object.values(techCounts),
                backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#FF5722', '#607D8B', '#795548', '#E91E63'] // Added more colors
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// Create regions distribution chart
function createRegionsChart(facilityCollection) {
    const ctx = document.getElementById('regionsChart');
    if (!ctx) {
        console.warn("Regions chart canvas not found.");
        return;
    }
     if (regionsChartInstance) regionsChartInstance.destroy();

    const regionCounts = getFacilitiesByRegion(facilityCollection);
     if (Object.keys(regionCounts).length === 0) {
         console.warn("No data for regions chart.");
         return;
     }

    console.log("Creating Regions Chart with data:", regionCounts); // Debug log
    regionsChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(regionCounts),
            datasets: [{
                data: Object.values(regionCounts),
                 backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#9C27B0', '#FF5722', '#607D8B', '#795548', '#E91E63'] // Added more colors
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

// --- REMOVED Auth Check/Logout Functions ---