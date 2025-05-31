# Running the Lithium 2025 Local Servers

This project contains:

1. A **React + Vite frontend** in `frontend/`
2. An **Express + Firebase backend API** in `Lithium_2025-main/api/`

Follow the steps below to get both pieces running on your machine.

---

## 1 · Prerequisites

• Node .js (v18 or later preferred) and **npm** installed and available in your PATH.  
• (Optional, backend only) A Google-service-account JSON file and the required environment variables if you plan to connect to your own Firebase project.

> 📝 If you are only interested in the frontend (UI) you can skip the backend setup.

---

## 2 · Clone & install dependencies

```bash
# Clone the repo (if you haven't already)
git clone <your-fork-or-the-original>
cd Lithium_2025-main

# Install root-level packages (backend / utilities)
npm install  # installs the packages defined in Lithium_2025-main/package.json

# Install frontend packages
cd frontend
npm install
cd ..  # go back to repo root
```

---

## 3 · Starting the frontend dev server

The `frontend` folder uses **Vite**. We tweaked the script so it works on Windows/Mac/Linux alike.

```bash
# From the repository root
cd frontend

# Start Vite (serves at http://localhost:5173 by default)
npm run dev -- --host
# or if npm script fails on Windows
node node_modules/vite/bin/vite.js --host
```

* `--host` lets other devices on your LAN access the site (handy for mobile testing).  
* If you prefer, you can start it directly with `npx vite --host`.

Once it prints something like this, open the local URL in a browser:

```
  VITE v6.xx  ready in  xyz ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.X.X:5173/
```

Hot-reload is enabled: any changes you save in `frontend/src` will immediately refresh the page.

---

## 4 · Starting the backend API server

The backend lives in `Lithium_2025-main/api/index.js` and relies on Firebase Admin SDK.  
If you **just want a local mock server** you can run it without Firebase configuration, but most routes that touch Firestore / Storage will fail. To run it fully:

1. Create a Firebase project.
2. Generate a service-account JSON (Firebase > Settings > Service accounts).
3. Place it in `Lithium_2025-main/config/` *or* set it via the `FIREBASE_SERVICE_ACCOUNT` env var.
4. Ensure these environment variables are set (you can create a `.env` file or set them in PowerShell/Bash):

```
FIREBASE_SERVICE_ACCOUNT="{ ...actual-json-string... }"   # Or point to a .json file
FIREBASE_STORAGE_BUCKET="<project-id>.appspot.com"
ADMIN_USERNAME=admin   # login for /api/login
ADMIN_PASSWORD=password
JWT_SECRET=change-me-to-something-strong
```

Then start the server:

```bash
# From the repo root
cd Lithium_2025-main/api

# Install backend-specific packages (only needed once)
npm install

# Start the Express server
node index.js  # defaults to port 3000
```

Open `http://localhost:3000` to test the endpoints (or use Postman).  
The Express app also serves static HTML files from the `Lithium_2025-main/` directory, so navigating to `/index.html` will serve the dashboard if you aren't running the React frontend.

---

## 5 · Combined workflow

If you want **frontend + backend together**:

1. Start the backend (port 3000).  
2. In another terminal, start the frontend (`localhost:5173`).  
3. In development, you may need to adjust API base URLs in the React code (look in `frontend/src/utils/api.ts` if present) so requests go to `http://localhost:3000/api/...`.

---

## 6 · Troubleshooting

• `vite is not recognized` → Make sure `node_modules/.bin` is in PATH *or* run with `npx vite`.  
• Port already in use → Pass a different port: `npm run dev -- --port 5174`.  
• `Firebase credential error` → Check that `FIREBASE_SERVICE_ACCOUNT` is valid JSON or that the path to the JSON file inside `config/` is correct.

---

Happy coding 🚀 