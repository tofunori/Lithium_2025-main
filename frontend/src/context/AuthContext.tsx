import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js'; // Import Supabase types
import { supabase } from '../supabaseClient'; // Import Supabase client

// Define the context type using Supabase User
interface AuthContextType {
  currentUser: User | null;
  session: Session | null; // Expose session as well, might be useful
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
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
  // Type useState hooks using Supabase types
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Use Supabase's onAuthStateChange
  useEffect(() => {
    // Immediately try to get the current session to set the initial state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false); // Initial load finished
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      // Set loading to false if it wasn't already, e.g., after login/logout
      if (loading) setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [loading]); // Rerun effect if loading state changes (though primarily runs once)

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error: error as Error };
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { data: null, error: error as Error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { data, error };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { data: null, error: error as Error };
    }
  };

  // Context value conforming to AuthContextType
  const value: AuthContextType = {
    currentUser,
    session, // Provide session
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Keeping original default export style if needed
export default AuthContext;