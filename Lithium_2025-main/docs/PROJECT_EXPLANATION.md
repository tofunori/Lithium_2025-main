# Lithium Recycling Dashboard: Project Explanation

## 1. Introduction

This document provides a detailed explanation of the Lithium Recycling Dashboard project. The project aims to create an interactive web application displaying information about lithium battery recycling facilities across North America. It includes features like an interactive map, detailed facility pages, data visualizations (charts), document management per facility, and administrative capabilities for managing facility data.

## 2. Architecture Overview

The project follows a modern web application architecture, separating frontend and backend concerns, and leveraging cloud services for database and file storage.

```mermaid
graph LR
    A[User's Browser (Frontend)] <--> B(Vercel Hosting);
    B -- Serves Static Files --> A;
    A -- API Requests --> C{Backend API (Node.js/Express on Vercel)};
    C -- CRUD Operations --> D[Firebase Firestore (Database)];
    C -- File Operations --> E[Firebase Storage (Files)];
    B -- Runs --> C;

    subgraph Vercel Cloud
        B
        C
    end

    subgraph Firebase Cloud
        D
        E
    end

    style Vercel Cloud fill:#e6f7ff,stroke:#b3e0ff
    style Firebase Cloud fill:#fff0e6,stroke:#ffd9b3
```

*   **Frontend:** User interface built with HTML, CSS, and JavaScript, running in the user's browser.
*   **Backend API:** A Node.js application using the Express framework, responsible for handling data requests, business logic, and interacting with Firebase.
*   **Firebase:** Google's Backend-as-a-Service platform used for:
    *   **Firestore:** A NoSQL document database storing facility information and document metadata.
    *   **Cloud Storage:** Storing uploaded files (documents, images, etc.).
*   **Vercel:** A cloud platform used for deploying and hosting both the frontend static assets and the backend serverless functions.

## 3. Frontend

The frontend is responsible for presenting the user interface and interacting with the backend API.

*   **Technology:** Standard HTML5, CSS3 (likely using Bootstrap based on class names like `btn`, `text-center`), and JavaScript (ES6+).
*   **Structure:**
    *   **HTML Pages:** Core views like `index.html` (Dashboard), `facilities.html` (List/Map View), `charts.html`, `documents.html`, `login.html`, `new-facility.html`, `edit-facility.html`.
    *   **CSS:** Styling defined in `css/styles.css`.
    *   **JavaScript (`js/`):**
        *   `common.js`: Handles core functionalities shared across pages:
            *   **SPA Routing:** Implements Single Page Application behavior. Instead of full page reloads, it fetches new page content using the `fetch` API and updates the DOM dynamically. It uses the `history.pushState` and `popstate` events to manage browser history and URL changes.
            *   **Header/Footer Loading:** Dynamically loads `includes/_header.html` and `includes/_footer.html` into placeholders.
            *   **Authentication Management:** Checks for a JSON Web Token (JWT) in `localStorage` (`authToken`) to determine login status, updates the UI accordingly (showing login/logout buttons), and handles the logout process by removing the token.
            *   **Theme Switching:** Allows users to toggle between light and dark themes, storing the preference in `localStorage`.
        *   **Page-Specific Scripts:** Files like `dashboard.js`, `facilities-page.js`, `charts-page.js`, `documents.js`, `edit-facility.js`, `facility-detail.js` contain logic specific to their respective pages/views. These are loaded dynamically by the SPA router in `common.js`.
*   **Functionality:**
    *   Displays facility data on maps and lists.
    *   Shows detailed information for individual facilities (HTML for these pages is generated server-side but displayed within the SPA).
    *   Presents data visualizations using Chart.js (loaded dynamically on the charts page).
    *   Allows administrators to log in (`login.html`).
    *   Provides forms for creating (`new-facility.html`) and editing (`edit-facility.html`) facility data.
    *   Manages a virtual filesystem for documents associated with each facility (`documents.html`), allowing uploads, folder creation, and link addition.
    *   Sends requests to the backend API to fetch data and perform actions (create, update, delete). Adds the JWT to authorization headers for protected actions.

## 4. Backend (API)

