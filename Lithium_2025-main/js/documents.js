// js/documents.js - Logic for the File Explorer Documents page

// --- State Variables ---
var currentFolderId = null; // ID of the folder currently being viewed ('root' or doc_item ID)
// Removed: currentSelectedFacilityId, currentFacilityName, currentFilesystemData, isAllFacilitiesMode, allFacilitiesData
var backHistory = []; // Array to store folder IDs for back navigation
var forwardHistory = []; // Array to store folder IDs for forward navigation
var currentFilterType = 'all'; // 'all', 'folder', 'file', 'link'
// Date filter state removed
var originalFolderItems = []; // Stores the full list from the API for the current folder
 var sortBy = 'name'; // Default sort column ('name', 'modifiedAt', 'size', 'type')
 var sortDirection = 'asc'; // 'asc' or 'desc'
 var isNavigating = false; // Flag to prevent double navigation calls


// --- DOM Element References ---
// Will be assigned in initDocumentsPage
// Removed: facilitySelect
var documentManagementSection = null;
var selectedFacilityNameElement = null; // May repurpose or remove later
var breadcrumbNav = null;
var breadcrumbList = null;
var fileExplorerView = null;
var loadingMessage = null;
var emptyFolderMessage = null;
var newFolderButton = null;
var uploadFileButton = null;
var addLinkButton = null;
var errorMessageDiv = null;
var successMessageDiv = null;
var folderTreeViewContainer = null;
var folderTreeView = null;
var filterTypeSelect = null;
// Date filter input references removed

// --- Initialization ---
// Called by router when the documents page is loaded
window.initDocumentsPage = async function() { // Make the main function async
    console.log("Initializing File Explorer Documents Page (New Structure)...");

    // Check authentication status immediately
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log("[Auth] No token found. Redirecting to login.");
        window.location.href = '/login.html';
        return; // Stop initialization
    }

    // --- Query DOM Elements ---
    // Removed: facilitySelect
    documentManagementSection = document.getElementById('documentManagementSection');
    selectedFacilityNameElement = document.getElementById('selectedFacilityName'); // May remove later
    breadcrumbNav = document.getElementById('breadcrumbNav');
    breadcrumbList = document.getElementById('breadcrumbList');
    fileExplorerView = document.getElementById('fileExplorerView');
    loadingMessage = document.getElementById('loadingMessage');
    emptyFolderMessage = document.getElementById('emptyFolderMessage');
    newFolderButton = document.getElementById('newFolderButton');
    uploadFileButton = document.getElementById('uploadFileButton');
    addLinkButton = document.getElementById('addLinkButton');
    errorMessageDiv = document.getElementById('errorMessage');
    successMessageDiv = document.getElementById('successMessage');
    folderTreeViewContainer = document.getElementById('folderTreeViewContainer');
    folderTreeView = document.getElementById('folderTreeView');
    filterTypeSelect = document.getElementById('filterTypeSelect');
    // Date filter input references removed
    // --- End Query DOM Elements ---
var folderNavBackButton = null;
var folderNavForwardButton = null;

    // Check if essential elements exist
    // Removed: !facilitySelect // Removed date filter inputs check
    if (!documentManagementSection || !fileExplorerView || !breadcrumbList || !newFolderButton || !folderTreeViewContainer || !folderTreeView || !filterTypeSelect) {
        console.error("Essential elements (including type filter) for File Explorer page not found. Aborting initialization.");
        if (errorMessageDiv) showError("Error initializing page elements. Please refresh.");
        return; // Removed date filter inputs check
    }

    // --- Reset State and UI ---
    console.log("Resetting file explorer state and UI...");
    currentFolderId = 'root'; // Start at the root
    currentFilterType = 'all'; // Reset type filter
    // Removed date filter reset
    originalFolderItems = [];
    // Removed resets for deleted state variables
    // Removed facilitySelect resets
    breadcrumbList.innerHTML = ''; // Clear breadcrumbs
    fileExplorerView.innerHTML = ''; // Clear file view
    if(loadingMessage) loadingMessage.classList.remove('d-none'); // Show loading initially
    if(emptyFolderMessage) emptyFolderMessage.classList.add('d-none');
    if(folderTreeView) folderTreeView.innerHTML = ''; // Clear tree view
    // Removed hiding documentManagementSection
    breadcrumbNav.style.display = 'none'; // Hide breadcrumbs initially
    showError(''); showSuccess(''); // Clear messages
    if(filterTypeSelect) filterTypeSelect.value = 'all'; // Reset type filter UI
    // Removed date filter UI reset
    // --- End Reset State and UI ---
    folderNavBackButton = document.getElementById('folderNavBackButton');
    folderNavForwardButton = document.getElementById('folderNavForwardButton');

    // Remove title related to facility selection
    if(selectedFacilityNameElement) selectedFacilityNameElement.textContent = 'Documents'; // Set a generic title

    // Add Event Listeners
    setupDocumentsEventListeners();

    // Initial Load - Fetch root contents and render tree/breadcrumbs
    console.log("Performing initial fetch for root folder and tree...");
    try {
    if (!folderNavBackButton || !folderNavForwardButton) {
        console.warn("Folder navigation buttons not found. Back/Forward will not work.");
        // Don't abort initialization, just disable the feature
    }
        // Use Promise.all to run fetches concurrently, await completion
        await Promise.all([
            fetchAndRenderFolderContents(currentFolderId), // Fetch and render root ('root') content
            renderTreeView() // Render initial tree (root level)
        ]);
        // Render breadcrumbs *after* initial content/tree might be fetched
        await renderBreadcrumbs(currentFolderId);
        console.log("Initial page load rendering complete.");
    } catch (error) {
        console.error("Error during initial page load fetch/render:", error);
        showError("Failed to load initial document view: " + error.message);
    }

    // Remove the problematic redefinition block below
    /*
    // Use Promise.all to run fetches concurrently, await completion
    // Make initDocumentsPage async
    window.initDocumentsPage = async function() { // Make the function async
    backHistory = []; // Reset history
    forwardHistory = [];
    updateNavButtonsState(); // Initial state (disabled)
        // ... (rest of the function setup code remains the same) ...

        // Initial Load - Fetch root contents
        console.log("Performing initial fetch for root folder...");
        // Use Promise.all to run fetches concurrently, await completion
        await Promise.all([
            fetchAndRenderFolderContents(currentFolderId), // Fetch and render root ('root')
            renderTreeView() // Render initial tree (root level)
        ]);
        // Render breadcrumbs *after* initial content might be fetched (or handle within fetch)
        await renderBreadcrumbs(currentFolderId);
        console.log("Initial page load rendering complete.");
    }; // Close async function definition
    */

} // End of async initDocumentsPage function


// --- Navigation Button State Update ---

function updateNavButtonsState() {
    if (folderNavBackButton) {
        folderNavBackButton.disabled = backHistory.length === 0;
    }
    if (folderNavForwardButton) {
        folderNavForwardButton.disabled = forwardHistory.length === 0;
    }
    console.log(`[Nav History] Back: ${backHistory.length}, Forward: ${forwardHistory.length}`);
}

// --- End Navigation Button State Update ---


// --- Central Navigation Function ---

// Central function to navigate to a folder and update history/UI
async function navigateToFolder(folderId, updateHistory = true) {
    if (isNavigating) {
        console.warn('Navigation already in progress. Skipping.');
        return;
    }
    isNavigating = true; // Set flag
    console.log(`Navigating to folder: ${folderId}, Update History: ${updateHistory}`);

    if (!folderId || folderId === currentFolderId) {
        console.warn(`Navigation skipped: Invalid folderId (${folderId}) or already in folder.`);
        isNavigating = false; // Reset flag before returning
        return;
    }

    const previousFolderId = currentFolderId;

    // Update history ONLY if triggered by direct user action (not back/forward buttons)
    if (updateHistory) {
        backHistory.push(previousFolderId);
        forwardHistory = []; // Clear forward history on new navigation
        console.log(`[Nav History] Pushed ${previousFolderId} to back stack.`);
    }

    // Update the current folder state
    currentFolderId = folderId;

    // Use Promise.all to run fetches concurrently
    try {
        showLoadingIndicator(true); // Show loading indicator
        await Promise.all([
            fetchAndRenderFolderContents(currentFolderId), // Fetch and render contents
            renderBreadcrumbs(currentFolderId), // Render breadcrumbs
            renderTreeView() // Re-render tree to update highlighting
        ]);
        updateNavButtonsState(); // Update button states after navigation
        console.log(`Navigation and rendering for folder ${folderId} complete.`);
    } catch (error) {
        console.error(`Error during navigation to ${folderId}:`, error);
        showError(`Failed to load folder ${folderId}: ${error.message}`);
        // Optionally, attempt to revert state if navigation fails?
        // currentFolderId = previousFolderId; // Revert current folder ID
        // updateNavButtonsState();
    } finally {
        showLoadingIndicator(false); // Hide loading indicator
        isNavigating = false; // Reset flag when navigation finishes or errors out
    }
}

