// js/common.js - Handles header loading, theme, auth, and SPA routing

// --- Page Initializers Mapping ---
const pageInitializerNames = {
    'index.html': 'initDashboardPage',
    '': 'initDashboardPage', // Handle root path
    'facilities.html': 'initFacilitiesPage',
    'charts.html': 'initChartsPage',
    'documents.html': 'initDocumentsPage',
    'about.html': null, // No specific JS needed for about page yet
    // Add mappings for edit/new if they have initializers
    'edit-facility.html': null, // Assuming edit-facility.js handles its own init via DOMContentLoaded
    'new-facility.html': null,  // Assuming new-facility.js handles its own init via DOMContentLoaded
};

// --- Helper: Load Script Dynamically ---
// Stores promises for scripts currently being loaded to avoid duplicate fetches
const loadingScripts = {};

function loadScript(src, id = null) {
    // If already loading, return the existing promise
    if (loadingScripts[src]) {
        console.log(`Script already loading or loaded (promise exists): ${src}`);
        return loadingScripts[src];
    }

    // Check if script tag exists and library is ready (more robust check)
    const existingScript = document.querySelector(`script[src="${src}"]`);
    let libraryReady = false;
    if (existingScript) {
        if (src.includes('leaflet.js') && typeof window.L !== 'undefined') libraryReady = true;
        if (src.includes('leaflet.markercluster.js') && typeof window.L?.markerClusterGroup !== 'undefined') libraryReady = true;
        if (src.includes('chart.js') && typeof window.Chart !== 'undefined') libraryReady = true;
        // Assume page-specific scripts don't need library check here
        if (id === 'page-specific-script') libraryReady = true; // Assume if tag exists, it's okay

        if (libraryReady) {
            console.log(`Script tag exists and library ready: ${src}`);
            // Store a resolved promise so future calls don't try to reload
            loadingScripts[src] = Promise.resolve();
            return loadingScripts[src];
        } else {
            console.warn(`Script tag exists but library not ready: ${src}. Removing and re-loading.`);
            existingScript.remove(); // Remove potentially broken script tag
        }
    }

    // Create and append the new script tag, store the promise
    loadingScripts[src] = new Promise((resolve, reject) => {
        console.log(`Creating script tag for: ${src}`);
        const script = document.createElement('script');
        script.src = src;
        if (id) {
            script.id = id;
        }
        script.onload = () => {
            console.log(`Script loaded successfully: ${src}`);
            resolve(); // Resolve the promise on successful load
        };
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            try { document.body.removeChild(script); } catch (e) {} // Clean up failed script tag
            delete loadingScripts[src]; // Remove promise on failure
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.body.appendChild(script);
    });

    return loadingScripts[src];
}


