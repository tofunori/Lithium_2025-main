// Utility functions for generating facility page HTML dynamically

// Helper to get Bootstrap class based on facility status
function getStatusClass(status) {
    if (!status) return '';
    switch(status.toLowerCase()) {
        case 'operating': return 'status-operating';
        case 'under construction': return 'status-construction';
        case 'planned': return 'status-planned';
        case 'pilot': return 'status-pilot';
        case 'closed': return 'status-closed'; // Added closed status
        default: return '';
    }
}

// Helper to generate HTML for the timeline section
function generateTimelineHTML(timeline) {
    if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
        return `<p>No timeline data available.</p>`;
    }
    let html = '';
    let isLeft = true;
    timeline.forEach(item => {
        html += `
            <div class="timeline-container ${isLeft ? 'left' : 'right'}">
                <div class="timeline-content">
                    <h5>${item.year || 'N/A'}</h5>
                    <p>${item.event || 'Event details missing.'}</p>
                </div>
            </div>`;
        isLeft = !isLeft;
    });
    return html;
}

// Helper to generate HTML for the related facilities section
// Takes an array of related facility properties objects
function generateRelatedFacilitiesHTML(relatedFacilities) {
    if (!relatedFacilities || !Array.isArray(relatedFacilities) || relatedFacilities.length === 0) {
        return '<li class="list-group-item">No other related facilities found for this company.</li>';
    }
    let html = '';
    relatedFacilities.forEach(facilityProps => {
        // Link to the dynamic route
        html += `<li class="list-group-item"><a href="/facilities/${facilityProps.id}.html">${facilityProps.name || 'Unnamed Facility'}</a></li>`;
    });
    return html;
}