// --- End Central Navigation Function ---


// --- Navigation History Handlers ---

async function handleFolderNavBack() {
    if (backHistory.length > 0) {
        const previousFolderId = backHistory.pop();
        forwardHistory.push(currentFolderId); // Add current to forward history
        console.log(`[Nav History] Back clicked. Popped ${previousFolderId}. Pushed ${currentFolderId} to forward.`);
        await navigateToFolder(previousFolderId, false); // Navigate without updating history stacks further
    }
}

async function handleFolderNavForward() {
    if (forwardHistory.length > 0) {
        const nextFolderId = forwardHistory.pop();
        backHistory.push(currentFolderId); // Add current to back history
        console.log(`[Nav History] Forward clicked. Popped ${nextFolderId}. Pushed ${currentFolderId} to back.`);
        await navigateToFolder(nextFolderId, false); // Navigate without updating history stacks further
    }
}

// --- End Navigation History Handlers ---

// --- Sorting Handlers ---

// Combined handler for clicks within the file explorer view
function handleFileExplorerClick(event) {
    const target = event.target;

    // Check if the click was on a sortable header
    const header = target.closest('.sortable-header');
    if (header) {
        const newSortBy = header.dataset.sort;
        if (newSortBy) { // Ensure data-sort attribute exists
            console.log(`Sort header clicked: ${newSortBy}`);
            handleSortHeaderClick(newSortBy);
        }
        return; // Stop further processing if it was a header click
    }

    // If not a header click, proceed with original item click logic
    // Find the relevant elements for item clicks (links, actions)
    const itemLink = target.closest('a.item-link');
    const actionLink = target.closest('a.dropdown-item');

    if (itemLink) {
        handleItemLinkClick(event, itemLink); // Delegate to specific handler
    } else if (actionLink) {
        handleActionLinkClick(event, actionLink); // Delegate to specific handler
    }
}

// Extracted logic for handling clicks on item links (files/folders)
function handleItemLinkClick(event, itemLink) {
    const itemId = itemLink.dataset.itemId;
    const itemType = itemLink.dataset.itemType;
    console.log(`Item link clicked: ID=${itemId}, Type=${itemType}`);

    if (itemType === 'folder') {
        event.preventDefault(); // Prevent default only for folders
        handleFolderClick(itemId);
    } else if (itemType === 'file') {
        event.preventDefault(); // Prevent default only for files
        handleFileClick(itemId);
    }
    // External links will follow their href by default
}

// Extracted logic for handling clicks on action dropdown items
function handleActionLinkClick(event, actionLink) {
    event.preventDefault(); // Prevent default for action dropdown links
    const itemId = actionLink.dataset.itemId;
    console.log(`Action link clicked for item ID=${itemId}`);

    if (actionLink.classList.contains('action-rename')) {
        handleRenameClick(itemId);
    } else if (actionLink.classList.contains('action-move')) {
        handleMoveClick(itemId);
    } else if (actionLink.classList.contains('action-delete')) {
        handleDeleteClick(itemId);
    }
}


function handleSortHeaderClick(newSortBy) {
    if (sortBy === newSortBy) {
        // Toggle direction if clicking the same column
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Change column, default to ascending
        sortBy = newSortBy;
        sortDirection = 'asc';
    }
    console.log(`New sort state: sortBy=${sortBy}, sortDirection=${sortDirection}`);
    // Re-apply filters and sorting, then re-render
    applyFiltersAndRender();
}

function updateSortIcons() {
    const headers = fileExplorerView?.querySelectorAll('.sortable-header');
    if (!headers) return;

    headers.forEach(header => {
        const iconSpan = header.querySelector('.sort-icon');
        if (!iconSpan) return;

        const columnKey = header.dataset.sort;
        if (columnKey === sortBy) {
            // Apply icon based on direction
            iconSpan.innerHTML = sortDirection === 'asc' ? ' <i class="fas fa-sort-up"></i>' : ' <i class="fas fa-sort-down"></i>';
        } else {
            // Clear icon for non-active columns (optional: show neutral icon)
            iconSpan.innerHTML = ' <i class="fas fa-sort text-muted"></i>';
        }
    });
}

// --- End Sorting Handlers ---


// Function to setup event listeners, preventing duplicates
function setupDocumentsEventListeners() {
    console.log("Setting up file explorer event listeners...");

    // Remove old listeners if they exist (simple approach)
    // A more robust approach might involve storing references and removing specific ones
    // Removed: facilitySelect listener
    breadcrumbNav?.removeEventListener('click', handleBreadcrumbClick);
    fileExplorerView?.removeEventListener('click', handleItemClick);

// --- Navigation History --- 
// Removed updateNavButtonsState function from here. Will insert earlier.

    newFolderButton?.removeEventListener('click', handleNewFolderClick);
    uploadFileButton?.removeEventListener('click', handleUploadFileClick);
    addLinkButton?.removeEventListener('click', handleAddLinkClick);
    folderTreeView?.removeEventListener('click', handleTreeViewClick);
    filterTypeSelect?.removeEventListener('change', handleFilterChange);
    // Removed date filter listeners

    // Add new listeners
    // Removed: facilitySelect listener
    if (breadcrumbNav) {
        // Listen for clicks on breadcrumb links
        breadcrumbNav.addEventListener('click', handleBreadcrumbClick);

    // Drag and Drop Listeners (using delegation on containers)
    fileExplorerView?.addEventListener('dragstart', handleDragStart);
    fileExplorerView?.addEventListener('dragenter', handleDragEnter);
    fileExplorerView?.addEventListener('dragover', handleDragOver);
    fileExplorerView?.addEventListener('dragleave', handleDragLeave);

    // Folder Navigation Buttons
    folderNavBackButton?.addEventListener('click', handleFolderNavBack);
    folderNavForwardButton?.addEventListener('click', handleFolderNavForward);
    fileExplorerView?.addEventListener('drop', handleDrop);

    folderTreeView?.addEventListener('dragstart', handleDragStart); // Listen on tree too
    folderTreeView?.addEventListener('dragenter', handleDragEnter);
    folderTreeView?.addEventListener('dragover', handleDragOver);
    folderTreeView?.addEventListener('dragleave', handleDragLeave);
    folderTreeView?.addEventListener('drop', handleDrop);
    }
    if (fileExplorerView) {
        // Use event delegation for items AND sortable headers within the view
        fileExplorerView.addEventListener('click', handleFileExplorerClick); // Changed handler name
    }
    if (newFolderButton) {
        newFolderButton.addEventListener('click', handleNewFolderClick);
    }
     if (uploadFileButton) {
        uploadFileButton.addEventListener('click', handleUploadFileClick);
    }
     if (addLinkButton) {
        addLinkButton.addEventListener('click', handleAddLinkClick);
    }
    if (folderTreeView) {
        folderTreeView.addEventListener('click', handleTreeViewClick);
    }
    // Add type filter listener
    if (filterTypeSelect) {
        filterTypeSelect.addEventListener('change', handleFilterChange);
    }
    // Removed date filter listeners
} // Closing brace for setupDocumentsEventListeners
// --- Data Fetching & Handling ---

// Removed: populateFacilityDropdown function
// Removed: handleFacilitySelection function


// Helper function to show/hide a generic loading indicator
function showLoadingIndicator(isLoading) {
    if (loadingMessage) {
        if (isLoading) {
            loadingMessage.classList.remove('d-none');
        } else {
            loadingMessage.classList.add('d-none');
        }
    }
    // Optionally, disable/enable buttons while loading
}