// --- Helper: Handle Page Initialization (Dependencies + Page Script) ---
async function handlePageInitialization(pagePath, initializerName, pageScriptSrc) {
    console.log(`Handling initialization for page: ${pagePath}, initializer: ${initializerName}, script: ${pageScriptSrc}`);
    const mainContentElement = document.getElementById('main-content'); // Needed for error display

    try {
        // --- Dependency Loading ---
        let dependencyPromise = Promise.resolve();
        const isMapPage = pagePath === 'index.html' || pagePath === '';
        const isChartsPage = initializerName === 'initChartsPage'; // Or check pagePath === 'charts.html'

        if (isMapPage) {
            console.log("Map page detected, checking Leaflet dependencies...");
            dependencyPromise = dependencyPromise
                .then(() => loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')) // Load Leaflet
                .then(() => loadScript('https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js')); // Then load MarkerCluster
        } else if (isChartsPage) {
            console.log("Charts page detected, checking Chart.js dependency...");
            dependencyPromise = dependencyPromise
                .then(() => loadScript('https://cdn.jsdelivr.net/npm/chart.js')); // Load Chart.js
        }

        // Wait for dependencies to load
        await dependencyPromise;
        console.log("Dependencies loaded (or already present).");

        // --- Page Script Loading ---
        // Remove old page script first
        const oldScript = document.getElementById('page-specific-script');
        if (oldScript) {
            console.log("Removing old page script before loading new one.");
            oldScript.remove();
        }

        if (pageScriptSrc) {
            const absoluteScriptSrc = pageScriptSrc.startsWith('/') ? pageScriptSrc : `/${pageScriptSrc}`;
            console.log(`Loading page script: ${absoluteScriptSrc}`);
            await loadScript(absoluteScriptSrc, 'page-specific-script'); // Wait for page script
            console.log("Page script loaded.");
        } else {
            console.log("No page-specific script to load.");
        }

        // --- Execute Initializer ---
        if (initializerName && typeof window[initializerName] === 'function') {
            console.log(`Running initializer: ${initializerName}`);
            window[initializerName](); // Run the initializer function
        } else {
            console.log(`Initializer ${initializerName || 'none specified'} not found or not a function.`);
        }

        console.log(`Page initialization complete for: ${pagePath}`);

    } catch (error) {
        console.error("Error during page initialization sequence:", error);
        if (mainContentElement) {
            mainContentElement.innerHTML = `<p class="text-danger text-center">Failed to load required page resources: ${error.message}. Please try refreshing.</p>`;
        }
    }
}


// --- Initial Load Logic ---
document.addEventListener('DOMContentLoaded', function() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    const loadFooter = () => {
        // ... (loadFooter implementation remains the same)
        if (footerPlaceholder) {
            return fetch('/includes/_footer.html')
                .then(response => response.ok ? response.text() : Promise.reject(`HTTP error loading footer! status: ${response.status}`))
                .then(html => {
                    footerPlaceholder.innerHTML = html;
                    const yearSpan = footerPlaceholder.querySelector('#copyright-year');
                    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
                    console.log("Footer loaded and year set.");
                })
                .catch(error => {
                     console.error('Error loading footer:', error);
                     if (footerPlaceholder) footerPlaceholder.innerHTML = '<p class="text-danger text-center">Error loading site footer.</p>';
                });
        } else {
            console.warn("Footer placeholder element not found on this page.");
            return Promise.resolve();
        }
    };

    if (headerPlaceholder) {
        fetch('/includes/_header.html')
            .then(response => response.ok ? response.text() : Promise.reject(`HTTP error loading header! status: ${response.status}`))
            .then(html => {
                headerPlaceholder.innerHTML = html;
                setActiveNavLink();
                initializeThemeSwitcher();
                return loadFooter().then(() => checkAuthStatus()); // Load footer, then check auth
            })
            .then(() => {
                // --- Initial Page Initialization ---
                const fullPath = window.location.pathname;
                // Normalize path: remove leading/trailing slashes, default to index.html
                let normalizedPath = fullPath.replace(/^\/+|\/+$/g, '');
                const initialPageName = normalizedPath === '' ? 'index.html' : normalizedPath.split('/').pop();

                let initializerName = null;
                let pageScriptSrc = null; // Need to find the script src for the initial page

                // Find the script tag associated with the current page in the initially loaded document
                const initialPageScriptTag = document.querySelector(`script[data-page-script="true"]`);
                 if (initialPageScriptTag) {
                     // Basic check if script src seems related to page name
                     const scriptName = initialPageScriptTag.src.split('/').pop();
                     // Check if script name matches page name OR if it's the specific index.html -> dashboard.js case
                     if (scriptName.includes(initialPageName.replace('.html','')) || (initialPageName === 'index.html' && scriptName === 'dashboard.js')) {
                        pageScriptSrc = initialPageScriptTag.getAttribute('src');
                        console.log(`Associated initial page script found: ${pageScriptSrc}`);
                     } else {
                         console.warn(`Initial page script tag found (${scriptName}), but doesn't seem to match page name (${initialPageName}). Script source will be ignored for initial load.`);
                         // Do not set pageScriptSrc if it doesn't match, rely on initializer name lookup only
                         pageScriptSrc = null;
                         pageScriptSrc = initialPageScriptTag.getAttribute('src');
                     }
                 }

                if (fullPath.includes('/facilities/')) {
                     // Facility detail pages might have their own initializer defined in their script
                     initializerName = 'initFacilityDetailPage';
                     console.log(`Initial load is facility detail page, using initializer: ${initializerName}`);
                     // Assume the script is loaded via the fetched content for detail pages
                     pageScriptSrc = null; // Don't try to load a script from index.html for detail pages
                } else {
                    initializerName = pageInitializerNames[initialPageName];
                }

                 // Set Initial Subtitle (can happen before script init)
                 const pageSubtitleElement = document.getElementById('page-subtitle-main');
                 const headerSubtitleElement = document.getElementById('page-subtitle');
                 if (pageSubtitleElement && headerSubtitleElement) {
                     headerSubtitleElement.textContent = pageSubtitleElement.textContent;
                 }

                // Call the centralized initialization handler
                // Use initialPageName for dependency checks, initializerName for the function call, pageScriptSrc for the script to load
                handlePageInitialization(initialPageName, initializerName, pageScriptSrc);
                // --- End Initial Page Initialization ---

                // Initialize Router AFTER initial page setup starts
                initializeRouter();

            })
            .catch(error => {
                console.error('Error during initial setup chain:', error);
                if (headerPlaceholder && !headerPlaceholder.innerHTML) {
                     headerPlaceholder.innerHTML = '<p class="text-danger">Error loading site header.</p>';
                }
            });
    } else {
        console.error('Header placeholder element not found.');
    }
});


