# Plan: Combined Tree View (Frontend Implementation)

This plan outlines the steps to implement a "Combined Tree View" on the Documents page, allowing users to browse all facility folders when "-- All Facilities --" is selected. This approach focuses on frontend changes, utilizing the existing `/api/facilities` endpoint.

## Rationale

*   Leverages the existing API endpoint (`/api/facilities`) which already returns filesystem data for all facilities.
*   Avoids immediate backend changes, simplifying initial implementation.
*   Allows for iterative development; backend optimization can be done later if performance becomes an issue.

## Implementation Steps (Frontend - `js/documents.js`)

1.  **State Management:**
    *   Add state variables:
        *   `let isAllFacilitiesMode = false;`
        *   `let allFacilitiesData = null;` (to store the full `features` array from `/api/facilities`)

2.  **Data Fetching (`handleFacilitySelection`):**
    *   Check if `event.target.value === 'ALL'`.
    *   If `'ALL'`:
        *   Fetch data from `/api/facilities`.
        *   Store the response `features` array in `allFacilitiesData`.
        *   Set `isAllFacilitiesMode = true`.
        *   Clear `currentSelectedFacilityId`, `currentFacilityName`, `currentFilesystemData`, `currentFolderId`.
        *   Call `renderCombinedTreeView()` (or adapted `renderTreeView`).
        *   Update UI elements (e.g., clear breadcrumbs, show placeholder in main view).
    *   If not `'ALL'`:
        *   Use existing logic to fetch single facility data (`/api/facilities/:id`).
        *   Store result in `currentFilesystemData`.
        *   Set `isAllFacilitiesMode = false`.
        *   Clear `allFacilitiesData`.
        *   Call `renderTreeView()` (existing logic).

3.  **Tree Rendering (`renderTreeView` or new `renderCombinedTreeView`):**
    *   Add a check for `isAllFacilitiesMode` at the beginning.
    *   **If `isAllFacilitiesMode` is `true`:**
        *   Clear the tree container (`folderTreeView`).
        *   Create a root `<ul>`.
        *   Iterate through `allFacilitiesData` (the `features` array).
        *   For each `facilityFeature`:
            *   Create a top-level `<li>` for the facility (e.g., using `facilityFeature.properties.name`). Make this clickable, perhaps storing `facilityFeature.properties.id` in a data attribute.
            *   Determine the `rootFolderId` for this facility (e.g., `root-${facilityFeature.properties.id}`).
            *   Call `buildTreeHtmlRecursive` using `facilityFeature.properties.filesystem` and the `rootFolderId`.
            *   Append the result (the facility's folder tree) under the facility `<li>`.
        *   Append the root `<ul>` (containing all facility trees) to the container.
    *   **If `isAllFacilitiesMode` is `false`:**
        *   Execute the existing `renderTreeView` logic using `currentFilesystemData`.

4.  **Navigation & Display Updates:**
    *   **`handleFolderClick` / `handleTreeViewClick`:**
        *   Need to determine the correct filesystem data source (either `currentFilesystemData` or the specific facility's data within `allFacilitiesData`) based on `isAllFacilitiesMode` and the clicked `folderId`.
        *   Update `currentFolderId` and potentially `currentSelectedFacilityId` if clicking a top-level facility node in combined view.
        *   Call `renderFolderContents` with the correct filesystem context.
        *   Call `renderBreadcrumbs` with the correct context.
        *   Call `renderTreeView/renderCombinedTreeView` to update highlighting.
    *   **`renderBreadcrumbs`:**
        *   If `isAllFacilitiesMode` is `true`, the breadcrumb path needs to potentially include the Facility name as the first step after "Home".
    *   **`renderFolderContents`:**
        *   If `isAllFacilitiesMode` is `true` and `currentFolderId` is null (or points to a facility root), display a message like "Select a folder from the tree." instead of "This folder is empty." or the file table.

## Future Considerations

*   If loading all facility data proves slow, create a new backend endpoint that returns only the necessary structure (names, IDs, parent/child relationships) without full file details initially.
*   Add expand/collapse functionality to the tree view for better usability with many facilities/folders.