// Helper function to add Auth header to fetch requests
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { ...options.headers }; // Start with existing headers

    // Only set default Content-Type if it's not FormData and not already set
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        console.log('[fetchWithAuth] Token found in localStorage:', !!token);
        headers['Authorization'] = `Bearer ${token}`;
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[fetchWithAuth] Authorization header set.');
    } else {
        console.warn(`[Auth] No token found for request to ${url}. Request might fail if endpoint is protected.`);
        // Optionally redirect to login if no token is ever found for protected routes
        // window.location.href = '/login.html'; 
        // throw new Error("Unauthorized: No token found."); // Or throw error
    }

    // Merge constructed headers back into options
    const fetchOptions = {
        ...options,
        headers: headers,
    };

    console.log('[fetchWithAuth] Options being sent:', JSON.stringify(fetchOptions, null, 2));

    // Perform the fetch call
    const response = await fetch(url, fetchOptions);

    // Centralized handling for 401/403 errors (Unauthorized/Forbidden)
    if (response.status === 401 || response.status === 403) {
        console.error(`[Auth] Received ${response.status} for ${url}. Token might be invalid or expired.`);
        // Clear potentially invalid token and redirect to login
        localStorage.removeItem('authToken'); 
        showError("Authentication failed or expired. Please log in again."); // Show message
        // Redirect immediately
        window.location.href = '/login.html';
        // Throw an error to stop further processing in the calling function
        throw new Error(`Authentication required (Status: ${response.status})`); 
    }

    return response; // Return the original response object
}


// Fetches items for a given folderId and triggers rendering
async function fetchAndRenderFolderContents(folderId) {
    console.log(`Fetching contents for folder: ${folderId}`);
    if (!fileExplorerView) return;

    // Show loading state
    fileExplorerView.innerHTML = ''; // Clear previous content
    if(loadingMessage) loadingMessage.classList.remove('d-none');
    if(emptyFolderMessage) emptyFolderMessage.classList.add('d-none');
    showError(''); // Clear previous errors

    try {
        const response = await fetchWithAuth(`/api/doc_items?parentId=${encodeURIComponent(folderId)}`); // Use fetchWithAuth
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to fetch folder contents (Status: ${response.status})`);
        }
        const itemsArray = await response.json();
        console.log(`Contents for ${folderId}:`, itemsArray);

        // Store the original items
        originalFolderItems = itemsArray;

        // Apply filters and render
        applyFiltersAndRender();

    } catch (error) {
        console.error(`Error fetching contents for folder ${folderId}:`, error);
        showError(`Failed to load folder contents: ${error.message}`);
        fileExplorerView.innerHTML = '<p class="text-danger p-3">Error loading items.</p>'; // Show error in view
    } finally {
        if(loadingMessage) loadingMessage.classList.add('d-none'); // Hide loading indicator
    }
}

// --- Rendering Functions ---

// Fetches parent path and renders breadcrumbs asynchronously
async function renderBreadcrumbs(folderId) {
    console.log("Rendering breadcrumbs for folder:", folderId);

    if (!breadcrumbList || !breadcrumbNav) {
        console.error("Breadcrumb elements not found.");
        return;
    }

    breadcrumbList.innerHTML = ''; // Clear existing
    breadcrumbNav.style.display = 'none'; // Hide initially

    if (!folderId || folderId === 'root') {
        // If at root, show only home icon
        const li = document.createElement('li');
        li.className = 'breadcrumb-item active';
        li.setAttribute('aria-current', 'page');
        li.innerHTML = '<i class="fas fa-home"></i> Root';
        breadcrumbList.appendChild(li);
        breadcrumbNav.style.display = 'block';
        return;
    }

    const path = [];
    let currentId = folderId;
    let safetyCounter = 0; // Prevent infinite loops

    try {
        showLoadingIndicator(true); // Show some loading indicator

        // Traverse up the hierarchy by fetching parent details
        while (currentId && currentId !== 'root' && safetyCounter < 20) {
            safetyCounter++;
            // Fetch details for the current item ID
            const response = await fetchWithAuth(`/api/doc_items/${currentId}`); // Use fetchWithAuth
            if (!response.ok) {
                console.error(`Error fetching breadcrumb item ${currentId}: ${response.statusText}`);
                throw new Error(`Failed to fetch path item ${currentId}`);
            }
            const itemData = await response.json();

            if (!itemData) break; // Should not happen if ID was valid

            path.unshift({ id: itemData.id, name: itemData.name }); // Add to beginning of path array

            currentId = itemData.parentId; // Move to the parent
        }

        // Add the root element manually
        const rootLi = document.createElement('li');
        rootLi.className = 'breadcrumb-item';
        const rootLink = document.createElement('a');
        rootLink.href = '#';
        rootLink.dataset.folderId = 'root'; // Link to root
        rootLink.innerHTML = '<i class="fas fa-home"></i> Root';
        rootLi.appendChild(rootLink);
        breadcrumbList.appendChild(rootLi);

        // Create breadcrumb items for the fetched path
        path.forEach((item, index) => {
            const li = document.createElement('li');
            const isLast = index === path.length - 1;
            li.className = `breadcrumb-item ${isLast ? 'active' : ''}`;
            li.setAttribute('aria-current', isLast ? 'page' : 'false');

            if (isLast) {
                li.textContent = item.name;
            } else {
                const a = document.createElement('a');
                a.href = '#';
                a.dataset.folderId = item.id; // Store folder ID for click handling
                a.textContent = item.name;
                li.appendChild(a);
            }
            breadcrumbList.appendChild(li);
        });

        breadcrumbNav.style.display = 'block'; // Show breadcrumbs

    } catch (error) {
        console.error("Error building breadcrumbs:", error);
        showError("Failed to load navigation path.");
        breadcrumbList.innerHTML = '<li class="breadcrumb-item active">Error</li>'; // Show error state
        breadcrumbNav.style.display = 'block';
    } finally {
         showLoadingIndicator(false); // Hide loading indicator
    }
}

// Renders the items (files/folders/links) in the main content table
function renderFolderContents(itemsToRender) { // Changed parameter name
    console.log("Rendering folder contents with items:", itemsToRender);

    if (!fileExplorerView) {
        console.error("File explorer view element not found.");
        return;
    }
    fileExplorerView.innerHTML = ''; // Clear existing view
    if(loadingMessage) loadingMessage.classList.add('d-none');
    if(emptyFolderMessage) emptyFolderMessage.classList.add('d-none');

    // Check if the passed array is valid
    if (!itemsToRender) {
        console.warn("itemsToRender is null or undefined for rendering folder contents.");
        fileExplorerView.innerHTML = '<p class="text-danger p-3">Error preparing items for display.</p>';
        return; // Exit if no valid array provided
    }
    // Check if the array (potentially after filtering) is empty
    if (itemsToRender.length === 0) {
        if (currentFilterType !== 'all') { // Check only type filter
            // If type filter is active, show a "no results matching filter" message
            emptyFolderMessage.textContent = "No items match the current filter criteria.";
        } else {
            // Otherwise, show the standard empty folder message
            emptyFolderMessage.textContent = "This folder is empty.";
        }
        if(emptyFolderMessage) emptyFolderMessage.classList.remove('d-none');
        fileExplorerView.appendChild(emptyFolderMessage); // Append the potentially modified message
        return; // Exit if no items to render
    }

    // --- Create Table Structure (Example) ---
    const table = document.createElement('table');
    table.className = 'table table-hover table-sm'; // Bootstrap table classes
    const thead = table.createTHead();
    const tbody = table.createTBody();
    const headerRow = thead.insertRow();
    // Add data-sort attributes and sort icon spans to relevant headers
    headerRow.innerHTML = `
        <th scope="col" style="width: 40px;">Type</th>
        <th scope="col" class="sortable-header" data-sort="name" style="cursor: pointer;">Name <span class="sort-icon"></span></th>
        <th scope="col" class="sortable-header" data-sort="modifiedAt" style="cursor: pointer;">Date Modified/Added <span class="sort-icon"></span></th>
        <th scope="col">Size</th>
        <th scope="col" style="width: 100px;">Actions</th>
    `;
    // Note: Added Size header without sorting for now, can be added later if needed.

    // --- Populate Table Rows ---
    // Iterate over the itemsToRender array
    itemsToRender.forEach(item => {
        if (!item) {
            console.warn("Encountered null/undefined item in itemsArray.");
            return; // Skip invalid item
        }

        const row = tbody.insertRow();
        row.dataset.itemId = item.id; // Store item ID on the row
        row.dataset.itemType = item.type;
        row.draggable = true; // Make the row draggable

        let iconClass = 'fa-question-circle'; // Default icon
        let itemLink = '#';
        let nameContent = item.name;
        let dateContent = '';
        let sizeContent = '';

        if (item.type === 'folder') {
            iconClass = 'fa-folder text-warning'; // Folder icon
            itemLink = '#'; // Folders handled by click listener on name
            // Check if createdAt exists and is the serialized Firestore Timestamp object
            if (item.createdAt && typeof item.createdAt === 'object' && item.createdAt._seconds !== undefined) {
                 // Convert from seconds to milliseconds for JS Date and format with time
                dateContent = new Date(item.createdAt._seconds * 1000).toLocaleString(); // Use toLocaleString
            } else if (item.createdAt) {
                 // Attempt to parse if it's some other format (e.g., ISO string)
                 const parsedDate = new Date(item.createdAt);
                 dateContent = !isNaN(parsedDate) ? parsedDate.toLocaleString() : '-'; // Use toLocaleString
            } else {
                 dateContent = '-'; // Fallback if createdAt is missing
            }
            sizeContent = '-';
             row.classList.add('folder-row'); // Add class for styling/event handling
        } else if (item.type === 'file') {
            iconClass = 'fa-file-alt text-secondary'; // File icon
            itemLink = '#'; // Files handled by click listener on name
            // Use createdAt for files as well, as uploadedAt is not being set in the backend
            if (item.createdAt && typeof item.createdAt === 'object' && item.createdAt._seconds !== undefined) {
                 // Convert from seconds to milliseconds for JS Date and format with time
                dateContent = new Date(item.createdAt._seconds * 1000).toLocaleString(); // Use toLocaleString
            } else if (item.createdAt) {
                 // Attempt to parse if it's some other format (e.g., ISO string)
                 const parsedDate = new Date(item.createdAt);
                 dateContent = !isNaN(parsedDate) ? parsedDate.toLocaleString() : '-'; // Use toLocaleString
            } else {
                 dateContent = '-'; // Fallback if createdAt is missing
            }
            sizeContent = item.size ? `${(item.size / 1024).toFixed(1)} KB` : '-'; // Format size
             row.classList.add('file-row');
        } else if (item.type === 'link') {
            iconClass = 'fa-link text-info'; // Link icon
            itemLink = item.url; // Links open directly
            nameContent = `${item.name} <i class="fas fa-external-link-alt fa-xs"></i>`; // Add external link icon
            dateContent = item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '-';
            sizeContent = '-';
             row.classList.add('link-row');
        }

        // Cell: Type Icon
        const cellType = row.insertCell();
        cellType.innerHTML = `<i class="fas ${iconClass} fa-fw"></i>`;

        // Cell: Name (with link/action trigger)
        const cellName = row.insertCell();
        if (item.type === 'folder' || item.type === 'file') {
            // Folders and files trigger actions via click listener
            cellName.innerHTML = `<a href="#" class="item-link" data-item-id="${item.id}" data-item-type="${item.type}">${item.name}</a>`;
        } else if (item.type === 'link') {
            // Links open directly
            cellName.innerHTML = `<a href="${itemLink}" target="_blank" class="item-link" title="${item.url}">${nameContent}</a>`;
        } else {
             cellName.textContent = item.name;
        }


        // Cell: Date
        const cellDate = row.insertCell();
        cellDate.textContent = dateContent;
        cellDate.classList.add('text-muted', 'small');

        // Cell: Size
        const cellSize = row.insertCell();
        cellSize.textContent = sizeContent;
        cellSize.classList.add('text-muted', 'small');

        // Cell: Actions (Dropdown Example)
        const cellActions = row.insertCell();
        cellActions.classList.add('text-end');
        cellActions.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="actionsDropdown-${item.id}" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="actionsDropdown-${item.id}">
                    <li><a class="dropdown-item action-rename" href="#" data-item-id="${item.id}"><i class="fas fa-edit fa-fw me-2"></i>Rename</a></li>
                    <li><a class="dropdown-item action-move" href="#" data-item-id="${item.id}"><i class="fas fa-folder-open fa-fw me-2"></i>Move</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item action-delete text-danger" href="#" data-item-id="${item.id}"><i class="fas fa-trash-alt fa-fw me-2"></i>Delete</a></li>
                </ul>
            </div>
        `;
    });

    fileExplorerView.appendChild(table);

    // Update sort icons after rendering table structure
    updateSortIcons();
}

