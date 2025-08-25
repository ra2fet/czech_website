import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from '../api/axios';
import config from '../config';

const MINUTES = 15;
const SESSION_TIMEOUT = 60 * MINUTES * 1000; // 1 hour in milliseconds
const CHECK_INTERVAL = 60 * 1000; // Check every minute

interface User {
  id: number;
  email: string;
  userType: 'customer' | 'company' | 'admin';
  isActive: boolean;
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
    navigate('/signin');
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
      delete axios.defaults.headers.common['Authorization'];
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
        redirectToLogin(); // Redirect to login page on timeout
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
          setUser(response.data);
          // Start timeout check only if user is successfully authenticated and feature is enabled
          if (config.enableSessionTimeout && localStorage.getItem('loginTime')) {
            timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token'); // Clear invalid token
          localStorage.removeItem('loginTime'); // Clear login time as well
          if (error.response &&error.response.data.message === 'Invalid token. Please log in again.') {
            signOut(); // Ensure full logout state
            redirectToLogin(); // Redirect to login page
          }else if (error.response &&  error.response.error === 'Access denied. No authentication token provided.') {
            signOut(); // Ensure full logout state
            redirectToLogin(); // Redirect to login page
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
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
