import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the context type
interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Define Provider props type
interface ThemeProviderProps {
  children: ReactNode;
}

// Create the context with type and default value (null)
const ThemeContext = createContext<ThemeContextType | null>(null);

// Create a custom hook for using the theme context with null check
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Create the provider component, typed with React.FC
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize state with type, reading from localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const storedPreference = localStorage.getItem('darkMode');
      // Parse stored preference if it exists, otherwise default to false (light mode)
      return storedPreference ? JSON.parse(storedPreference) : false;
    } catch (error) {
      console.error("Error reading darkMode from localStorage", error);
      return false; // Default to false in case of error (e.g., invalid JSON)
    }
  });

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    // Type the prevMode parameter in the state setter callback
    setIsDarkMode((prevMode: boolean) => !prevMode);
  };

  // Effect to update localStorage when the theme changes
  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
      // Apply class to body for global styling
      if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
      }
    } catch (error) {
      console.error("Error writing darkMode to localStorage", error);
    }
  }, [isDarkMode]);

  // Provide the state and toggle function to children, conforming to ThemeContextType
  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Exporting context itself might be useful in some cases, but useTheme hook is preferred
export default ThemeContext;