// --- Filtering Logic ---

// Called when any filter input changes
function handleFilterChange() {
    console.log("Filter changed.");
    // Update state variables from input values
    currentFilterType = filterTypeSelect ? filterTypeSelect.value : 'all';
    // Date parsing logic removed.
    console.log(`Filter State Updated: Type=${currentFilterType}`); // Removed date state logging

    // Re-apply filters and render the table
    applyFiltersAndRender();
}

// Applies current filters and sorting to originalFolderItems and calls renderFolderContents
function applyFiltersAndRender() {
    console.log("Applying filters/sorting to original items:", originalFolderItems);
    if (!originalFolderItems) {
        console.warn("Original folder items not available for filtering.");
        renderFolderContents([]); // Render empty state
        return;
    }

    let filteredItems = originalFolderItems;

    // 1. Filter by Type
    if (currentFilterType !== 'all') {
        filteredItems = filteredItems.filter(item => item.type === currentFilterType);
        console.log("After Type Filter:", filteredItems);
    }

    // Date filtering logic removed based on user feedback.

    // 2. Apply Sorting
    if (sortBy && sortDirection) {
        filteredItems.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            // Handle different data types for sorting
            if (sortBy === 'modifiedAt') {
                // Convert dates for comparison, handle nulls
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else if (sortBy === 'name' || sortBy === 'type') {
                // Case-insensitive string comparison
                valA = (valA || '').toString().toLowerCase();
                valB = (valB || '').toString().toLowerCase();
            } else if (sortBy === 'size') {
                // Numerical comparison, handle nulls/undefined
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }

            let comparison = 0;
            if (valA > valB) {
                comparison = 1;
            } else if (valA < valB) {
                comparison = -1;
            }

            return sortDirection === 'desc' ? comparison * -1 : comparison;
        });
        console.log(`After Sorting by ${sortBy} ${sortDirection}:`, filteredItems);
    }
    // Render the filtered and sorted list
    renderFolderContents(filteredItems);
}

// --- End Filtering Logic ---



// Helper function to build HTML for a list of items (folders) in the tree
// This version doesn't handle recursion; assumes itemsArray is one level
function buildTreeLevelHtml(itemsArray) {
    if (!itemsArray || itemsArray.length === 0) {
        return null;
    }

    const ul = document.createElement('ul');
    ul.className = 'list-unstyled ps-3'; // Indentation for nested levels

    // Sort items: folders first, then by name (assuming API sorted by name)
    const sortedItems = [...itemsArray].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name); // Fallback sort by name
    });
    sortedItems.forEach(item => {
        if (item.type !== 'folder') return; // Only render folders in the tree

        const li = document.createElement('li');
        li.className = 'tree-node'; // Keep class for styling consistency
        li.dataset.itemId = item.id;
        li.dataset.itemType = item.type;

        // Container for the clickable part (icon, name, toggle)
        const nodeContent = document.createElement('div');
        // Add some padding for non-folder items to align them visually with folder text
        nodeContent.className = `d-flex align-items-center ${item.type !== 'folder' ? 'ps-4' : ''}`; // Increased padding slightly

        let itemHtml = '';
        // isActive should check if the *current view* matches the folder, not the item itself
        const isCurrentViewFolder = item.type === 'folder' && item.id === currentFolderId;

        if (item.type === 'folder') {
            li.draggable = true; // Only folders are draggable in the tree

            // Expand/Collapse Toggle Icon (Chevron)
            const toggleIcon = document.createElement('a');
            toggleIcon.href = '#';
            toggleIcon.className = 'expand-toggle me-1 text-muted';
            toggleIcon.dataset.folderId = item.id;
            toggleIcon.innerHTML = '<i class="fas fa-chevron-right fa-xs"></i>';
            nodeContent.appendChild(toggleIcon);

            // Folder Link
            const link = document.createElement('a');
            link.href = '#';
            link.dataset.folderId = item.id; // ID for navigation
            link.className = `tree-link flex-grow-1 p-1 rounded ${isCurrentViewFolder ? 'active bg-primary text-white' : 'text-dark'}`;
            const folderIconClass = (item.parentId === 'root') ? 'fa-home' : 'fa-folder';
            const folderIconColor = isCurrentViewFolder ? '' : 'text-warning';
            link.innerHTML = `<i class="fas ${folderIconClass} fa-fw me-1 ${folderIconColor}"></i> ${item.name}`;
            nodeContent.appendChild(link);

             // Placeholder UL for children, initially hidden
            const childrenUl = document.createElement('ul');
            childrenUl.className = 'list-unstyled ps-3 d-none'; // Indented and hidden
            childrenUl.dataset.parentId = item.id;
            li.appendChild(nodeContent); // Add content first
            li.appendChild(childrenUl); // Then add children container

        } else {
             // Non-folder items (Files, Links) - Not draggable, no toggle, not directly navigable via tree click
             li.draggable = false; // Files/links not draggable in tree

             let iconClass = 'fa-file-alt text-secondary'; // Default file icon
             let itemTitle = item.name; // Tooltip title
             if (item.type === 'link') {
                 iconClass = 'fa-link text-info';
                 itemTitle = `${item.name} (${item.url})`;
             }

             // Display item with icon and name (not a link for navigation)
             const itemSpan = document.createElement('span');
             // Add data-item-id for potential future actions (e.g., rename/delete from tree)
             itemSpan.dataset.itemId = item.id;
             itemSpan.className = 'tree-item flex-grow-1 p-1 text-muted small'; // Style as plain text, slightly smaller
             itemSpan.title = itemTitle; // Show full name or URL on hover
             itemSpan.innerHTML = `<i class="fas ${iconClass} fa-fw me-1"></i> ${item.name}`;
             nodeContent.appendChild(itemSpan);
             li.appendChild(nodeContent);
        }

        ul.appendChild(li); // Add the constructed list item to the list
    });

    return ul.children.length > 0 ? ul : null;
}


