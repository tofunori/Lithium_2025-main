// facilities-page.js - Logic for the Facilities List page

// Removed DOMContentLoaded listener

var facilitiesPageData = null; // Store fetched data globally for this page scope

// NEW: Initialization function called by router
window.initFacilitiesPage = function() {
    console.log("Initializing Facilities Page..."); // Debug log
    const listElement = document.getElementById('facilitiesList');
    if (!listElement) {
        console.error("Facilities list element (#facilitiesList) not found. Aborting initialization.");
        return;
    }
    // Reset data cache in case it was loaded previously with different filters/state
    // facilitiesPageData = null; // Optional: uncomment to force reload every time
    loadFacilitiesPageData(); // Load data and initialize

    // Check login status and show/hide Add Facility button specific to this page
    const addFacilityBtn = document.getElementById('addFacilityBtnPage');
    if (addFacilityBtn && localStorage.getItem('authToken')) {
        addFacilityBtn.classList.remove('d-none');
    } else if (addFacilityBtn) {
        addFacilityBtn.classList.add('d-none'); // Ensure it's hidden if not logged in
    }
}

async function loadFacilitiesPageData() {
    console.log("Loading facilities page data..."); // Debug log
    // Removed auth check - handled by common.js

    try {
        // Use cached data if available (optional optimization)
        // if (facilitiesPageData) {
        //     console.log("Using cached facilities page data.");
        //     populateFacilitiesList(facilitiesPageData);
        //     setupListEventListeners();
        //     return;
        // }

        const response = await fetch('/api/facilities');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        facilitiesPageData = await response.json();

        if (!facilitiesPageData || !facilitiesPageData.features) {
             console.error('Fetched data is not in the expected format:', facilitiesPageData);
             const listElement = document.getElementById('facilitiesList');
             if(listElement) listElement.innerHTML = '<p class="text-danger text-center">Facility data format error.</p>';
             return;
        }

        // Initialize components
        populateFacilitiesList(facilitiesPageData); // Pass only data
        setupListEventListeners(); // Setup listeners for this page

    } catch (error) {
        console.error('Error fetching facility data for list:', error);
        // Display error messages on the page if needed
         const listElement = document.getElementById('facilitiesList');
         if (listElement) {
             listElement.innerHTML = '<p class="text-danger text-center">Failed to load facilities list.</p>';
         }
    }
}

// --- Helper Functions (Copied/adapted from original dashboard.js) ---

// Helper function to get a facility by ID
function getFacilityById(id, facilityCollection) {
  if (!facilityCollection || !facilityCollection.features) return null;
  return facilityCollection.features.find(feature => feature.properties.id === id);
}

// Get CSS class for facility status
function getStatusClass(status) {
    if (!status) return '';
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

// --- Facilities List ---

function populateFacilitiesList(facilityCollection) { // Removed isLoggedIn parameter
    const facilitiesList = document.getElementById('facilitiesList');

    if (!facilitiesList) {
        console.error('Facilities list element not found');
        return;
    }
     if (!facilityCollection || !facilityCollection.features || facilityCollection.features.length === 0) {
         facilitiesList.innerHTML = '<p class="text-muted text-center">No facilities found.</p>';
         return;
     }

    // Determine login status by checking if logout link exists (added by common.js)
    const isLoggedIn = !!document.getElementById('logoutLink');
    console.log("populateFacilitiesList determined isLoggedIn:", isLoggedIn); // Debug log

    // Clear existing content
    facilitiesList.innerHTML = '';

    // Create list items for each facility
    facilityCollection.features.forEach(feature => {
        const props = feature.properties;
        const statusClass = getStatusClass(props.status);

        const facilityItem = document.createElement('div');
        // Add data-id attribute for easier selection
        facilityItem.setAttribute('data-id', props.id);
        facilityItem.className = `facility-item`; // Removed ID from class for simplicity
        // Extract number from capacity string (e.g., "10,000 tonnes..." -> "10,000")
        const capacityValue = props.capacity ? props.capacity.split(' ')[0] : 'N/A';

        facilityItem.innerHTML = `
            <div class="facility-item-content"> <!-- Wrapper for flex layout -->
                <span class="col-company"><a href="facilities/${props.id}.html" class="facility-link">${props.company || 'N/A'}</a></span>
                <span class="col-location">${props.address || 'N/A'}</span>
                <span class="col-volume">${capacityValue}</span>
                <span class="col-method">${props.technology || 'N/A'}</span>
                <span class="col-status"><span class="status-badge ${statusClass}">${props.status || 'N/A'}</span></span>
                <span class="col-actions">
                    ${isLoggedIn ? `<a href="edit-facility.html?id=${props.id}" class="btn btn-sm btn-outline-secondary ms-1 edit-link" title="Edit Facility"><i class="fas fa-edit"></i></a>` : ''}
                </span>
            </div>
        `;

        facilitiesList.appendChild(facilityItem);
    });

    // Re-attach SPA navigation listeners if needed (will be handled by common.js/router)
    // setupSPALinks(); // Example placeholder
}

// --- Event Listeners and Filtering/Searching ---

function setupListEventListeners() {
    console.log("Setting up facilities list event listeners..."); // Debug log
    // Filter tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        // Prevent adding listener multiple times
        if (button.hasAttribute('data-listener-added')) return;

        button.addEventListener('click', function() {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const filter = this.getAttribute('data-filter');
            filterFacilities(filter, facilitiesPageData); // Pass data
        });
        button.setAttribute('data-listener-added', 'true'); // Mark as added
    });

    // Search input
    const searchInput = document.getElementById('facilitySearch');
    if (searchInput) {
        // Prevent adding listener multiple times
        if (!searchInput.hasAttribute('data-listener-added')) {
            searchInput.addEventListener('input', function() {
                searchFacilities(this.value, facilitiesPageData); // Pass data
            });
            searchInput.setAttribute('data-listener-added', 'true'); // Mark as added
        }
    } else {
        console.warn("Facility search input not found when setting up listeners.");
    }
}