// --- SPA Routing Logic ---

function initializeRouter() {
    console.log("Initializing SPA Router...");
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error("Cannot initialize router: Header placeholder not found.");
        return;
    }

    // Event delegation for navigation links
    headerPlaceholder.addEventListener('click', (event) => {
        const link = event.target.closest('a.nav-link');
        if (link) {
            const url = link.getAttribute('href');
            // Check if this link should bypass the router (for full page reload)
            if (link.hasAttribute('data-bypass-router')) {
                console.log(`Bypassing router for: ${url} - allowing full page reload`);
                return; // Don't prevent default, allow normal navigation
            }
            
            // Basic check for internal links (relative or starting with /)
            if (url && !url.startsWith('#') && !url.startsWith('javascript:') && !url.match(/^https?:\/\//)) {
                if (link.id === 'logoutLink') return; // Let logout handler manage navigation
                event.preventDefault();
                console.log(`Navigating to: ${url}`);
                loadPageContent(url);
            }
        }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
        console.log("Popstate event triggered:", event.state);
        const url = event.state?.path || window.location.pathname; // Use state path or current location
        // Avoid reloading same page on initial load popstate
        if (url === window.location.pathname && !event.state && history.length <= 2) { // Check history length too
             console.log("Popstate ignored for initial state or same URL.");
             return;
        }
        loadPageContent(url, false); // Don't push state again
    });
     console.log("Router initialized.");
}

async function loadPageContent(url, pushState = true) {
    console.log(`Loading content for: ${url}, pushState: ${pushState}`);
    const mainContentElement = document.getElementById('main-content');
    if (!mainContentElement) {
        console.error("Main content element (#main-content) not found!");
        return;
    }

    mainContentElement.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
        // Ensure the fetch URL is absolute from the root
        const absoluteUrl = new URL(url, window.location.origin).pathname;
        console.log(`Fetching absolute URL: ${absoluteUrl}`);
        const response = await fetch(absoluteUrl);
        if (!response.ok) {
            throw new Error(response.status === 404 ? `Page not found (404) for ${absoluteUrl}` : `HTTP error! status: ${response.status} for ${absoluteUrl}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newMainContent = doc.getElementById('main-content');
        const newTitle = doc.querySelector('title')?.textContent || 'Lithium Dashboard';
        const pageScriptTag = doc.querySelector('script[data-page-script="true"]');
        const pageScriptSrc = pageScriptTag ? pageScriptTag.getAttribute('src') : null;
        // Determine pagePath based on the *requested* URL for mapping lookups
        let requestedPath = url.replace(/^\/+|\/+$/g, ''); // Normalize requested URL
        const pagePath = requestedPath === '' ? 'index.html' : requestedPath.split('/').pop();
        let initializerName = pageInitializerNames[pagePath];

        // Handle facility detail pages specifically
        if (url.includes('/facilities/')) {
            initializerName = 'initFacilityDetailPage';
            // Detail pages load their script within their own HTML, so pageScriptSrc should be null here
            // pageScriptSrc = null; // Ensure we don't try to load a script from common.js context
        }


        if (newMainContent) {
            // --- Update Core DOM ---
            mainContentElement.innerHTML = newMainContent.innerHTML;
            document.title = newTitle;
            if (pushState && window.location.pathname !== absoluteUrl) {
                history.pushState({ path: absoluteUrl }, newTitle, absoluteUrl);
                console.log("Pushed state:", absoluteUrl);
            }
            setActiveNavLink();
            const newPageSubtitleElement = doc.getElementById('page-subtitle-main'); // Use ID from fetched content
            const headerSubtitleElement = document.getElementById('page-subtitle'); // Use ID from header
            if (headerSubtitleElement) {
                headerSubtitleElement.textContent = newPageSubtitleElement ? newPageSubtitleElement.textContent : '';
            }
            // --- End Update Core DOM ---

            // --- Call Centralized Initialization Handler ---
            // Use pagePath for dependency checks, initializerName for function call, pageScriptSrc found in fetched HTML
            handlePageInitialization(pagePath, initializerName, pageScriptSrc);
            // --- End Initialization Call ---

            window.scrollTo(0, 0);

        } else {
            throw new Error(`Could not find #main-content in fetched HTML for ${url}`);
        }

    } catch (error) {
        console.error('Error loading page content:', error);
        mainContentElement.innerHTML = `<p class="text-danger text-center">Failed to load page: ${error.message}. Please try again.</p>`;
    }
}