// Main function to render the tree view (fetches root items)
async function renderTreeView() { // Simplified signature
    if (!folderTreeView) {
        console.error("Tree view container element not found.");
        return;
    }
    folderTreeView.innerHTML = '<p class="text-muted small">Loading tree...</p>'; // Loading indicator

    try {
        // Fetch top-level items (parentId === 'root') using the new API
        console.log("Fetching root items for tree view...");
        const response = await fetchWithAuth(`/api/doc_items?parentId=root`); // Use fetchWithAuth
        if (!response.ok) {
             throw new Error(`Failed to fetch root items: ${response.statusText}`);
        }
        const rootItems = await response.json();
        console.log("Root items fetched:", rootItems);

        folderTreeView.innerHTML = ''; // Clear loading message

        const treeUl = buildTreeLevelHtml(rootItems); // Build HTML UL containing top-level LIs

        if (treeUl && treeUl.children.length > 0) {
            // Adjust top-level padding if needed
            treeUl.classList.remove('ps-3');
            folderTreeView.appendChild(treeUl);
            console.log("Initial tree view rendering complete (root level nodes).");

            // --- Auto-expand top-level folders ---
            console.log("Auto-expanding top-level folders...");
            const topLevelFolders = folderTreeView.querySelectorAll(':scope > ul > li.tree-node[data-item-type="folder"]');
            const expandPromises = [];

            topLevelFolders.forEach(li => {
                const folderId = li.dataset.itemId;
                const childrenUl = li.querySelector('ul[data-parent-id]');
                const toggleIconElement = li.querySelector('.expand-toggle i');

// Removed navigateToFolder function from here. Will insert earlier.

                if (folderId && childrenUl && toggleIconElement) {
                    console.log(`Auto-fetching children for top-level folder: ${folderId}`);
                    expandPromises.push(
                        fetchAndRenderTreeLevel(folderId, childrenUl).then(success => {
                            if (success) {
                                childrenUl.classList.remove('d-none'); // Show children
                                toggleIconElement.classList.remove('fa-chevron-right');
                                toggleIconElement.classList.add('fa-chevron-down'); // Change icon
                                console.log(`Auto-expanded: ${folderId}`);
                            } else {
                                console.warn(`Failed to auto-fetch children for ${folderId}`);
                                // Optionally leave the error message shown by fetchAndRenderTreeLevel
                            }
                        })
                    );
                }
            });

            // Wait for all auto-expansions to finish (optional, but good practice)
            await Promise.all(expandPromises);
            console.log("Finished auto-expanding top-level folders.");
            // --- End Auto-expand ---

        } else {
            folderTreeView.innerHTML = '<p class="text-muted small">No top-level items found.</p>'; // Updated message
            console.log("No root items found to render in tree view.");
        }

    } catch (error) {
        console.error("Error rendering tree view:", error);
        folderTreeView.innerHTML = '<p class="text-danger small">Error loading folder tree.</p>';
        // Avoid showing generic error if specific one exists
        if (!errorMessageDiv || errorMessageDiv.textContent === '') {
             showError("Failed to load folder tree.");
        }
    }
}


// --- Event Handlers ---

function handleItemClick(event) {
    // event.preventDefault(); // Moved inside specific type handlers

    const target = event.target;
    const itemLink = target.closest('a.item-link'); // Click might be on icon inside link
    const actionLink = target.closest('a.dropdown-item'); // Click on action menu item

    if (itemLink) {
        const itemId = itemLink.dataset.itemId;
        const itemType = itemLink.dataset.itemType;
        console.log(`Item link clicked: ID=${itemId}, Type=${itemType}`);

        if (itemType === 'folder') {
            event.preventDefault(); // Prevent default only for folders
            handleFolderClick(itemId);
        } else if (itemType === 'file') {
            event.preventDefault(); // Prevent default only for files
            handleFileClick(itemId);
        }
        // Links will now follow their href by default

    } else if (actionLink) {
        event.preventDefault(); // Prevent default for action dropdown links
        const itemId = actionLink.dataset.itemId;
        console.log(`Action link clicked for item ID=${itemId}`);

        if (actionLink.classList.contains('action-rename')) {
            handleRenameClick(itemId);
        } else if (actionLink.classList.contains('action-move')) {
            handleMoveClick(itemId);
        } else if (actionLink.classList.contains('action-delete')) {
            handleDeleteClick(itemId);
        }
    }
}

// Handles clicks on folders in tree view, breadcrumbs, or main content
// This now primarily acts as a wrapper to call navigateToFolder
async function handleFolderClick(folderId) {
     // Call the central navigation function, indicating history should be updated
    await navigateToFolder(folderId, true);
}

async function handleFileClick(fileId) {
    console.log("File clicked:", fileId);
    // Removed validation using old state variables

    // Show loading indicator
    // We don't have the filename readily available here anymore without another fetch,
    // so use a generic message or fetch item details first if name is needed.
    showSuccess(`Getting download link...`);
    showError('');

    try {
        // Use the new API endpoint for doc_items
        const response = await fetchWithAuth(`/api/doc_items/${fileId}/download-url`); // Use fetchWithAuth
        const result = await response.json();
        if (response.ok && result.url) {
            showSuccess(''); // Clear loading message
            window.open(result.url, '_blank'); // Open the signed URL
        } else {
            throw new Error(result.message || `Failed to get download URL (Status: ${response.status})`);
        }
    } catch (error) {
        console.error('Error fetching document URL:', error);
        showError(`Error getting file link: ${error.message}`);
        showSuccess(''); // Clear loading message
    }
}

async function handleBreadcrumbClick(event) { // Make async
    const target = event.target.closest('a'); // Find the clicked anchor tag
    if (target && target.dataset.folderId) {
        event.preventDefault();
        const folderId = target.dataset.folderId;
        console.log("Breadcrumb clicked, navigating to folder:", folderId);
        // Call the central navigation function, indicating history should be updated
        await navigateToFolder(folderId, true);
    }
}

// Fetches and renders a level of the tree into a target UL element
async function fetchAndRenderTreeLevel(folderId, targetUlElement) {
     if (!targetUlElement) return;
     console.log(`Fetching tree level for parent: ${folderId}`);
     targetUlElement.innerHTML = '<li class="text-muted small ps-1">Loading...</li>'; // Show loading inside UL

     try {
        const response = await fetchWithAuth(`/api/doc_items?parentId=${encodeURIComponent(folderId)}`); // Use fetchWithAuth
        if (!response.ok) {
            throw new Error(`Failed to fetch children: ${response.statusText}`);
        }
        const items = await response.json();
        targetUlElement.innerHTML = ''; // Clear loading

        const childrenHtmlUl = buildTreeLevelHtml(items); // Build the HTML UL for the children
        if (childrenHtmlUl && childrenHtmlUl.children.length > 0) {
             // Append the children LI elements directly to the target UL
             // This avoids nested ULs from buildTreeLevelHtml itself
             Array.from(childrenHtmlUl.children).forEach(li => targetUlElement.appendChild(li));
        } else {
            targetUlElement.innerHTML = '<li class="text-muted small ps-1">(Empty)</li>'; // Indicate empty folder
        }
        return true; // Indicate success
     } catch (error) {
         console.error(`Error fetching tree level for ${folderId}:`, error);
         targetUlElement.innerHTML = '<li class="text-danger small ps-1">Error loading</li>'; // Show error in target UL
         return false; // Indicate failure
         targetUlElement.innerHTML = '<li class="text-danger small ps-1">Error loading</li>';
     }
}

