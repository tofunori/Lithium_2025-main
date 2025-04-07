import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import Header from '../components/Header';
import Footer from '../components/Footer';

// Define props interface
interface MainLayoutProps {
  children?: React.ReactNode; // Optional children prop
}

const MainLayout: React.FC<MainLayoutProps> = () => {
  const { isDarkMode } = useTheme(); // Get theme state from context

  return (
    // Add 'dark-mode' class conditionally based on context state
    <div className={`dashboard-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <Header />
      <main id="main-content">
        <Outlet /> {/* Renders the matched child route component */}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;