// --- Existing Functions (setActiveNavLink, Theme, Auth, Logout - unchanged) ---

function setActiveNavLink() {
    // ... (implementation remains the same)
    const currentPath = window.location.pathname;
    const normalizedPath = currentPath === '/' ? 'index.html' : currentPath.substring(currentPath.lastIndexOf('/') + 1);
    // console.log(`Setting active nav link for path: ${normalizedPath}`); // Less verbose logging
    const navLinks = document.querySelectorAll('#header-placeholder .navbar-nav .nav-link');
    if (!navLinks || navLinks.length === 0) {
        // console.warn("No nav links found to set active state.");
        return;
    }
    navLinks.forEach(link => {
        const linkUrl = new URL(link.href, window.location.origin);
        const linkPath = linkUrl.pathname === '/' ? 'index.html' : linkUrl.pathname.substring(linkUrl.pathname.lastIndexOf('/') + 1);
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        if (normalizedPath === linkPath) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

function initializeThemeSwitcher() {
    // ... (implementation remains the same)
    const themeSwitch = document.getElementById('themeSwitch');
    const themeIcon = document.querySelector('label[for="themeSwitch"] i');
    if (!themeSwitch || !themeIcon) {
        console.warn("Theme switch elements not found.");
        return;
    }
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-theme') {
            themeSwitch.checked = true;
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
             themeIcon.classList.remove('fa-sun');
             themeIcon.classList.add('fa-moon');
        }
    } else {
         themeIcon.classList.add('fa-moon'); // Default to moon if no theme set
    }
    if (!themeSwitch.hasAttribute('data-listener-added')) {
        themeSwitch.addEventListener('change', function(e) {
            if (e.target.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark-theme');
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light-theme');
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        });
        themeSwitch.setAttribute('data-listener-added', 'true');
    }
}

function checkAuthStatus() {
    // ... (implementation remains the same)
    const authStatusElement = document.getElementById('authStatus');
    if (!authStatusElement) {
         console.warn("Auth status element not found.");
         return;
    }
    const token = localStorage.getItem('authToken');
    if (token) {
        const username = 'Admin'; // Placeholder
        authStatusElement.innerHTML = `
            <span>Welcome, ${username}!</span>
            <a href="#" id="logoutLink" class="btn btn-sm btn-outline-danger ms-2">Logout</a>
        `;
        const logoutLink = document.getElementById('logoutLink');
         if (logoutLink) {
             if (!logoutLink.hasAttribute('data-listener-added')) {
                logoutLink.addEventListener('click', handleLogout);
                logoutLink.setAttribute('data-listener-added', 'true');
             }
         }
         // console.log("User is logged in (JWT token found)."); // Less verbose
    } else {
        authStatusElement.innerHTML = `
            <a href="login.html" class="btn btn-sm btn-outline-success">Admin Login</a>
        `;
        // console.log("User is logged out (No JWT token found)."); // Less verbose
    }
}

function handleLogout(event) {
    // ... (implementation remains the same)
    event.preventDefault();
    console.log("Logout clicked");
    localStorage.removeItem('authToken');
    console.log("Auth token removed from localStorage.");
    const authStatusElement = document.getElementById('authStatus');
    if (authStatusElement) {
        authStatusElement.innerHTML = `<a href="login.html" class="btn btn-sm btn-outline-success">Admin Login</a>`;
    }
    loadPageContent('index.html'); // Reload index page content using SPA logic
}