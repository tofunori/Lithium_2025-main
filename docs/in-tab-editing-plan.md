# Implementation Plan: In-Tab Facility Editing

**Goal:** Refactor the facility editing functionality from a popup modal (`EditFacilityForm.jsx`) to allow direct editing within the respective tabs of the `FacilityDetailPage.jsx`.

**1. High-Level Architecture:**

*   **State Management:** Lift the form data state (`formData`) and edit mode state (`isEditing`) from `EditFacilityForm` up to `FacilityDetailPage`. Introduce a new state variable, `editingTabKey`, to track which tab (if any) is currently being edited.
*   **Component Responsibility:**
    *   `FacilityDetailPage`: Manages overall page state (facility data, active tab, editing tab, temporary edit data), fetches/updates data, and conditionally renders either view components or form components within each tab based on the `editingTabKey`.
    *   `EditFacilityForm` (Refactored or Replaced): Will be broken down. Its fieldsets/sections will be extracted into smaller, potentially reusable components corresponding to data sections (e.g., `BasicInfoFormSection`, `TechnicalFormSection`, `TimelineFormSection`). These section components will receive relevant data slices and update handlers from `FacilityDetailPage`.
*   **Data Flow:**
    1.  User clicks "Edit" within a specific tab.
    2.  `FacilityDetailPage` sets `editingTabKey` to the active tab's key and copies the current `facility` data into a new `editFormData` state.
    3.  The active tab re-renders, now showing the corresponding Form Section component(s) populated with `editFormData`.
    4.  User modifies data, triggering `handleChange` functions passed down from `FacilityDetailPage`, updating the `editFormData` state.
    5.  User clicks "Save": `FacilityDetailPage` calls `updateFacility` with `editFormData`, re-fetches data into `facility`, resets `editingTabKey` to `null`, and potentially clears `editFormData`.
    6.  User clicks "Cancel": `FacilityDetailPage` resets `editingTabKey` to `null` and discards `editFormData`.

**Mermaid Diagram (Conceptual):**

```mermaid
graph TD
    subgraph FacilityDetailPage
        A[facility state (view data)] --> C{Render Logic};
        B[editFormData state (temp edit data)] --> C;
        E[editingTabKey state] --> C;
        F[activeTab state] --> C;

        C -- Renders based on activeTab & editingTabKey --> G[Tab Navigation];
        C -- Renders based on activeTab & editingTabKey --> H{Tab Content};

        subgraph Tab Content Area
            H -- If editingTabKey == activeTab --> I[Form Section Component(s)];
            H -- Else --> J[View Section Component(s)];
            I -- onChange --> K[Update editFormData];
            I -- onSave --> L[Call handleSave];
            I -- onCancel --> M[Call handleCancel];
        end

        K -- Updates --> B;
        L -- Updates --> A;
        L -- Resets --> E;
        M -- Resets --> E;

        N[handleSave (calls updateFacility, fetches data)] --> A;
        O[handleCancel (resets state)] --> E;
        P[handleEditClick (sets editingTabKey, copies data)] --> E;
        P --> B;

        J -- Displays data from --> A;
        I -- Populated by --> B;
    end

    style I fill:#f9f,stroke:#333,stroke-width:2px
    style J fill:#ccf,stroke:#333,stroke-width:2px
```

**2. Specific File Changes:**

*   **`frontend/src/pages/FacilityDetailPage.jsx`:**
    *   **State:**
        *   Remove `showEditModal` state.
        *   Add `editingTabKey` state (e.g., `useState(null)`).
        *   Add `editFormData` state (e.g., `useState(null)`).
    *   **Functions:**
        *   Modify `handleEditClick`: Instead of setting `showEditModal`, it should:
            *   Set `editingTabKey` to the `activeTab`.
            *   Initialize `editFormData` by deep-copying the relevant parts of the current `facility` state.
        *   Modify `handleSaveSuccess` (rename to `handleSave` or similar):
            *   Take `editFormData` as input (or access it from state).
            *   Call `updateFacility(id, editFormData)`.
            *   Re-fetch facility data into `facility` state.
            *   Reset `editingTabKey` to `null`.
            *   Clear `editFormData` (or set to `null`).
            *   Remove the `setShowEditModal(false)` call.
        *   Modify `handleCancelEdit` (rename to `handleCancel` or similar):
            *   Reset `editingTabKey` to `null`.
            *   Clear `editFormData`.
            *   Remove the `setShowEditModal(false)` call.
        *   Add `handleFormChange` function: This function will be passed down to form section components to update the `editFormData` state. It should handle nested state updates carefully.
        *   Add handlers for array manipulations (add/remove items for timeline, documents etc.) similar to those in the original `EditFacilityForm`, but operating on the `editFormData` state.
    *   **Rendering:**
        *   Remove the main "Edit" button near the "Back" button.
        *   Inside each tab's content rendering block (e.g., `{activeTab === 'overview' && (...) }`):
            *   Conditionally render based on `editingTabKey === tab.key`.
            *   If editing: Render the corresponding Form Section component(s) (e.g., `<OverviewFormSection data={editFormData} onChange={handleFormChange} />`). Also render "Save" and "Cancel" buttons within this tab, calling `handleSave` and `handleCancel`.
            *   If not editing: Render the current view components/elements. Add an "Edit" button specific to this tab, calling `handleEditClick`.
        *   Disable tab switching (`onClick` on tab buttons) if `editingTabKey` is not null, or implement a confirmation dialog for unsaved changes. Disabling is simpler initially.
        *   Remove the `<EditFacilityForm ... />` modal rendering at the bottom.

