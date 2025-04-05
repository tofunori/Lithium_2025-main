# Plan: Add Tree View to Documents Page

This document outlines the plan to add a file explorer tree view to the `documents.html` page for improved navigation.

## Current Situation

*   **Data Loading:** The entire file/folder structure for a selected facility is fetched and stored client-side in `currentFilesystemData`.
*   **Navigation:** Currently uses breadcrumbs and clicking items in the main table view.
*   **Layout:** Single main content area for breadcrumbs and file table.

## Rationale for Tree View

*   Provides a persistent overview of the folder hierarchy.
*   Allows quick navigation between different folders.
*   Leverages existing client-side data (`currentFilesystemData`), making it feasible without extra server calls.

## Proposed Plan

### 1. Modify HTML (`documents.html`)

*   Restructure the `#documentManagementSection` using Bootstrap's grid system (e.g., `row` with `col-md-3` for the tree and `col-md-9` for the main content).
*   Add a dedicated container for the tree view: `<div id="folderTreeView" class="col-md-3"></div>`.
*   Move the existing breadcrumbs (`#breadcrumbNav`), file explorer card (`#fileExplorerView`), and action buttons (`#newFolderButton`, etc.) into the right column (`<div class="col-md-9">...</div>`).

### 2. Modify JavaScript (`js/documents.js`)

*   **Create `renderTreeView(filesystemData, rootFolderId, containerElement)` function:**
    *   Recursively traverses `filesystemData` from the `rootFolderId`.
    *   Generates nested HTML (`ul`/`li`) for the tree structure.
    *   Include expand/collapse functionality.
    *   Folder items (`li`) should have a clickable element storing the `folderId`.
*   **Call `renderTreeView`:** In `handleFacilitySelection`, after fetching `currentFilesystemData`, call `renderTreeView` to populate `#folderTreeView`.
*   **Add Tree Click Event Listener:** Use event delegation on `#folderTreeView`. On folder click:
    *   Prevent default behavior.
    *   Get the `folderId`.
    *   Call `handleFolderClick(folderId)` to update the main view and breadcrumbs.
*   **Update Active State:** Modify `handleFolderClick` and/or `renderTreeView` to:
    *   Visually highlight the currently selected folder in the tree.
    *   Ensure the selected node is visible (expanded).
*   **Initial State:** Clear/hide the tree view when no facility is selected.

### 3. Modify CSS (`css/styles.css`)

*   Add styles for:
    *   Tree indentation.
    *   Folder icons (consider expanded/collapsed states).
    *   Highlighting the active/selected folder.
    *   Hover effects, spacing, etc.

## Visual Layout Idea

```mermaid
graph LR
    subgraph documents.html
        direction LR
        subgraph LeftColumn [col-md-3]
            TreeView(Folder Tree View<br/>- Expand/Collapse<br/>- Click to Navigate)
        end
        subgraph RightColumn [col-md-9]
            Breadcrumbs --> MainView(File/Folder Table<br/>- Shows content of selected folder)
            ActionButtons(New Folder / Upload / Add Link) --> MainView
        end
    end

    style LeftColumn fill:#f9f,stroke:#333,stroke-width:2px
    style RightColumn fill:#ccf,stroke:#333,stroke-width:2px