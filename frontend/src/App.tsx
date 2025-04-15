import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FacilitiesPage from './pages/FacilitiesPage';
import ChartsPage from './pages/ChartsPage'; // TS should resolve .tsx/.jsx
import DocumentsPage from './pages/DocumentsPage';
import FacilityDetailPage from './pages/FacilityDetailPage'; // Import the new component
import FacilityEditPage from './pages/FacilityEditPage'; // Import the edit page component
import FacilityCreatePage from './pages/FacilityCreatePage'; // Import the create page component
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

import MainLayout from './layouts/MainLayout'; // TS should resolve .tsx/.jsx
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <ThemeProvider> {/* Wrap Routes with ThemeProvider */}
        <Routes>
          <Route element={<MainLayout />}>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/facilities" element={<FacilitiesPage />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/facilities/:id" element={<FacilityDetailPage />} />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute redirectPath="/" />}>
              <Route path="/facilities/new" element={<FacilityCreatePage />} />
              <Route path="/facilities/edit/:facilityId" element={<FacilityEditPage />} />
            </Route>
          </Route>
        </Routes>
      </ThemeProvider>
    </div>
  );
};

export default App;