// Main function to generate the full HTML page for a facility
// Takes the facility's properties object and an array of related facilities' properties
function generateFacilityPageHTML(props, relatedFacilitiesData = []) {
    // Get status class for badge
    const statusClass = getStatusClass(props.status);

    // Define default values for potentially missing props to avoid 'undefined'
    const defaultString = 'N/A';
    const defaultArray = [];
    const name = props.name || defaultString;
    const address = props.address || defaultString;
    const status = props.status || defaultString;
    // Adjust image paths to be relative from the root, as served by the dynamic route
    const facilityImage = props.facilityImage ? `/${props.facilityImage}` : null; // Use null if missing
    const description = props.description || 'No description available.';
    const capacity = props.capacity || 'Not specified';
    const technology = props.technology || 'Not specified';
    const yearStarted = props.yearStarted;
    const yearPlanned = props.yearPlanned;
    const feedstock = props.feedstock || 'Not specified';
    const products = props.products || 'Not specified';
    const size = props.size || 'Not specified';
    const fundingSource = props.fundingSource || 'Not specified';
    const technologyDetails = props.technologyDetails || `Details about ${technology} processing technology.`;
    const timeline = props.timeline || defaultArray;
    const region = props.region || defaultString;
    const country = props.country || defaultString;
    const company = props.company || defaultString;
    // Adjust logo path
    const companyLogo = props.companyLogo ? `/${props.companyLogo}` : null; // Use null if missing
    const companyDescription = props.companyDescription || `Details about ${company}.`;
    const website = props.website;
    const regionalSignificance = props.regionalSignificance || 'Regional significance details not available.';

    // Generate HTML for timeline using helper
    const timelineHTML = generateTimelineHTML(timeline);
    // Generate HTML for related facilities using helper and passed data
    const relatedFacilitiesHTML = generateRelatedFacilitiesHTML(relatedFacilitiesData);

    // Determine year display logic
    let yearDisplay = 'Not specified';
    let yearKey = 'yearPlanned'; // Default key
    if (yearStarted) {
        yearDisplay = `Operational Since: ${yearStarted}`;
        yearKey = 'yearStarted';
    } else if (yearPlanned) {
        yearDisplay = `Planned Start: ${yearPlanned}`;
        yearKey = 'yearPlanned';
    }
    const yearValue = yearDisplay.split(':')[1]?.trim() || 'N/A';

    // Create HTML template
    // IMPORTANT: Adjust all relative paths (CSS, JS, images) to be absolute from the root (/)
    // because the page is served from /facilities/:id.html route
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} Details - Lithium Battery Recycling</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="/css/styles.css"> {/* Path from root */}
    <style>
        .content-section { display: none; }
        .content-section.active { display: block; }
        #saveButton { display: none; }
         .editable { border: 1px dashed #0d6efd; padding: 2px 5px; cursor: text; background-color: #e9f5ff; }
         /* Conditionally set header image */
         ${facilityImage ? `.facility-header { background-image: url('${facilityImage}'); }` : ''}
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div id="header-placeholder"></div>
        <p id="page-subtitle-main" style="display: none;">Facility Details</p>

        <main id="main-content" data-facility-id="${props.id}">
            <div id="facilityHeader" class="facility-header"> {/* Style applied via CSS */}
                <div class="facility-header-content">
                    <h1 id="facilityName">${name}</h1>
                    <p id="facilityAddress" class="lead">${address}</p>
                    <span id="facilityStatus" class="status-badge ${statusClass}">${status}</span>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-3">
                    <div id="sticky-nav-placeholder">
                         <div class="card shadow-sm">
                             <div class="card-body p-2">
                                 <ul id="page-navigation" class="nav flex-column">
                                     <li class="nav-item"><a class="nav-link active" href="#" data-target="#content-overview">Overview</a></li>
                                     <li class="nav-item"><a class="nav-link" href="#" data-target="#content-technical">Technical Details</a></li>
                                     <li class="nav-item"><a class="nav-link" href="#" data-target="#content-timeline">Timeline</a></li>
                                     <li class="nav-item"><a class="nav-link" href="#" data-target="#content-location">Location</a></li>
                                     <li class="nav-item"><a class="nav-link" href="#" data-target="#content-company">Company Info</a></li>
                                     <li class="nav-item"><a class="nav-link" href="#" data-target="#content-significance">Regional Significance</a></li>
                                     <li class="nav-item"><a class="nav-link" href="#" data-target="#content-related">Related Facilities</a></li>
                                 </ul>
                             </div>
                         </div>
                    </div>
                    <div class="mt-3">
                        <button id="editButton" class="btn btn-secondary btn-sm w-100 mb-2" style="display: none;"><i class="fas fa-edit"></i> Edit</button>
                        <button id="saveButton" class="btn btn-success btn-sm w-100" style="display: none;"><i class="fas fa-save"></i> Save Changes</button>
                    </div>
                </div>

                <div class="col-md-9">
                    <div id="content-overview" class="content-section active">
                        <section class="facility-detail-section">
                            <h3 class="section-title">Facility Overview</h3>
                            <div id="facilityDescription" class="editable-section">${description}</div>
                        </section>
                    </div>

                    <div id="content-technical" class="content-section">
                        <section id="section-specs" class="facility-detail-section">
                            <h4 class="section-title">Technical Specifications</h4>
                            <ul id="techSpecsList" class="list-unstyled editable-section">
                                 <li><strong>Processing Capacity:</strong> <span data-key="capacity">${capacity}</span></li>
                                 <li><strong>Technology:</strong> <span data-key="technology">${technology}</span></li>
                                 ${yearDisplay !== 'Not specified' ? `<li><strong>${yearDisplay.split(':')[0]}:</strong> <span data-key="${yearKey}">${yearValue}</span></li>` : '<li><strong>Operational Since:</strong> <span data-key="yearStarted">Not specified</span></li>'}
                                 <li><strong>Feedstock:</strong> <span data-key="feedstock">${feedstock}</span></li>
                                 <li><strong>Output:</strong> <span data-key="products">${products}</span></li>
                                 <li><strong>Facility Size:</strong> <span data-key="size">${size}</span></li>
                                 <li><strong>Funding Source:</strong> <span data-key="fundingSource">${fundingSource}</span></li>
                            </ul>
                        </section>
                        <section id="section-impact" class="facility-detail-section">
                             <h4 class="section-title">Environmental Impact</h4>
                             <ul class="list-unstyled">
                                  <li><strong>GHG Reduction:</strong> 80-90% lower carbon emissions than primary mining</li>
                                  <li><strong>Water Management:</strong> Closed-loop water recycling systems</li>
                                  <li><strong>Waste Diversion:</strong> Near-zero waste to landfill operations</li>
                                  <li><strong>Resource Recovery:</strong> >95% recovery rate for critical materials</li>
                                  <li><strong>Energy Use:</strong> Powered by renewable energy sources</li>
                             </ul>
                        </section>
                        <section id="section-technology" class="facility-detail-section">
                            <h4 class="section-title">Processing Technology</h4>
                            <div id="technologyDescription" class="editable-section">${technologyDetails}</div>
                        </section>
                    </div>

                    <div id="content-timeline" class="content-section">
                        <section class="facility-detail-section">
                            <h4 class="section-title">Development Timeline</h4>
                            <div id="facilityTimeline" class="timeline editable-section">
                                ${timelineHTML}
                            </div>
                        </section>
                    </div>

                    <div id="content-location" class="content-section">
                        <section class="facility-detail-section">
                            <h4 class="section-title">Location</h4>
                            <div id="facilityMap" style="height: 300px;">Loading map...</div>
                            <p class="mt-2">
                                <i class="fas fa-map-marker-alt"></i> <span id="facilityAddressMap">${address}</span><br>
                                <i class="fas fa-globe-americas"></i> <span id="facilityRegion">${region}</span>, <span id="facilityCountry">${country}</span>
                            </p>
                        </section>
                    </div>

                    <div id="content-company" class="content-section">
                        <section class="facility-detail-section">
                            <h4 class="section-title">Company Information</h4>
                            <p><strong>Company:</strong> <span id="facilityCompany">${company}</span></p>
                            ${companyLogo ? `
                            <div class="text-center mb-3">
                                <img id="companyLogo" src="${companyLogo}" alt="${company} Logo" class="img-fluid" style="max-height: 80px;">
                            </div>
                            ` : ''}
                            <p id="companyDescription">${companyDescription}</p>
                            ${website ? `<a id="companyWebsite" href="${website}" target="_blank" class="btn btn-outline-primary btn-sm mt-2"><i class="fas fa-external-link-alt"></i> Company Website</a>` : ''}
                        </section>
                    </div>

                    <div id="content-significance" class="content-section">
                        <section class="facility-detail-section">
                             <h4 class="section-title">Regional Significance</h4>
                             <p>${regionalSignificance}</p>
                        </section>
                    </div>

                    <div id="content-related" class="content-section">
                        <section class="facility-detail-section">
                            <h4 class="section-title">Related Facilities</h4>
                            <ul class="list-group list-group-flush">
                                 ${relatedFacilitiesHTML}
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </main>

    </div>

    
    <div id="footer-placeholder"></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="/js/facility-detail.js" data-page-script="true"></script>
    <script src="/js/common.js"></script>
</body>
</html>`;
}

// Export the main generation function
module.exports = {
    generateFacilityPageHTML
};