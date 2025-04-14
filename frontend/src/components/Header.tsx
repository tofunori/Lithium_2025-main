import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import './Header.css';

const Header: React.FC = () => {
  const { currentUser, signOut } = useAuth(); // Updated to use signOut from context
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
    return location.pathname === path ? 'active' : '';
  };

  return (
    <>
      <div className="dashboard-header">
        <div className="row align-items-center">
          <div className="col-md-6">
            <h1>Lithium Battery Recycling Networks in North America: Structure & Capacity</h1>
            <p id="page-subtitle" className="text-muted"></p>
          </div>
          <div className="col-md-6">
            <nav className="navbar navbar-expand navbar-light bg-light rounded p-2 float-end">
              <div className="container-fluid">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/')}`} to="/">Map</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/facilities')}`} to="/facilities">Facilities</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/charts')}`} to="/charts">Charts</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/documents')}`} to="/documents">Documents</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${isActive('/about')}`} to="/about">About</Link>
                  </li>
                </ul>
                <div className="form-check form-switch me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="themeSwitch"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                  />
                  <label className="form-check-label" htmlFor="themeSwitch">
                    <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
                  </label>
                </div>
                <div id="authStatus" className="d-flex align-items-center">
                  {currentUser ? (
                    <>
                      <button className="btn btn-outline-secondary btn-sm" onClick={handleSignOut}>Logout</button>
                    </>
                  ) : (
                    <button className="btn btn-outline-primary btn-sm" onClick={openLoginModal}>Login</button>
                  )}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </>
  );
};

export default Header;
