import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'; // Import AuthProvider

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import 'leaflet-geosearch/dist/geosearch.css'; // Import GeoSearch CSS


import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* Add BrowserRouter wrapper */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