// Handles clicks within the tree view (navigation and expand/collapse)
async function handleTreeViewClick(event) { // Made async
    const target = event.target;
    const toggleLink = target.closest('a.expand-toggle');
    const folderLink = target.closest('a.tree-link');

    if (toggleLink) {
        // --- Handle Expand/Collapse ---
        event.preventDefault();
        const folderId = toggleLink.dataset.folderId;
        const parentLi = toggleLink.closest('li.tree-node');
        const childrenUl = parentLi?.querySelector(`ul[data-parent-id="${folderId}"]`);
        const icon = toggleLink.querySelector('i');

        if (!parentLi || !childrenUl || !icon) {
            console.error("Could not find necessary elements for expand/collapse for folder:", folderId);
            return;
        }

        const isExpanded = !childrenUl.classList.contains('d-none');

        if (!isExpanded && childrenUl.children.length === 0) {
            // If collapsing or already expanded, just toggle visibility
             childrenUl.classList.toggle('d-none');
             icon.classList.toggle('fa-chevron-right');
             icon.classList.toggle('fa-chevron-down');
        } else {
             // If expanding and not loaded yet, fetch children
             await fetchAndRenderTreeLevel(folderId, childrenUl);
             // Ensure it's visible after loading (might already be if fetch was fast)
             childrenUl.classList.remove('d-none');
             icon.classList.remove('fa-chevron-right');
             icon.classList.add('fa-chevron-down');
        }

    } else if (folderLink) {
        // --- Handle Navigation ---
        event.preventDefault();
        const folderId = folderLink.dataset.folderId;
        console.log("Tree view folder link clicked:", folderId);
        // Roo Fix: Add the missing navigation call
        handleFolderClick(folderId);
        // The handleFolderClick call above already handles navigation.
    }
}


// --- Action Button Handlers (Placeholders/Basic Implementation) ---

async function handleNewFolderClick() { // Made async
    console.log("New Folder button clicked. Current Parent:", currentFolderId);
    if (!currentFolderId) {
        showError("Cannot determine the current folder. Please navigate to a folder first.");
        return;
    }

    const folderName = prompt("Enter name for the new folder:");
    if (!folderName || folderName.trim().length === 0) {
        showError("Folder name cannot be empty.");
        return;
    }
    const cleanName = folderName.trim();

    // TODO: Add loading state indication
    showSuccess(`Creating folder '${cleanName}'...`);
    showError('');

    let parentTags = [];
    let facilityTagToInherit = null;

    // Fetch parent tags unless parent is root
    if (currentFolderId !== 'root') {
        try {
            console.log(`Fetching parent folder (${currentFolderId}) details to inherit tags...`);
            const parentInfoResponse = await fetchWithAuth(`/api/doc_items/${currentFolderId}`); // Use fetchWithAuth
            if (!parentInfoResponse.ok) {
                 console.warn(`Could not fetch parent folder details (${parentInfoResponse.statusText}), proceeding without tag inheritance.`);
            } else {
                 const parentData = await parentInfoResponse.json();
                 parentTags = parentData.tags || [];
                 facilityTagToInherit = parentTags.find(tag => tag.startsWith('facility:'));
                 console.log("Parent tags found:", parentTags, "Facility tag to inherit:", facilityTagToInherit);
            }
        } catch (fetchError) {
             console.warn("Error fetching parent folder details, proceeding without tag inheritance:", fetchError);
        }
    }

    // Prepare data for the new API endpoint
    const newItemData = {
        name: cleanName,
        type: 'folder',
        parentId: currentFolderId,
        tags: []
    };

    // Inherit facility tag if found
    if (facilityTagToInherit) {
        newItemData.tags.push(facilityTagToInherit);
    }
    // TODO: Consider inheriting other tags from parentTags if needed

    try {
        const response = await fetchWithAuth('/api/doc_items', { // Use fetchWithAuth
            method: 'POST',
            // headers: { 'Content-Type': 'application/json' }, // fetchWithAuth handles headers
            body: JSON.stringify(newItemData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to create folder (Status: ${response.status})`);
        }

        const createdItem = await response.json(); // API now returns the created item
        console.log("Folder created successfully:", createdItem);
        showSuccess(`Folder '${cleanName}' created successfully.`);

        // Refresh the current folder view by re-fetching its contents
        await fetchAndRenderFolderContents(currentFolderId);

        // Refresh the tree view to show the new folder
        await renderTreeView(); // Re-render the tree

    } catch (error) {
        console.error("Error creating folder:", error);
        showError(`Error creating folder: ${error.message}`);
        showSuccess(''); // Clear loading message
    }
}


function handleUploadFileClick() {
    console.log("Upload File button clicked. Current Parent:", currentFolderId);
    // Removed check for currentSelectedFacilityId
    if (!currentFolderId) {
        showError("Cannot determine the current folder. Please navigate to a folder first.");
        return;
    }
    // TODO: Implement a proper file upload modal/dialog
    // For now, use a simple input - THIS IS TEMPORARY
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // TODO: Add loading state indication
        showSuccess(`Uploading ${file.name}...`);
        showError('');

        const formData = new FormData();
        formData.append('document', file); // API expects 'document' field
        formData.append('parentId', currentFolderId); // Send parent folder ID

        try {
            // Step 1: Determine Facility Context for storage path and tagging
            let facilityIdForStorage = null;
            let parentTags = []; // Store parent tags to potentially inherit

            if (currentFolderId === 'root') {
                // If uploading to root, use a default 'uncategorized' context
                facilityIdForStorage = '_uncategorized';
                console.log("Uploading to root, using default storage context:", facilityIdForStorage);
            } else {
                // Fetch parent folder details to find facility tag
                console.log(`Fetching parent folder (${currentFolderId}) details to find facility tag...`);
                const parentInfoResponse = await fetchWithAuth(`/api/doc_items/${currentFolderId}`); // Use fetchWithAuth
                if (!parentInfoResponse.ok) {
                     throw new Error(`Could not fetch parent folder details (${parentInfoResponse.statusText})`);
                }
                const parentData = await parentInfoResponse.json();
                parentTags = parentData.tags || [];
                const facilityTag = parentTags.find(tag => tag.startsWith('facility:'));
                if (facilityTag) {
                    facilityIdForStorage = facilityTag.split(':')[1];
                    console.log(`Found facility context from parent tag: ${facilityIdForStorage}`);
                } else {
                    // If parent isn't root and has no facility tag, default to uncategorized
                    facilityIdForStorage = '_uncategorized';
                    console.warn(`No 'facility:xxx' tag found on parent folder ${currentFolderId}. Defaulting to storage context: ${facilityIdForStorage}`);
                    // throw new Error("Could not determine facility context for storage path. Ensure the parent folder is tagged with 'facility:xxx'."); // Roo: Allow upload even without tag
                }
            }

            // Step 2: Upload file to storage via the old (refactored) endpoint
            // Use the determined context (facility ID or '_uncategorized')
            console.log(`Uploading file to storage under context: ${facilityIdForStorage}`);
            // Use fetchWithAuth for the storage upload as well
            const storageResponse = await fetchWithAuth(`/api/facilities/${facilityIdForStorage}/files`, {
                method: 'POST',
                body: formData
                // fetchWithAuth will add the Authorization header
                // Content-Type will be set automatically by the browser for FormData
            });

            if (!storageResponse.ok) {
                 const errorData = await storageResponse.json().catch(() => ({ message: storageResponse.statusText }));
                 throw new Error(errorData.message || `Storage upload failed (Status: ${storageResponse.status})`);
            }
            const storageResult = await storageResponse.json();
            console.log("File stored successfully:", storageResult);

            // Step 3: Create the metadata document in doc_items using the new endpoint
            showSuccess(`Creating metadata for ${storageResult.name}...`);

            // Prepare tags: include facility tag if context wasn't '_uncategorized'
            const newTags = [];
            if (facilityIdForStorage !== '_uncategorized') {
                 newTags.push(`facility:${facilityIdForStorage}`);
            }
            // TODO: Consider inheriting other relevant tags from parentTags

            const newItemData = {
                name: storageResult.name,
                type: 'file',
                parentId: storageResult.parentId, // Use parentId passed back from storage endpoint
                tags: newTags,
                storagePath: storageResult.storagePath,
                contentType: storageResult.contentType,
                size: storageResult.size
            };

            // Use fetchWithAuth to create the metadata item
            const createResponse = await fetchWithAuth('/api/doc_items', {
                 method: 'POST',
                 // headers: { 'Content-Type': 'application/json' }, // fetchWithAuth handles headers
                 body: JSON.stringify(newItemData)
                 // fetchWithAuth adds Auth header and correct Content-Type for JSON
            });

             if (!createResponse.ok) {
                const errorData = await createResponse.json().catch(() => ({ message: createResponse.statusText }));
                // Attempt to clean up stored file if metadata creation fails? Difficult.
                console.error(`Metadata creation failed for ${storageResult.storagePath}, but file was stored.`);
                throw new Error(errorData.message || `Metadata creation failed (Status: ${createResponse.status})`);
            }
            const createdItem = await createResponse.json();
            console.log("Doc item created successfully:", createdItem);
            showSuccess(`File '${createdItem.name}' uploaded and registered successfully.`);

            // Step 4: Refresh UI
            fetchAndRenderFolderContents(currentFolderId);
            renderTreeView(); // Refresh tree

        } catch (error) {
            console.error("Error during file upload process:", error);
            showError(`Upload failed: ${error.message}`);
            showSuccess(''); // Clear loading message
        }
    };
    fileInput.click(); // Trigger the file selection dialog
}

function handleAddLinkClick() {
    console.log("Add Link button clicked. Current Parent:", currentFolderId);
    // Removed facility check
    if (!currentFolderId) {
        showError("Cannot determine the current folder. Please navigate to a folder first.");
        return;
    }

    // TODO: Implement a proper modal/dialog for adding links
    const url = prompt("Enter the URL:");
    if (!url || !url.trim().startsWith('http')) { // Basic URL validation
        showError("Invalid URL provided. Please include http:// or https://");
        return;
    }
    const name = prompt("Enter a name/description for the link:");
     if (!name || name.trim().length === 0) {
        showError("Link name cannot be empty.");
        return;
    }
    const cleanName = name.trim();
    const cleanUrl = url.trim();

    // TODO: Add loading state indication
    showSuccess(`Adding link '${cleanName}'...`);
    showError('');

    // Prepare data for the new API endpoint
    const newItemData = {
        name: cleanName,
        type: 'link',
        url: cleanUrl,
        parentId: currentFolderId,
        tags: [] // Add default tags if needed
    };

    const token = localStorage.getItem('authToken'); // Get the token from local storage

    fetch('/api/doc_items', { // Use the new endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Add the Authorization header
        },
        body: JSON.stringify(newItemData)
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to add link (Status: ${response.status})`);
        }
        return response.json();
    })
    .then(createdItem => {
        console.log("Link added successfully:", createdItem);
        showSuccess(`Link '${cleanName}' added successfully.`);

        // Refresh the current folder view by re-fetching its contents
        fetchAndRenderFolderContents(currentFolderId);

        // Refresh the tree view (though links aren't shown there)
        renderTreeView();

    })
    .catch(error => {
        console.error("Error adding link:", error);
        showError(`Error adding link: ${error.message}`);
        showSuccess(''); // Clear loading message
    });
}

