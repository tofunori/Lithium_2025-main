# Database Schema and Code Refactoring Plan

**Date:** 2025-04-18

**Goal:** Refactor the database schema to store detailed facility information in related tables, improving normalization and scalability. Update the data service and frontend component accordingly.

## Phase 1: Database Schema Design

**Approach:** Keep the main `facilities` table for core identifying information used in lists/maps. Create new related tables for specific details and one-to-many relationships.

**Table Definitions:**

1.  **`facilities` (Existing, Slimmed Down)**
    *   `ID` (uuid, Primary Key)
    *   `Company` (text)
    *   `Facility Name/Site` (text)
    *   `Location` (text)
    *   `Operational Status` (text)
    *   `Primary Recycling Technology` (text)
    *   `technology_category` (text)
    *   `Latitude` (numeric or float8)
    *   `Longitude` (numeric or float8)
    *   `capacity_tonnes_per_year` (numeric)
    *   `created_at` (timestamptz)
    *   *(Potentially remove columns moved to `facility_details` like `website`, `feedstock`, `product`, `investment_usd`, `jobs`, `ev_equivalent_per_year`, `"Key Sources/Notes"`)*

2.  **`facility_details` (New Table - One-to-One)**
    *   `facility_id` (uuid, Primary Key, Foreign Key referencing `facilities.ID` ON DELETE CASCADE)
    *   `technology_description` (text, nullable)
    *   `notes` (text, nullable) - *Migrated from `facilities."Key Sources/Notes"`*
    *   `website` (text, nullable) - *Migrated from `facilities`*
    *   `feedstock` (text, nullable) - *Migrated from `facilities`*
    *   `product` (text, nullable) - *Migrated from `facilities`*
    *   `investment_usd` (numeric, nullable) - *Migrated from `facilities`*
    *   `jobs` (numeric, nullable) - *Migrated from `facilities`*
    *   `ev_equivalent_per_year` (numeric, nullable) - *Migrated from `facilities`*
    *   `environmental_impact_details` (text, nullable)
    *   `status_effective_date_text` (text, nullable)

3.  **`facility_timeline_events` (New Table - One-to-Many)**
    *   `id` (uuid, Primary Key, default: `gen_random_uuid()`)
    *   `facility_id` (uuid, Foreign Key referencing `facilities.ID` ON DELETE CASCADE)
    *   `event_date` (date or timestamptz, nullable)
    *   `event_name` (text, nullable)
    *   `description` (text, nullable)

4.  **`facility_documents` (New Table - One-to-Many)**
    *   `id` (uuid, Primary Key, default: `gen_random_uuid()`)
    *   `facility_id` (uuid, Foreign Key referencing `facilities.ID` ON DELETE CASCADE)
    *   `title` (text, nullable)
    *   `url` (text, nullable) - *Stores the file path within Supabase Storage bucket.*

5.  **`facility_images` (New Table - One-to-Many)**
    *   `id` (uuid, Primary Key, default: `gen_random_uuid()`)
    *   `facility_id` (uuid, Foreign Key referencing `facilities.ID` ON DELETE CASCADE)
    *   `image_url` (text, nullable) - *Stores the file path within Supabase Storage bucket.*
    *   `alt_text` (text, nullable)
    *   `order` (integer, nullable)

**Visual Schema (Mermaid):**

```mermaid
erDiagram
    facilities ||--o{ facility_details : has
    facilities ||--o{ facility_timeline_events : has
    facilities ||--o{ facility_documents : has
    facilities ||--o{ facility_images : has

    facilities {
        uuid ID PK
        text Company
        text "Facility Name/Site"
        text Location
        text "Operational Status"
        text "Primary Recycling Technology"
        text technology_category
        float8 Latitude
        float8 Longitude
        numeric capacity_tonnes_per_year
        timestamptz created_at
    }

    facility_details {
        uuid facility_id PK FK "references facilities(ID)"
        text technology_description
        text notes
        text website
        text feedstock
        text product
        numeric investment_usd
        numeric jobs
        numeric ev_equivalent_per_year
        text environmental_impact_details
        text status_effective_date_text
    }

    facility_timeline_events {
        uuid id PK
        uuid facility_id FK "references facilities(ID)"
        date event_date
        text event_name
        text description
    }

    facility_documents {
        uuid id PK
        uuid facility_id FK "references facilities(ID)"
        text title
        text url "Storage Path"
    }

    facility_images {
        uuid id PK
        uuid facility_id FK "references facilities(ID)"
        text image_url "Storage Path"
        text alt_text
        int order
    }
```

**Decisions:**
*   Store image/document URLs as paths within the Supabase Storage bucket.
*   Plan for a separate data migration step to move existing data (e.g., Notes) from the `facilities` table to `facility_details`.

## Phase 2: Code Refactoring Plan

**A. `supabaseDataService.ts` Refactoring:**

1.  **Update Interfaces:** Modify `Facility`, `FacilityFormData`. Define `FacilityDetails`, `FacilityTimelineEvent`, `FacilityDocument`, `FacilityImage`. Consider nested structure for `FacilityFormData`.
2.  **Refactor `getFacilityById`:** Use Supabase `.select()` with relation syntax (e.g., `*, facility_details(*), facility_timeline_events(*)`) to fetch related data efficiently. Combine into a single object for the frontend.
3.  **Refactor `addFacility`:** Insert into `facilities`, then `facility_details`, then loop to insert into related one-to-many tables (`facility_timeline_events`, etc.).
4.  **Refactor `updateFacility`:** Update `facilities` table. Use `upsert` for `facility_details`. Handle complex updates for one-to-many lists (e.g., delete existing and re-insert, or diffing).
5.  **Helper Functions:** Ensure functions exist to generate public URLs from stored paths.

**B. `FacilityDetailPage.tsx` Refactoring:**

1.  **State Management:** Update types for `facility` and `editFormData` state to match the new (likely nested) data structure.
2.  **Data Preparation (`prepareFormData`):** Adjust mapping to handle the new data structure.
3.  **Display Logic:** Update JSX to access data from nested objects (e.g., `facility.details.notes`).
4.  **Form Sections:** Update props passed to form sections. Ensure input `name` attributes match the nested structure (e.g., `details.notes`) or use specific handlers. Update list-based sections (Timeline, Documents, Media) as needed.

**C. Form Section Components (`/components/formSections/`) Refactoring:**

*   Minor adjustments to accept potentially nested data structures via props and ensure input `name` attributes are correct.

## Implementation Order Suggestion:

1.  **Database:** Create tables/relationships in Supabase. (Manual Step)
2.  **Data Migration:** Move existing data. (Manual/Scripted Step)
3.  **Service Layer (`supabaseDataService.ts`):** Refactor interfaces and functions.
4.  **Frontend Page (`FacilityDetailPage.tsx`):** Refactor state, data prep, display, props.
5.  **Frontend Form Sections:** Adjust components.

## Next Steps

*   User creates the new tables and relationships in Supabase.
*   User performs data migration (if applicable).
*   Switch to **Code Mode** to implement the refactoring in `supabaseDataService.ts` and `FacilityDetailPage.tsx`.