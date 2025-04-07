import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Import the initialized auth instance

import { getRedirectResult } from "firebase/auth";
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log("Redirect login successful", result.user);
        }
      })
      .catch((error) => {
        console.error("Error handling redirect result", error);
      });
  }, []);

  const value = {
    currentUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; // Exporting context as default for convenience, can also be named export