async function handleRenameClick(itemId) { // Made async
    console.log("Rename action clicked for item:", itemId);
    if (!itemId) {
        showError("Cannot rename item: ID missing.");
        return;
    }

    // Fetch current item details to get the current name for the prompt
    let currentName = '';
    try {
        const response = await fetch(`/api/doc_items/${itemId}`);
        if (!response.ok) throw new Error('Failed to fetch item details for rename.');
        const itemData = await response.json();
        currentName = itemData.name;
    } catch (fetchError) {
        console.error("Error fetching item details before rename:", fetchError);
        showError(`Could not get current item details: ${fetchError.message}`);
        return;
    }

    const newName = prompt(`Enter new name for '${currentName}':`, currentName);
    const cleanNewName = newName?.trim(); // Use optional chaining and trim

    if (!cleanNewName || cleanNewName === currentName) {
        showError("Invalid or unchanged name provided.");
        return;
    }

    // TODO: Add loading state
    showSuccess(`Renaming '${currentName}' to '${cleanNewName}'...`);
    showError('');

    // Call the new PUT endpoint for doc_items
    fetch(`/api/doc_items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanNewName }) // Only send the name field
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to rename item (Status: ${response.status})`);
        }
        return response.json(); // API returns the updated item
    })
    .then(updatedItem => {
        console.log("Item renamed successfully:", updatedItem);
        showSuccess(`Item renamed to '${updatedItem.name}' successfully.`);

        // Refresh the current folder view by re-fetching
        // Need parentId to refresh correctly. Get it from the updated item.
        const parentIdToRefresh = updatedItem.parentId || currentFolderId || 'root'; // Fallback needed if parentId isn't returned?
        fetchAndRenderFolderContents(parentIdToRefresh);

        // Refresh the tree view
        renderTreeView();
    })
    .catch(error => {
        console.error("Error renaming item:", error);
        showError(`Error renaming item: ${error.message}`);
        showSuccess('');
    });
}

async function handleMoveClick(itemId) { // Made async
    console.log("Move action clicked for item:", itemId);
    if (!itemId) {
        showError("Cannot move item: ID missing.");
        return;
    }

    // TODO: Replace prompt with a proper folder selection UI (e.g., a modal with a tree view)
    // This UI would likely need to fetch folder data using GET /api/doc_items?parentId=...
    const newParentId = prompt("Enter the ID of the destination folder (or 'root'):");

    if (!newParentId || !newParentId.trim()) {
        showError("Invalid destination folder ID provided.");
        return;
    }
    const cleanNewParentId = newParentId.trim();

    // Fetch current item details to get its current parentId for refresh logic
    let oldParentId = null;
     try {
        const response = await fetch(`/api/doc_items/${itemId}`);
        if (!response.ok) throw new Error('Failed to fetch item details before move.');
        const itemData = await response.json();
        oldParentId = itemData.parentId;
    } catch (fetchError) {
        console.error("Error fetching item details before move:", fetchError);
        showError(`Could not get current item details: ${fetchError.message}`);
        return;
    }

    if (!oldParentId) {
         showError("Could not determine the item's current parent.");
         return; // Or handle root item case if needed
    }


    // TODO: Add loading state
    showSuccess(`Moving item ${itemId} to ${cleanNewParentId}...`);
    showError('');

    // Call the new PUT endpoint for doc_items
    fetch(`/api/doc_items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: cleanNewParentId }) // Only send the parentId field
    })
    .then(async response => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to move item (Status: ${response.status})`);
        }
        return response.json(); // API returns the updated item
    })
    .then(updatedItem => {
        console.log("Item moved successfully:", updatedItem);
        showSuccess(`Item moved successfully.`);

        // Refresh the *old* parent folder view and the tree view
        fetchAndRenderFolderContents(oldParentId); // Refresh where it came from
        renderTreeView(); // Refresh tree (might show item in new place if expanded)

    })
    .catch(error => {
        console.error("Error moving item:", error);
        showError(`Error moving item: ${error.message}`);
        showSuccess('');
    });
}

