import React from 'react'; // Removed useState
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; // Import useTheme hook
import './Header.css';

const Header = () => {
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme(); // Get theme state and toggle function from context

  // Set active class for navigation links
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className="dashboard-header">
      <div className="row align-items-center">
        <div className="col-md-6">
          <h1>Lithium Battery Recycling in North America</h1>
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
              {/* Theme Toggle Switch */}
              <div className="form-check form-switch me-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="themeSwitch"
                  checked={isDarkMode}  // Use context state
                  onChange={toggleDarkMode} // Use context toggle function
                />
                <label className="form-check-label" htmlFor="themeSwitch">
                  <i className="fas fa-moon"></i>
                </label>
              </div>
              {/* Auth Status */}
              <div id="authStatus" className="d-flex align-items-center">
                {/* Login/Logout status will be loaded here */}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;