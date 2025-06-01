import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd'; // Import DndProvider
import { HTML5Backend } from 'react-dnd-html5-backend'; // Import the backend
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import { ToastProvider, useToastContext } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FacilitiesPage from './pages/FacilitiesPage';
import ChartsPage from './pages/ChartsPage'; // TS should resolve .tsx/.jsx
import DocumentsPage from './pages/DocumentsPage';
import FacilityDetailPage from './pages/FacilityDetailPage'; // Import the new component
import FacilityEditPage from './pages/FacilityEditPage'; // Import the edit page component
import FacilityCreatePageValidated from './pages/FacilityCreatePageValidated'; // Import the validated create page component
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute

import MainLayout from './layouts/MainLayout'; // TS should resolve .tsx/.jsx
import './App.css';

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <ThemeProvider>
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
                <Route path="/facilities/new" element={<FacilityCreatePageValidated />} />
                <Route path="/facilities/edit/:facilityId" element={<FacilityEditPage />} />
              </Route>
            </Route>
          </Routes>
        </ThemeProvider>
        
        {/* Global Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DndProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
