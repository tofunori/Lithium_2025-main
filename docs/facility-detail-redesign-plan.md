# Facility Detail Page Redesign Plan

**Date:** 2025-04-17

**Goal:** Redesign the individual facility detail page (`frontend/src/pages/FacilityDetailPage.tsx`) to improve information layout and user experience.

**Chosen Approach:**
*   Replace the current tabbed interface with a **Multi-Column Layout** (responsive, stacking vertically on mobile).
*   Implement **In-Page Editing** functionality, allowing users to edit content directly within the page layout without navigating away or using modals.

## Layout Details

*   Use CSS Grid or Flexbox to create a two-column layout for wider screens.
*   Define responsive breakpoints where the layout collapses to a single column for mobile devices.
*   Arrange content sections logically within the columns. Example distribution:
    *   **Column 1 (Primary):** Basic Info (Name, Company, Location, Status, Website, Coordinates), Contact Info, Investment Info, Notes.
    *   **Column 2 (Secondary):** Technical Details (Capacity, Technology, Feedstock, Product, Description), Timeline (rendered as a table), Documents (rendered as a table), Media (gallery), Environmental Impact.

## Editing Flow

1.  An "Edit" button will be displayed on the page (visible only to authenticated users when not already in edit mode).
2.  Clicking "Edit" transitions the page into an `isEditing` state.
3.  In `isEditing` state:
    *   The "Edit" button is hidden.
    *   "Save" and "Cancel" buttons become visible.
    *   Display sections are replaced by their corresponding form input components (e.g., `<BasicInfoFormSection>`, `<TechnicalFormSection>`) within the multi-column layout. Existing form section components will be reused.
    *   Form sections are populated with the current facility data (`editFormData`).
4.  User makes changes, updating the `editFormData` state via existing `onChange` handlers.
5.  Clicking "Cancel" reverts the `isEditing` state to `false` and discards changes in `editFormData`.
6.  Clicking "Save" triggers the `handleSave` function (which calls `supabaseDataService.updateFacility`), updates the facility data, and reverts the `isEditing` state to `false` upon success.

## Implementation Steps

1.  **Refactor `FacilityDetailPage.tsx` Layout:**
    *   Remove the existing tab structure (`<Nav>`, `renderTabContent` switch logic).
    *   Implement the multi-column layout using CSS (e.g., in `FacilityDetailPage.css` or via styled components/utility classes).
    *   Rearrange the rendering logic to place display components within the appropriate columns.
2.  **Implement Editing State:**
    *   Add an `isEditing` state variable (boolean) to `FacilityDetailPage.tsx`.
    *   Add the "Edit", "Save", and "Cancel" buttons, controlling their visibility based on `isEditing` state and user authentication.
3.  **Conditional Rendering:**
    *   Update the component's JSX to conditionally render either the display version of a section or its corresponding form section component based on the `isEditing` state.
4.  **Adapt Handlers:**
    *   Ensure `handleEdit`, `handleSave`, and `handleCancel` correctly manage the `isEditing` state alongside the `editFormData` state. Existing form change handlers (`handleFormChange`, `handleTimelineChange`, etc.) should require minimal changes.
5.  **Data Fetching:** No changes expected to the initial data fetching logic (`useEffect` calling `getFacilityById`).
6.  **Memory Bank Update:** Document the chosen design (multi-column, in-page editing) and the rationale in `memory-bank/decisionLog.md`. Update `memory-bank/activeContext.md` to reflect the task focus.

## Visual Plan (Mermaid Diagram)

```mermaid
graph TD
    subgraph FacilityDetailPage.tsx (Redesigned)
        A[Component Load] --> B{Fetch Facility Data};
        B -- Data --> C{Render Page Layout};
        C --> L[Multi-Column Layout (Desktop)];
        L --> L1[Column 1: Core Info, Contact, etc.];
        L --> L2[Column 2: Tech, Timeline(Table), Docs(Table), Media, etc.];
        C --> M[Single-Column Layout (Mobile)];
        M --> M1[Stacked Sections];

        subgraph Editing Flow (In-Page)
            P[Display Mode] -->|Click 'Edit' Button| E[Edit Mode];
            E -->|Click 'Cancel' Button| P;
            E -->|Click 'Save' Button| S{Save Changes};
            S -- Success --> P;
            S -- Error --> E;

            E -- Renders --> F1[Form Section 1 (in Column 1/Stacked)];
            E -- Renders --> F2[Form Section 2 (in Column 2/Stacked)];
            F1 & F2 -- User Input --> H[Update editFormData State];
            S -- Uses --> H;
            S -- Calls --> BE(supabaseDataService.updateFacility);
        end

        P -- Renders --> D1[Display Section 1 (in Column 1/Stacked)];
        P -- Renders --> D2[Display Section 2 (in Column 2/Stacked)];

    end

    subgraph Backend/Service
        B --> BE1(supabaseDataService.getFacilityById);
        BE;
        BE1;
    end

    style BE fill:#f9f,stroke:#333,stroke-width:2px
    style BE1 fill:#f9f,stroke:#333,stroke-width:2px
```

## Next Steps

*   Switch to **Code Mode** to implement the changes in `frontend/src/pages/FacilityDetailPage.tsx` and associated CSS.
*   Update Memory Bank files (`decisionLog.md`, `activeContext.md`).