// Filter facilities by status
function filterFacilities(filter, facilityCollection) {
    const facilityItems = document.querySelectorAll('#facilitiesList .facility-item'); // Target items within the list
     if (!facilityCollection || !facilityCollection.features) return; // Check if data exists

    let visibleCount = 0;
    facilityItems.forEach(item => {
        const facilityId = item.getAttribute('data-id'); // Get ID from data attribute
        const facility = getFacilityById(facilityId, facilityCollection); // Use helper with data

        if (!facility) return;

        const status = facility.properties.status.toLowerCase();
        let shouldShow = false;

        if (filter === 'all' ||
            (filter === 'operating' && status === 'operating') ||
            (filter === 'construction' && status === 'under construction') ||
            // Combine Planned and Pilot for the 'Planned' tab
            (filter === 'planned' && (status === 'planned' || status === 'pilot'))) {
            shouldShow = true;
        }

        item.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });

    // Optional: Show message if no facilities match filter
    const listElement = document.getElementById('facilitiesList');
    let noMatchMsg = listElement.querySelector('.no-match-message');
    if (visibleCount === 0) {
        if (!noMatchMsg) {
            noMatchMsg = document.createElement('p');
            noMatchMsg.className = 'text-muted text-center no-match-message';
            noMatchMsg.textContent = 'No facilities match the current filter.';
            listElement.appendChild(noMatchMsg);
        }
    } else {
        if (noMatchMsg) {
            noMatchMsg.remove();
        }
    }
}

// Search facilities by name, company, or location
function searchFacilities(query, facilityCollection) {
    const facilityItems = document.querySelectorAll('#facilitiesList .facility-item'); // Target items within the list
    const searchQuery = query.toLowerCase().trim();
     if (!facilityCollection || !facilityCollection.features) return; // Check if data exists

    let visibleCount = 0;
    facilityItems.forEach(item => {
        const facilityId = item.getAttribute('data-id'); // Get ID from data attribute
        const facility = getFacilityById(facilityId, facilityCollection); // Use helper with data

        if (!facility) return;

        const props = facility.properties;
        const searchText = `${props.name || ''} ${props.company || ''} ${props.address || ''}`.toLowerCase();
        const shouldShow = searchText.includes(searchQuery);

        item.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });

     // Optional: Show message if no facilities match search
    const listElement = document.getElementById('facilitiesList');
    let noMatchMsg = listElement.querySelector('.no-match-message'); // Reuse filter message element
    if (visibleCount === 0 && searchQuery !== '') { // Only show if searching and no results
        if (!noMatchMsg) {
            noMatchMsg = document.createElement('p');
            noMatchMsg.className = 'text-muted text-center no-match-message';
            listElement.appendChild(noMatchMsg);
        }
        noMatchMsg.textContent = 'No facilities match your search.';
    } else {
        if (noMatchMsg) {
            noMatchMsg.remove();
        }
    }
}


// --- REMOVED Auth Check/Logout Functions (Handled by common.js) ---
// REMOVED checkAuthStatus
// REMOVED updateHeaderAuthStatus
// REMOVED handleLogout