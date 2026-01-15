import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

import config from '../config';

const MINUTES = 15;
const SESSION_TIMEOUT = 60 * MINUTES * 1000; // 15 minutes in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every minute

interface User {
  id: number;
  email: string;
  userType: 'customer' | 'company' | 'admin';
  isActive: boolean;
  full_name?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const redirectToLogin = useCallback(() => {
    // Prevent redirect loop - only redirect if not already on signin page
    if (window.location.pathname !== '/signin') {
      navigate('/signin');
    }
  }, [navigate]);

  const signOut = useCallback(async () => {
    try {
      await config.axios.post('/auth/signout');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if signout API fails, clear local storage to log out client-side
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('loginTime'); // Clear login time on sign out
      delete config.axios.defaults.headers.common['Authorization'];
      setUser(null);
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    }
  }, [setUser, timeoutRef]); // Add setUser and timeoutRef to dependencies

  const checkSessionTimeout = useCallback(() => {
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed > SESSION_TIMEOUT) {
        console.log('Session timed out. Logging out...');
        signOut(); // Automatically sign out
        // Only redirect if not already on signin page
        if (window.location.pathname !== '/signin') {
          redirectToLogin(); // Redirect to login page on timeout
        }
      }
    }
  }, [signOut, redirectToLogin]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      config.axios
        .get('/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          // Set default axios header for future requests
          config.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(response.data);

          // Refresh the session timer so the user isn't logged out immediately after refreshing
          // if their token is still valid on the server.
          localStorage.setItem('loginTime', Date.now().toString());

          // Start timeout check only if user is successfully authenticated and feature is enabled
          if (config.enableSessionTimeout) {
            timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error);

          // Check for 401, 403, or 404 to determine if we should logout
          // 404 means the endpoint exists but the specific resource (user) was not found,
          // which implies the token refers to a non-existent user.
          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            console.log(`Authentication/User fetch failed (${status}). clearing session.`);
            localStorage.removeItem('token');
            localStorage.removeItem('loginTime');

            // Only redirect to login if there's a specific auth error and not already on signin
            if (window.location.pathname !== '/signin') {
              signOut();
              redirectToLogin();
            }
          } else {
            console.log('Non-auth error occurred during user fetch. Not logging out.', status);
            // Optionally keep the user logged in locally or handle gracefully
            // But if we fail to fetch the user, we can't set the user state. 
            // Ideally we should retry or show an error state, but definitely NOT logout on network error.

            // If we don't clear the token, we end up ensuring setLoading(false) runs
            // and the app might show a broken state if 'user' is null.
            // However, clearing local storage on a temporal 500 error is annoying.
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      localStorage.removeItem('loginTime'); // Ensure loginTime is cleared if no token
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, []); // Empty dependency array to run only on mount and unmount

  // Effect to manage timeout interval when user state changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
    if (user && config.enableSessionTimeout) { // Only start interval if user is logged in and feature is enabled
      timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
    }
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [user, checkSessionTimeout]); // Re-run when user state changes


  const signIn = useCallback(async (email: string, password: string) => {
    const response = await config.axios.post('/auth/signin', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('loginTime', Date.now().toString()); // Store login time
    config.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    // Start timeout check immediately after successful sign-in if feature is enabled
    if (config.enableSessionTimeout) {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
    }
    return user; // Return the user object
  }, [setUser, timeoutRef, checkSessionTimeout]);


  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