*   **`frontend/src/components/EditFacilityForm.jsx`:**
    *   **Refactor/Remove:** This component will likely be removed or heavily refactored.
    *   **Extract Sections:** Create new components for logical form sections (e.g., `BasicInfoFormSection.jsx`, `TechnicalFormSection.jsx`, `TimelineFormSection.jsx`, `MediaFormSection.jsx` containing `ImageUploader`, etc.).
    *   **Props:** These new section components will receive props like:
        *   `data`: The relevant slice of `editFormData`.
        *   `onChange`: The `handleFormChange` function from `FacilityDetailPage`.
        *   `onAddItem`, `onRemoveItem` (for array sections like Timeline).
        *   `isEditing`: A boolean (derived from `editingTabKey` in the parent) to control field enablement if needed (though rendering the whole section conditionally might be simpler).
    *   **No Internal State:** These components should generally not hold their own form data state; they operate on the state passed down from `FacilityDetailPage`.

*   **New Form Section Components (Examples):**
    *   `frontend/src/components/formSections/BasicInfoFormSection.jsx`: Contains inputs for Name, Company, Location, Status.
    *   `frontend/src/components/formSections/TechnicalFormSection.jsx`: Contains inputs for Capacity, Technology, Feedstock, Product, Specs.
    *   `frontend/src/components/formSections/TimelineFormSection.jsx`: Renders inputs for timeline events, handles adding/removing items via props.
    *   `frontend/src/components/formSections/MediaFormSection.jsx`: Includes the `<ImageUploader />` component, passing necessary props (`existingImages` from `editFormData`, `onUploadComplete` handler linked to `handleFormChange`).
    *   *(Create similar components for Documents, Environmental, Investment, Contact)*

*   **`frontend/src/components/ImageUploader.jsx`:**
    *   No major changes likely needed, as it already accepts `existingImages` and calls `onUploadComplete`. Ensure it's integrated correctly into the `MediaFormSection`.

**3. New State Management Requirements:**

*   `editingTabKey: string | null`: Stores the `key` of the tab currently being edited, or `null` if no tab is in edit mode.
*   `editFormData: object | null`: Stores a temporary copy of the facility data being modified. Initialized when editing starts, updated on changes, cleared on save/cancel.

**4. UI/UX Considerations:**

*   **Clear Edit State:** Visually indicate which tab is being edited (e.g., different tab style, clear "Editing Mode" label within the tab).
*   **Edit/Save/Cancel Placement:** Place the "Edit" button within each tab's view mode. Place "Save" and "Cancel" buttons prominently within the tab's edit mode content area.
*   **Preventing Data Loss:** Disable navigation to other tabs while a tab is being edited *or* implement a robust "unsaved changes" confirmation dialog if the user tries to switch tabs or navigate away. Disabling is the simpler first step.
*   **Feedback:** Provide clear visual feedback during saving (loading indicators) and on success/error (toasts or messages).
*   **Consistency:** Ensure the look and feel of form fields match the rest of the application.

**5. Potential Challenges & Mitigation:**

*   **State Management Complexity:** Lifting state (`editFormData`) can make `FacilityDetailPage` large. Keep handlers well-organized. Consider useReducer if state logic becomes very complex.
*   **Prop Drilling:** Passing `editFormData` and handlers down to nested form sections. Ensure props are passed correctly. Context API could be an alternative if nesting becomes very deep, but might be overkill initially.
*   **Deep Copying:** Ensure `editFormData` is initialized with a deep copy of `facility` data to avoid accidental mutation of the original state. Use a utility like `JSON.parse(JSON.stringify(data))` or a library function.
*   **Form Section Granularity:** Deciding how to split `EditFacilityForm` requires judgment. Aim for logical groupings based on the tabs.
*   **Validation:** Ensure validation logic (currently basic in `EditFacilityForm`) is applied correctly before `handleSave` is executed in `FacilityDetailPage`. Validation could occur within `handleSave` or potentially within the section components with errors surfaced appropriately.
*   **Array/Complex Field Handling:** Implementing the UI and state updates for arrays (Timeline, Documents) and potentially nested objects requires careful implementation in the respective form section components and the `handleFormChange` logic.