async function handleDeleteClick(itemId) { // Made async
    console.log("Delete action clicked for item:", itemId);
    if (!itemId) {
        showError("Cannot delete item: ID missing.");
        return;
    }

    // Fetch item details first for confirmation message
    let itemType = 'item';
    let itemName = itemId;
    let parentId = null;
    try {
        const response = await fetchWithAuth(`/api/doc_items/${itemId}`); // Use fetchWithAuth
        if (!response.ok) {
             // If item not found, maybe it was already deleted? Silently ignore or show specific message.
             if (response.status === 404) {
                  console.warn(`Item ${itemId} not found for deletion confirmation.`);
                  showError(`Item not found.`);
                  return;
             }
             throw new Error('Failed to fetch item details for deletion confirmation.');
        }
        const itemData = await response.json();
        itemType = itemData.type || 'item';
        itemName = itemData.name || itemId;
        parentId = itemData.parentId; // Store parentId for refresh
    } catch (fetchError) {
        console.error("Error fetching item details before delete:", fetchError);
        showError(`Could not get item details: ${fetchError.message}`);
        return; // Don't proceed if we can't confirm
    }

     if (!parentId) {
         // This check might be redundant if API prevents root deletion, but good safety measure
         showError("Cannot delete this item (it might be a root item).");
         return;
     }


    const confirmationMessage = itemType === 'folder'
        ? `Are you sure you want to delete the folder '${itemName}' and ALL its contents? This cannot be undone.`
        : `Are you sure you want to delete the ${itemType} '${itemName}'? This cannot be undone.`;

    if (!confirm(confirmationMessage)) {
        return; // User cancelled
    }

    // TODO: Add loading state
    showSuccess(`Deleting ${itemType} '${itemName}'...`);
    showError('');

    // Call the new DELETE endpoint for doc_items
    fetchWithAuth(`/api/doc_items/${itemId}`, { // Use fetchWithAuth
        method: 'DELETE'
        // Headers handled by fetchWithAuth
    })
     .then(async response => {
        // Check for 200 OK or 204 No Content for successful deletion
        if (!response.ok && response.status !== 204) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to delete item (Status: ${response.status})`);
        }
        return null; // No JSON body expected on successful DELETE
    })
    .then(() => {
        console.log("Item deleted successfully:", itemId);
        showSuccess(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} '${itemName}' deleted successfully.`);

        // Refresh the parent folder view and the tree view
        fetchAndRenderFolderContents(parentId); // Refresh the parent folder
        renderTreeView(); // Refresh the tree

    })
    .catch(error => {
        console.error("Error deleting item:", error);
        showError(`Error deleting item: ${error.message}`);
        showSuccess('');
    });
}


// --- Drag and Drop Handlers ---

var draggedItemId = null; // Store the ID of the item being dragged (Using var to avoid redeclaration errors if script loads multiple times)

function handleDragStart(event) {
    // Check if the dragged element is a table row or a tree node LI
    const targetRow = event.target.closest('tr[draggable="true"]');
    const targetTreeNode = event.target.closest('li.tree-node[draggable="true"]');

    if (targetRow) {
        draggedItemId = targetRow.dataset.itemId;
        event.dataTransfer.setData('text/plain', draggedItemId);
        event.dataTransfer.effectAllowed = 'move';
        targetRow.style.opacity = '0.5'; // Visual feedback
        console.log(`[DragDrop] Start dragging item (table): ${draggedItemId}`);
    } else if (targetTreeNode) {
        draggedItemId = targetTreeNode.dataset.itemId;
        event.dataTransfer.setData('text/plain', draggedItemId);
        event.dataTransfer.effectAllowed = 'move';
        targetTreeNode.style.opacity = '0.5'; // Visual feedback
        console.log(`[DragDrop] Start dragging item (tree): ${draggedItemId}`);
    } else {
        // If not dragging a valid item, prevent drag
        event.preventDefault();
    }
}

function handleDragEnter(event) {
    event.preventDefault(); // Necessary to allow dropping
    const targetFolder = event.target.closest('tr[data-item-type="folder"], li.tree-node');
    if (targetFolder) {
        // Don't highlight if dragging over the item being dragged itself
        if (targetFolder.dataset.itemId !== draggedItemId) {
             targetFolder.classList.add('drag-over-target'); // Add highlight class
             console.log(`[DragDrop] Enter potential drop target: ${targetFolder.dataset.itemId}`);
        }
    }
}

function handleDragOver(event) {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = 'move';
}

function handleDragLeave(event) {
    const targetFolder = event.target.closest('tr[data-item-type="folder"], li.tree-node');
     if (targetFolder) {
        targetFolder.classList.remove('drag-over-target'); // Remove highlight class
        console.log(`[DragDrop] Leave potential drop target: ${targetFolder.dataset.itemId}`);
    }
    // Also remove from any other elements if the leave event fires on a child
    const highlighted = event.currentTarget.querySelector('.drag-over-target');
    highlighted?.classList.remove('drag-over-target');
}

async function handleDrop(event) {
    event.preventDefault();
    const targetFolderElement = event.target.closest('tr[data-item-type="folder"], li.tree-node');
    const droppedItemId = event.dataTransfer.getData('text/plain');

    // Reset opacity of the dragged item (find it by ID)
    const draggedElement = document.querySelector(`[data-item-id="${droppedItemId}"][draggable="true"]`);
    if (draggedElement) draggedElement.style.opacity = '1';

    // Remove highlight from target
    targetFolderElement?.classList.remove('drag-over-target');
    const highlighted = event.currentTarget.querySelector('.drag-over-target');
    highlighted?.classList.remove('drag-over-target');

    if (!targetFolderElement) {
        console.log('[DragDrop] Drop occurred outside a valid folder target.');
        draggedItemId = null;
        return;
    }

    const targetFolderId = targetFolderElement.dataset.itemId;

    if (!droppedItemId || !targetFolderId) {
        console.error('[DragDrop] Missing dragged item ID or target folder ID.');
        draggedItemId = null;
        return;
    }

    if (droppedItemId === targetFolderId) {
        console.log('[DragDrop] Dropped item onto itself. No action.');
        draggedItemId = null;
        return;
    }

    console.log(`[DragDrop] Dropped item ${droppedItemId} onto folder ${targetFolderId}`);

    // --- Call Backend API to Move Item ---
    showSuccess(`Moving item...`); // Provide user feedback
    showError('');
    try {
        const response = await fetchWithAuth(`/api/doc_items/${droppedItemId}/move`, { // Use fetchWithAuth
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // Add authentication headers if needed (e.g., CSRF token)
            },
            body: JSON.stringify({ newParentId: targetFolderId })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Move failed (Status: ${response.status})`);
        }

        showSuccess('Item moved successfully!');
        console.log(`[DragDrop] API call successful: Moved ${droppedItemId} to ${targetFolderId}`);

        // --- Refresh UI ---
        // 1. Refresh the current folder view
        await fetchAndRenderFolderContents(currentFolderId);
        // 2. Refresh the entire tree view (simplest approach)
        await renderTreeView();
// --- Sorting/Click Handlers Moved Before setupDocumentsEventListeners ---


        // 3. Optionally, refresh breadcrumbs if the current folder was moved (less common)
        // await renderBreadcrumbs(currentFolderId);

    } catch (error) {
        console.error('[DragDrop] Error moving item via API:', error);
        showError(`Move failed: ${error.message}`);
    } finally {
        draggedItemId = null; // Reset dragged item ID
    }
}

// --- Sorting Handlers ---

function handleSortHeaderClick(newSortBy) {
    if (sortBy === newSortBy) {
        // Toggle direction if clicking the same column
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // Change column, default to ascending
        sortBy = newSortBy;
        sortDirection = 'asc';
    }
    console.log(`New sort state: sortBy=${sortBy}, sortDirection=${sortDirection}`);
    // Re-apply filters and sorting, then re-render
    applyFiltersAndRender();
}

function updateSortIcons() {
    const headers = fileExplorerView?.querySelectorAll('.sortable-header');
    if (!headers) return;

    headers.forEach(header => {
        const iconSpan = header.querySelector('.sort-icon');
        if (!iconSpan) return;

        const columnKey = header.dataset.sort;
        if (columnKey === sortBy) {
            // Apply icon based on direction
            iconSpan.innerHTML = sortDirection === 'asc' ? ' <i class="fas fa-sort-up"></i>' : ' <i class="fas fa-sort-down"></i>';
        } else {
            // Clear icon for non-active columns
            iconSpan.innerHTML = ' <i class="fas fa-sort text-muted"></i>'; // Optional: show neutral sort icon
        }
    });
}

// --- End Sorting Handlers ---



// --- Utility Functions ---
function showError(message) {
    if (!errorMessageDiv) return;
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.toggle('d-none', !message);
}

function showSuccess(message) {
     if (!successMessageDiv) return;
     successMessageDiv.textContent = message;
     successMessageDiv.classList.toggle('d-none', !message);
     // Optional: Auto-hide success message after a delay
     if (message) {
         setTimeout(() => {
             if (successMessageDiv.textContent === message) { // Avoid hiding newer messages
                 showSuccess('');
             }
         }, 4000);
     }
}

// --- REMOVED Old/Unused Functions ---
// Removed handleDocumentUpload
// Removed handleAddLink
// Removed populateDocumentList
// Removed handleDocumentClick
// Removed showUploadStatus
// Removed showAddLinkStatus