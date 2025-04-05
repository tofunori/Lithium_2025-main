# Plan: Dynamic Facility Page Generation

**Goal:** Automatically create/update the specific HTML page for a facility whenever that facility is added or potentially modified, ensuring the page reflects the data stored in Firestore.

**Problem:** The current system requires manual page generation using `generate_facility_pages.html`, which reads from an outdated `js/facilityData.js` file and produces download links, not saved files. This doesn't automatically reflect new facilities added via the form to Firestore.

**Proposed Solution:** Implement dynamic page generation on the server-side.

**Architecture:**

```mermaid
graph LR
    subgraph User Action
        A[User uses new-facility.html form] --> B(POST /api/facilities);
        G[User clicks link/navigates to /facilities/some-id.html] --> H(GET /facilities/:id.html);
    end

    subgraph Backend API (api/index.js)
        B --> C{Handle POST /api/facilities};
        C --> D[Write to Firestore 'facilities' collection];

        H --> I{Handle GET /facilities/:id.html};
        I -- Fetches data for 'some-id' --> E((Firestore));
        E -- Returns facility data --> I;
        I -- Uses data + Template Logic --> J[Generate HTML String];
        J -- Sends HTML response --> G;
    end

    subgraph Server-Side Logic
        K[page-generator.js Utility Module];
        I --> K;
    end

    subgraph Data Stores
        D --> E;
    end

    subgraph Obsolete Items
        L(generate_facility_pages.html);
        M(js/facilityData.js);
        N(Static files in /facilities/*);
    end
    style L fill:#f99,stroke:#333,stroke-width:1px,color:#fff
    style M fill:#f99,stroke:#333,stroke-width:1px,color:#fff
    style N fill:#f99,stroke:#333,stroke-width:1px,color:#fff

```

**Implementation Steps:**

1.  **Refactor Generation Logic:**
    *   Create `api/page-generator.js`.
    *   Move HTML generation functions (`generateFacilityPageHTML`, helpers) from `generate_facility_pages.html` into this module.
    *   Adapt functions to accept Firestore data and query Firestore for related data if needed.
2.  **Modify `api/index.js`:**
    *   Simplify `POST /api/facilities` to only write to Firestore.
    *   Add a new route `GET /facilities/:id.html`.
    *   This route handler will:
        *   Fetch facility data from Firestore based on `:id`.
        *   Call the `page-generator.js` module to generate HTML.
        *   Send the HTML string as the response.
        *   Handle 404 if facility not found.
3.  **Update Frontend Links:** Change links to point to the dynamic path `/facilities/<facility-id>.html`.
4.  **Cleanup:** Remove `generate_facility_pages.html`, `js/facilityData.js`, and optionally static files in `facilities/`.

**Advantages:**
*   Pages always show live Firestore data.
*   Fully automatic upon request.
*   Serverless-friendly (no filesystem writes at runtime).
*   Firestore is the single source of truth.