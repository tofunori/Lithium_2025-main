import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FacilitiesPage from './pages/FacilitiesPage';
import ChartsPage from './pages/ChartsPage';
import DocumentsPage from './pages/DocumentsPage';
import FacilityDetailPage from './pages/FacilityDetailPage'; // Import the new component
import FacilityEditPage from './pages/FacilityEditPage'; // Import the edit page component
import FacilityCreatePage from './pages/FacilityCreatePage'; // Import the create page component

import MainLayout from './layouts/MainLayout';
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/facilities/new" element={<FacilityCreatePage />} /> {/* Add route for facility creation */}

          <Route path="/facilities/:id" element={<FacilityDetailPage />} /> {/* Add route for facility detail */}
          <Route path="/facilities/edit/:facilityId" element={<FacilityEditPage />} /> {/* Add route for facility edit */}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
