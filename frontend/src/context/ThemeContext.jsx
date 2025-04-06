import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const ThemeContext = createContext();

// Create a custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

// Create the provider component
export const ThemeProvider = ({ children }) => {
  // Initialize state, trying to read from localStorage first
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedPreference = localStorage.getItem('darkMode');
    // Check if preference exists, otherwise default based on system preference (optional)
    // For simplicity, we'll default to false (light mode) if nothing is stored.
    return storedPreference ? JSON.parse(storedPreference) : false; 
  });

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Effect to update localStorage when the theme changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    // Optional: You could also add/remove a class from the body here, 
    // but we plan to do it in MainLayout for better component encapsulation.
  }, [isDarkMode]);

  // Provide the state and toggle function to children
  const value = {
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext; // Exporting context itself might be useful in some cases