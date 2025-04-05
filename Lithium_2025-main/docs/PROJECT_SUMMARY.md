# Lithium Recycling Dashboard: Project Summary

This project is a web application that shows information about lithium battery recycling facilities.

## How it Works:

1.  **Frontend (What you see in the browser):**
    *   Built with HTML, CSS, and JavaScript.
    *   Shows pages like the main dashboard, a map/list of facilities, charts, and document sections.
    *   Uses JavaScript to make the pages interactive (like a Single Page Application - SPA) so you don't have to reload the whole page when navigating.
    *   Talks to the Backend API to get data and save changes.

2.  **Backend API (The "engine" running on the server):**
    *   Built with Node.js and the Express framework.
    *   Runs on Vercel (a cloud hosting platform).
    *   Handles requests from the Frontend.
    *   Manages facility data (creating, reading, updating, deleting).
    *   Handles user login (for admins).
    *   Manages file uploads and document organization.
    *   Connects to Firebase for storage.

3.  **Firebase (Cloud Storage):**
    *   **Firestore:** A database where all the facility details and document information (like file names, folders) are stored.
    *   **Cloud Storage:** Where the actual uploaded files (like PDFs or images) are kept.

4.  **Vercel (Cloud Hosting):**
    *   Where the entire application (Frontend code and Backend API) lives and runs.
    *   Makes the website accessible on the internet.
    *   Securely stores secret keys and passwords needed by the backend.

## Key Features:

*   Interactive map and list of recycling facilities.
*   Detailed pages for each facility.
*   Data charts related to recycling.
*   Ability for administrators to log in and manage facility data.
*   A system for uploading and organizing documents related to each facility.

In short: The browser shows the website (Frontend), which gets its data by asking the Backend API. The API uses Firebase to store and retrieve data and files. The whole thing runs on Vercel.