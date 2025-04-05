// js/facility-detail.js - Logic for individual facility detail pages

// Attach the initializer to the window object
window.initFacilityDetailPage = async function() {
    console.log("Initializing Facility Detail Page...");

    // --- Get Facility ID from DOM ---
    const mainContent = document.getElementById('main-content');
    const facilityId = mainContent ? mainContent.dataset.facilityId : null;

    if (!facilityId) {
        console.error("Facility ID not found in data-facility-id attribute on #main-content.");
        // Display error on the page
        if (mainContent) {
             mainContent.innerHTML = `<div class="alert alert-danger">Error: Could not determine facility ID for this page.</div>`;
        }
        return;
    }
    console.log(`Facility ID found: ${facilityId}`);
    // --- End Get Facility ID ---

    let currentFacilityData = null; // Store fetched data for this instance
    let facilityMap = null; // Store map instance for this instance

    // --- Helper Functions ---
    function getStatusClass(status) {
        if (!status) return '';
        switch(status.toLowerCase()) {
            case 'operating': return 'status-operating';
            case 'under construction': return 'status-construction';
            case 'planned': return 'status-planned';
            case 'pilot': return 'status-pilot';
            default: return '';
        }
    }

    // Function to populate page elements with fetched data
    function populatePage(facility) {
        const props = facility.properties;
        const geometry = facility.geometry;

        document.title = `${props.name || 'Facility'} Details - Lithium Battery Recycling`;

        // Query elements *within* the current mainContent scope
        const facilityNameEl = mainContent.querySelector('#facilityName');
        const facilityAddressEl = mainContent.querySelector('#facilityAddress');
        const statusBadge = mainContent.querySelector('#facilityStatus');
        const headerDiv = mainContent.querySelector('#facilityHeader');
        const facilityDescriptionEl = mainContent.querySelector('#facilityDescription');
        const techSpecsList = mainContent.querySelector('#techSpecsList');
        const timelineContainer = mainContent.querySelector('#facilityTimeline');
        const companyLogo = mainContent.querySelector('#companyLogo');
        const companyDescriptionEl = mainContent.querySelector('#companyDescription');
        const companyWebsiteLink = mainContent.querySelector('#companyWebsite');
        const facilityMapContainer = mainContent.querySelector('#facilityMap');
        const facilityAddressMapEl = mainContent.querySelector('#facilityAddressMap');
        const technologyDescriptionEl = mainContent.querySelector('#technologyDescription');
        const facilityCompanyEl = mainContent.querySelector('#facilityCompany'); // Added
        const facilityRegionEl = mainContent.querySelector('#facilityRegion'); // Added
        const facilityCountryEl = mainContent.querySelector('#facilityCountry'); // Added

        // Header
        if(facilityNameEl) facilityNameEl.textContent = props.name || 'N/A';
        if(facilityAddressEl) facilityAddressEl.textContent = props.address || 'N/A';
        if(statusBadge) {
            statusBadge.textContent = props.status || 'N/A';
            statusBadge.className = `status-badge ${getStatusClass(props.status)}`;
        }
        if(headerDiv) {
            if (props.facilityImage && props.facilityImage !== 'images/facilities/default.jpg') {
                 // Use absolute path from root
                 headerDiv.style.backgroundImage = `url('/${props.facilityImage}')`;
             } else {
                  headerDiv.style.backgroundImage = 'none';
                  headerDiv.style.backgroundColor = '#f0f0f0';
             }
        }

        // Overview
        if(facilityDescriptionEl) facilityDescriptionEl.innerHTML = props.description || 'Not available';

        // Tech Specs
        if(techSpecsList) {
            const sizeEl = techSpecsList.querySelector('[data-key="size"]');
            const capacityEl = techSpecsList.querySelector('[data-key="capacity"]');
            const techEl = techSpecsList.querySelector('[data-key="technology"]');
            const startedEl = techSpecsList.querySelector('[data-key="yearStarted"]');
            const feedstockEl = techSpecsList.querySelector('[data-key="feedstock"]');
            const productsEl = techSpecsList.querySelector('[data-key="products"]');
            const fundingSourceEl = techSpecsList.querySelector('[data-key="fundingSource"]'); // Added

            if(sizeEl) sizeEl.textContent = props.size || 'Not specified';
            if(capacityEl) capacityEl.textContent = props.capacity || 'Not specified';
            if(techEl) techEl.textContent = props.technology || 'Not specified';
            if(startedEl) startedEl.textContent = props.yearStarted || props.yearPlanned || 'Not specified';
            if(feedstockEl) feedstockEl.textContent = props.feedstock || 'Not specified';
            if(productsEl) productsEl.textContent = props.products || 'Not specified';
            if(fundingSourceEl) fundingSourceEl.textContent = props.fundingSource || 'Not specified'; // Added
        }

        // Timeline
        if(timelineContainer) {
            if (props.timeline && props.timeline.length > 0) {
                timelineContainer.innerHTML = '';
                props.timeline.forEach((item, index) => {
                    const side = index % 2 === 0 ? 'left' : 'right';
                    const timelineItem = document.createElement('div');
                    timelineItem.className = `timeline-container ${side}`;
                    timelineItem.innerHTML = `<div class="timeline-content"><h5>${item.year}</h5><p>${item.event}</p></div>`;
                    timelineContainer.appendChild(timelineItem);
                });
            } else {
                timelineContainer.innerHTML = '<p>No timeline data available.</p>';
            }
        }

         // Company Info
         if(facilityCompanyEl) facilityCompanyEl.textContent = props.company || 'N/A'; // Added
         if(companyLogo) {
             if (props.companyLogo && props.companyLogo !== 'images/logos/default.png') {
                 companyLogo.src = `../${props.companyLogo}`;
                 companyLogo.alt = `${props.company || 'Company'} Logo`;
                 companyLogo.style.display = ''; // Show image
             } else {
                 companyLogo.style.display = 'none';
             }
         }
         if(companyDescriptionEl) companyDescriptionEl.textContent = props.companyDescription || `Details about ${props.company || 'the company'}.`;
         if(companyWebsiteLink) {
             if (props.website) {
                 companyWebsiteLink.href = props.website;
                 companyWebsiteLink.style.display = '';
             } else {
                 companyWebsiteLink.style.display = 'none';
             }
         }

        // Location Map
        // Use the actual properties fetched, default to empty string if missing
        if(facilityAddressMapEl) facilityAddressMapEl.textContent = props.address || '';
        if(facilityRegionEl) facilityRegionEl.textContent = props.region || '';
        if(facilityCountryEl) facilityCountryEl.textContent = props.country || ''; // Default to empty if not USA/provided
        if (facilityMapContainer) {
            // Ensure Leaflet is loaded (it should be included in the HTML)
             if (typeof L === 'undefined') {
                 console.error("Leaflet (L) is not loaded!");
                 facilityMapContainer.innerHTML = '<p class="text-danger">Error: Mapping library not loaded.</p>';
                 return;
             }

            if (geometry && geometry.type === 'Point' && geometry.coordinates) {
                const coords = [geometry.coordinates[1], geometry.coordinates[0]];
                 if (facilityMap) {
                     console.log("Removing previous facility map instance.");
                     facilityMap.remove(); // Remove old map if exists from previous load
                 }
                 console.log("Creating new facility map instance.");
                facilityMap = L.map(facilityMapContainer).setView(coords, 13); // Pass container element
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                }).addTo(facilityMap);
                L.marker(coords).addTo(facilityMap)
                    .bindPopup(props.name || 'Facility Location')
                    .openPopup();
            } else {
                 facilityMapContainer.innerHTML = '<p>Location data not available.</p>';
            }
        }

         // Processing Technology Description
         if(technologyDescriptionEl) technologyDescriptionEl.innerHTML = props.technologyDetails || `Details about ${props.technology || 'the processing technology'}.`;
    }

    // --- Content Swapping Navigation Setup ---
    function setupContentSwappingNav() {
        const navLinks = mainContent.querySelectorAll('#page-navigation .nav-link[data-target]');
        const contentSections = mainContent.querySelectorAll('.content-section');

        if (!navLinks.length || !contentSections.length) {
            console.warn("Navigation links or content sections not found for content swapping.");
            return;
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target'); // Should be like "#content-overview"
                const targetSection = mainContent.querySelector(targetId);

                if (!targetSection) {
                    console.error(`Target content section ${targetId} not found.`);
                    return;
                }

                // Remove active class from all links and sections
                navLinks.forEach(l => l.classList.remove('active'));
                contentSections.forEach(s => s.classList.remove('active'));

                // Add active class to the clicked link and target section
                link.classList.add('active');
                targetSection.classList.add('active');

                // Special handling for map: invalidate size if it's the target
                if (targetId === '#content-location' && facilityMap) {
                    console.log("Invalidating map size...");
                    // Delay slightly to ensure the container is fully visible
                    setTimeout(() => {
                        facilityMap.invalidateSize();
                        // Optional: Pan back to marker if needed
                        // if (currentFacilityData?.geometry?.coordinates) {
                        //     facilityMap.panTo([currentFacilityData.geometry.coordinates[1], currentFacilityData.geometry.coordinates[0]]);
                        // }
                    }, 100); // 100ms delay, adjust if needed
                }
            });
        });

        // Ensure the default active link corresponds to the default active section
        const defaultActiveSection = mainContent.querySelector('.content-section.active');
        if (defaultActiveSection) {
            const defaultTargetId = `#${defaultActiveSection.id}`;
            const defaultActiveLink = mainContent.querySelector(`#page-navigation .nav-link[data-target="${defaultTargetId}"]`);
            navLinks.forEach(l => l.classList.remove('active')); // Clear any static active classes
            if (defaultActiveLink) {
                defaultActiveLink.classList.add('active');
            } else {
                // Fallback: activate the first link if default section's link not found
                if (navLinks.length > 0) navLinks[0].classList.add('active');
            }
        } else {
             // Fallback: activate the first link and section if none are active by default
             if (navLinks.length > 0) navLinks[0].classList.add('active');
             if (contentSections.length > 0) contentSections[0].classList.add('active');
        }
    }

    // --- Edit Mode Functions ---
    function enableEditMode() {
        console.log("Enabling edit mode...");
        const editButton = mainContent.querySelector('#editButton');
        const saveButton = mainContent.querySelector('#saveButton');
        if(editButton) editButton.style.display = 'none';
        if(saveButton) saveButton.style.display = 'inline-block';

        mainContent.querySelectorAll('.editable-section').forEach(el => {
             if (el.tagName === 'DIV' && (el.id === 'facilityDescription' || el.id === 'technologyDescription')) {
                 el.contentEditable = true;
                 el.classList.add('editable');
             }
             else if (el.tagName === 'UL' && el.id === 'techSpecsList') {
                 el.querySelectorAll('span[data-key]').forEach(span => {
                     span.contentEditable = true;
                     span.classList.add('editable');
                 });
             }
             else if (el.id === 'facilityTimeline') {
                  el.contentEditable = true;
                  el.classList.add('editable');
             }
        });
    }

    function disableEditMode() {
        console.log("Disabling edit mode...");
         const editButton = mainContent.querySelector('#editButton');
        const saveButton = mainContent.querySelector('#saveButton');
        if(saveButton) saveButton.style.display = 'none';
        if(editButton) editButton.style.display = 'inline-block';

         mainContent.querySelectorAll('.editable-section').forEach(el => {
             if (el.tagName === 'DIV') {
                 el.contentEditable = false;
                 el.classList.remove('editable');
             } else if (el.tagName === 'UL') {
                  el.querySelectorAll('span[data-key]').forEach(span => {
                     span.contentEditable = false;
                     span.classList.remove('editable');
                 });
             }
        });
         const timelineEl = mainContent.querySelector('#facilityTimeline');
         if(timelineEl) {
            timelineEl.contentEditable = false;
            timelineEl.classList.remove('editable');
         }
    }

    // --- Save Changes Function ---
    async function saveChanges() {
        console.log("Saving changes...");
        if (!currentFacilityData) {
            alert("Error: Facility data not loaded.");
            return;
        }

        const updatedProps = { ...currentFacilityData.properties };
        const techSpecsList = mainContent.querySelector('#techSpecsList');
        const facilityDescriptionEl = mainContent.querySelector('#facilityDescription');
        const technologyDescriptionEl = mainContent.querySelector('#technologyDescription');

        if(facilityDescriptionEl) updatedProps.description = facilityDescriptionEl.innerHTML;
        if(technologyDescriptionEl) updatedProps.technologyDetails = technologyDescriptionEl.innerHTML;

        if(techSpecsList) {
            techSpecsList.querySelectorAll('span[data-key]').forEach(span => {
                const key = span.getAttribute('data-key');
                if (key) updatedProps[key] = span.textContent;
            });
        }
        // Skipping timeline save for simplicity

        try {
            const response = await fetch(`/api/facilities/${facilityId}`, { // Use facilityId from scope
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Add Auth header
                 },
                body: JSON.stringify(updatedProps),
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try { const errorData = await response.json(); errorMsg += ` - ${errorData.message}`; } catch (e) {}
                throw new Error(errorMsg);
            }

            const savedData = await response.json();
            console.log('Save successful:', savedData);
            currentFacilityData.properties = savedData; // Update local cache

            populatePage(currentFacilityData); // Re-populate with saved data
            disableEditMode();
            alert('Changes saved successfully!');

        } catch (error) {
            console.error('Error saving facility data:', error);
            alert(`Error saving changes: ${error.message}`);
        }
    }

    // --- Add Listeners for Edit/Save ---
    function setupEditSaveListeners(isLoggedIn) {
         const editButton = mainContent.querySelector('#editButton');
         const saveButton = mainContent.querySelector('#saveButton');

         if (isLoggedIn && editButton && saveButton) {
             console.log("Setting up Edit/Save listeners");
             editButton.style.display = 'inline-block';
             // Remove previous listeners before adding new ones
             const newEditButton = editButton.cloneNode(true);
             editButton.parentNode.replaceChild(newEditButton, editButton);
             const newSaveButton = saveButton.cloneNode(true);
             saveButton.parentNode.replaceChild(newSaveButton, saveButton);

             // Re-query after cloning and add listeners
             mainContent.querySelector('#editButton').addEventListener('click', enableEditMode);
             mainContent.querySelector('#saveButton').addEventListener('click', saveChanges);
             mainContent.querySelector('#saveButton').style.display = 'none'; // Ensure save is hidden initially
         } else if (editButton) {
             editButton.style.display = 'none';
             if(saveButton) saveButton.style.display = 'none';
         }
    }

    // --- Main Execution Logic for initFacilityDetailPage ---
    try {
        // Check session status first (needed for edit button)
        // Determine login status based on localStorage token
        const authToken = localStorage.getItem('authToken');
        const isLoggedIn = !!authToken; // Simple check: if token exists, assume logged in for button display
        console.log(`Facility detail page determined isLoggedIn: ${isLoggedIn}`);

        // Fetch facility data
        const response = await fetch(`/api/facilities/${facilityId}`); // Use absolute path
         if (!response.ok) {
             throw new Error(response.status === 404 ? `Facility with ID ${facilityId} not found.` : `HTTP error! status: ${response.status}`);
         }
        currentFacilityData = await response.json();
        populatePage(currentFacilityData);
        setupContentSwappingNav(); // Setup nav for content swapping

        // Setup Edit/Save buttons based on login status
        setupEditSaveListeners(isLoggedIn);

    } catch (error) {
        console.error('Error fetching facility details:', error);
        if(mainContent) {
            mainContent.innerHTML =
                `<div class="alert alert-danger">Error loading facility details: ${error.message}</div>
                 <a href="../index.html" class="btn btn-outline-primary mt-3"><i class="fas fa-arrow-left"></i> Back to Dashboard</a>`;
        }
    }
};