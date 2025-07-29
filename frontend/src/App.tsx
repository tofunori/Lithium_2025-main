import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToastContext } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import FacilitiesPage from './pages/FacilitiesPage';
import ChartsPage from './pages/ChartsPage';
import DocumentsPage from './pages/DocumentsPage';
import FacilityDetailPageAcademic from './pages/FacilityDetailPageAcademic';
import FacilityEditPage from './pages/FacilityEditPage';
import FacilityCreatePageValidated from './pages/FacilityCreatePageValidated';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import './App.css';

const AppContent: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <ThemeProvider>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/facilities" element={<FacilitiesPage />} />
              <Route path="/charts" element={<ChartsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/facilities/:id" element={<FacilityDetailPageAcademic />} />

              <Route element={<ProtectedRoute redirectPath="/" />}>
                <Route path="/facilities/new" element={<FacilityCreatePageValidated />} />
                <Route path="/facilities/:id/edit" element={<FacilityEditPage />} />
              </Route>
            </Route>
          </Routes>
        </ThemeProvider>
        
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