The backend acts as the intermediary between the frontend and the Firebase services.

*   **Technology:** Node.js runtime with the Express.js web framework.
*   **Location:** Code resides primarily in `api/index.js`. When deployed to Vercel, this likely runs as a Serverless Function, meaning Vercel manages the server infrastructure, scaling, etc.
*   **Firebase Integration:** Uses the `firebase-admin` SDK, which provides privileged access to Firebase services (Firestore, Storage). It initializes using service account credentials stored securely (ideally as environment variables on Vercel).
*   **Key Endpoints & Functionality:**
    *   **Static Files:** Serves the frontend HTML, CSS, and JS files.
    *   **`POST /api/login`:** Receives admin username/password. If valid (checked against environment variables), generates a JWT using the `jsonwebtoken` library and sends it back to the frontend.
    *   **`GET /api/facilities`:** Fetches all facility data from the `facilities` collection in Firestore and returns it (likely in GeoJSON format for map display).
    *   **`GET /api/facilities/:id`:** Fetches data for a single facility from Firestore.
    *   **`POST /api/facilities`:** (Authenticated) Creates a new facility document in the Firestore `facilities` collection. Initializes a basic filesystem structure within the facility data.
    *   **`PUT /api/facilities/:id`:** (Authenticated) Updates properties of an existing facility document in Firestore.
    *   **`DELETE /api/facilities/:id`:** (Authenticated) Deletes a facility document from Firestore. (Note: Currently has a TODO to delete associated files/items).
    *   **`GET /facilities/:id.html`:** *Dynamically generates* the HTML content for a specific facility's detail page. It fetches the required data from Firestore (including related facilities) and uses the `api/page-generator.js` module to construct the HTML response on the fly.
    *   **`POST /api/facilities/:id/files`:** (Authenticated) Handles file uploads using `multer`. It streams the uploaded file directly to Firebase Storage under a path like `[facilityId]/files/[uuid]-[filename]` or `uncategorized/...`. It does *not* create the Firestore metadata record itself but returns the necessary information (like `storagePath`) to the frontend.
    *   **`/api/doc_items` (Multiple Methods - GET, POST, PUT, DELETE):** (Authenticated) Manages the metadata for the virtual filesystem stored in the `doc_items` Firestore collection.
        *   `POST`: Creates new metadata records for uploaded files (using info from the `/api/facilities/:id/files` response), new folders, or new web links.
        *   `GET`: Fetches the file/folder structure for a specific facility or folder.
        *   `PUT`: Updates item metadata (e.g., renaming, moving, tagging).
        *   `DELETE`: Deletes item metadata (and potentially the associated file in Storage). Handles recursive deletion for folders.
        *   `GET /api/doc_items/:id/download-url`: Generates a temporary signed URL for downloading a file securely from Firebase Storage.
*   **Authentication Middleware:** A function (`isAuthenticated`) checks for a valid `Bearer` token (JWT) in the `Authorization` header of incoming requests for protected endpoints. It uses `jsonwebtoken.verify()` to validate the token against the secret key (stored as an environment variable).

## 5. Firebase

Firebase provides the backend infrastructure for data and file storage.

