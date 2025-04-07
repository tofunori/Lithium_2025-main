import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth'; // Import User type
import { auth } from '../firebase'; // Corrected path to firebase config

// Define the context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  // Add signIn/signOut methods here if needed in the future
}

// Define Provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// Create context with type and default value (null)
const AuthContext = createContext<AuthContextType | null>(null);

// Update useAuth hook with null check
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Type AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Type useState hooks
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Type useEffect for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => { // Type user parameter
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []); // Dependency array is empty as 'auth' instance is stable

  // Handle redirect result (kept from original code)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) { // Optional chaining for safety
          // User signed in via redirect
          console.log("Redirect login successful", result.user);
          // Note: currentUser state is already managed by onAuthStateChanged listener
        }
      })
      .catch((error) => {
        console.error("Error handling redirect result:", error);
      });
  }, []); // Empty dependency array, runs once on mount

  // Context value conforming to AuthContextType
  const value: AuthContextType = {
    currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when not loading */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Keeping original default export style if needed, though named exports are common.
export default AuthContext;