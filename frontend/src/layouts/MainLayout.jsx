import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import Header from '../components/Header';
import Footer from '../components/Footer';

const MainLayout = () => {
  const { isDarkMode } = useTheme(); // Get theme state from context

  return (
    // Add 'dark-mode' class conditionally based on context state
    <div className={`dashboard-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;