*   **Firestore:**
    *   **Role:** Acts as the primary database.
    *   **Data Structure:**
        *   `facilities` collection: Each document represents a recycling facility. The data seems to follow a GeoJSON-like structure (`type: "Feature"`, `properties: {...}`, `geometry: {...}`). The `properties` object contains details like name, address, capacity, status, company, etc., and importantly, used to contain a nested `filesystem` object (now likely deprecated in favor of `doc_items`).
        *   `doc_items` collection: Each document represents an item in the virtual filesystem (a file, folder, or link). Key fields include `id`, `name`, `type` ('file', 'folder', 'link'), `parentId` (linking to the parent folder's `doc_item` ID or a root identifier like `facilityId`), `facilityId` (linking to the facility), `storagePath` (for files), `url` (for links), `createdAt`, `tags`, etc. This allows for organizing documents associated with each facility.
*   **Cloud Storage:**
    *   **Role:** Stores the actual binary files (documents, images) uploaded by users.
    *   **Structure:** Files are organized into folders within the storage bucket, typically named after the `facilityId` (e.g., `redwood-nevada/files/`) or a special `uncategorized/files/` folder. Filenames include a UUID to prevent collisions. Access to these files for download is managed via signed URLs generated by the backend API.
*   **Authentication:** While Firebase *has* an Authentication service, this project uses a simpler custom authentication flow: the backend validates hardcoded/environment variable credentials and issues its own JWTs. Firebase Admin SDK is used for backend access, not user authentication.

## 6. Vercel

Vercel is the platform used for deploying and hosting the entire application.

*   **Role:**
    *   **Hosting:** Serves the static frontend assets (HTML, CSS, JS, images).
    *   **Serverless Functions:** Runs the Node.js/Express backend API code. Vercel automatically manages the infrastructure, scaling the functions based on demand.
    *   **Build Process:** Builds the project (if necessary) before deployment.
    *   **Environment Variables:** Securely stores configuration like Firebase service account keys, JWT secrets, and admin credentials.
*   **Configuration (`vercel.json`):** This file tells Vercel how to build and deploy the project. It might include:
    *   Build commands.
    *   Which directory contains the serverless functions (`api/`).
    *   Routing rules (e.g., directing requests starting with `/api/` to the backend functions, serving static files otherwise).

## 7. Example Data Flows

**A. Viewing a Facility Detail Page (e.g., `/facilities/redwood-nevada.html`)**

1.  **User Action:** Clicks a link to a facility page in the browser.
2.  **Frontend (SPA Router):** Intercepts the click, uses `fetch` to request `/facilities/redwood-nevada.html` from the server. Updates URL using `history.pushState`.
3.  **Vercel Routing:** Directs the request to the backend function handling the `/facilities/:id.html` route.
4.  **Backend API (`api/index.js`):**
    *   Extracts `facilityId` ("redwood-nevada") from the request URL.
    *   Queries Firestore `facilities` collection for the document with ID "redwood-nevada".
    *   Queries Firestore `facilities` collection again for related facilities (same company).
    *   Calls `generateFacilityPageHTML()` from `api/page-generator.js`, passing the fetched data.
    *   Sends the generated HTML string back as the response.
5.  **Frontend (SPA Router):** Receives the HTML, parses it, replaces the content of the `#main-content` div with the new HTML, updates the page title, and potentially loads/runs `js/facility-detail.js`.

**B. Uploading a Document**

1.  **User Action:** Selects a file and clicks "Upload" on the `documents.html` page (within a specific facility's context).
2.  **Frontend (e.g., `js/documents.js`):**
    *   Creates a `FormData` object with the file and the target `parentId` (folder ID).
    *   Sends a `POST` request to `/api/facilities/[facilityId]/files` using `fetch`. Includes the JWT in the `Authorization: Bearer [token]` header.
3.  **Backend API (`api/index.js` - `/api/facilities/:id/files`):**
    *   Verifies the JWT.
    *   Uses `multer` to process the incoming file stream.
    *   Constructs the storage path (e.g., `[facilityId]/files/[uuid]-[filename]`).
    *   Uploads the file buffer to Firebase Storage at the constructed path using `admin.storage().bucket().file().save()`.
    *   Sends a JSON response back to the frontend containing metadata like the `storagePath`, `contentType`, `size`, and original `name`.
4.  **Frontend (e.g., `js/documents.js`):**
    *   Receives the successful response with file metadata.
    *   Sends *another* `POST` request, this time to `/api/doc_items`. The request body includes the metadata received from the previous step (`storagePath`, `name`, `size`, `contentType`), along with `type: 'file'`, `parentId`, and potentially tags. Includes the JWT in the header.
5.  **Backend API (`api/index.js` - `/api/doc_items`):**
    *   Verifies the JWT.
    *   Validates the incoming data.
    *   Creates a new document in the Firestore `doc_items` collection with the provided details, linking it to the `parentId` and `facilityId`.
    *   Sends a success response back to the frontend.
6.  **Frontend (e.g., `js/documents.js`):** Updates the UI to show the newly added file in the correct folder.

This covers the main components and interactions within your project. Let me know if you'd like clarification on any specific part!