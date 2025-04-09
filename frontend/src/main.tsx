import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { DndProvider } from 'react-dnd'; // Import DndProvider
import { HTML5Backend } from 'react-dnd-html5-backend'; // Import the backend
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider (remove .tsx)

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css';

import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-geosearch/dist/geosearch.css'; // Import GeoSearch CSS


import './index.css';
import App from './App'; // Updated import path

const container = document.getElementById('root')!; // Add non-null assertion
const root = createRoot(container); // Create root using the container

root.render(
  <StrictMode>
    <DndProvider backend={HTML5Backend}> {/* Wrap with DndProvider */}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </DndProvider>
  </StrictMode>,
);
