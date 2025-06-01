import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import './Header.css';

const Header: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const openLoginModal = (): void => setIsLoginModalOpen(true);
  const closeLoginModal = (): void => setIsLoginModalOpen(false);

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
    }
  };

  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const isActive = (path: string): string => {
    // Special case for homepage - need exact match
    if (path === '/') {
      return location.pathname === '/' ? 'active' : '';
    }
    // For other paths, check if current path starts with the given path
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  return (
    <>
      <header className="academic-header">
        <div className="header-content">
          {/* Modern Title Section */}
          <div className="title-section">
            <h1 className="modern-title">
              EV Lithium Recycling Networks
            </h1>
            <p className="modern-subtitle">
              North American Battery Facility Analytics
            </p>
          </div>

          {/* Navigation & Controls */}
          <div className="header-controls">
            <nav className="academic-nav">
              <ul className="nav-list">
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/')}`} to="/">
                    <span className="nav-icon"><i className="fas fa-map"></i></span>
                    Map
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/facilities')}`} to="/facilities">
                    <span className="nav-icon"><i className="fas fa-industry"></i></span>
                    Facilities
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/charts')}`} to="/charts">
                    <span className="nav-icon"><i className="fas fa-chart-bar"></i></span>
                    Analytics
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/documents')}`} to="/documents">
                    <span className="nav-icon"><i className="fas fa-file-alt"></i></span>
                    Documents
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/about')}`} to="/about">
                    <span className="nav-icon"><i className="fas fa-info-circle"></i></span>
                    About
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Header Actions */}
            <div className="header-actions">
              <button 
                className="theme-toggle"
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              
              <div className="auth-section">
                {currentUser ? (
                  <button className="btn btn-outline auth-btn" onClick={handleSignOut}>
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                ) : (
                  <button className="btn btn-primary auth-btn" onClick={openLoginModal}>
                    <i className="fas fa-sign-in-alt"></i>
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </>
  );
};

export default Header;
