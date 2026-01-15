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

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Immediately set the default axios header if we have a token
      config.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      config.axios
        .get('/auth/user')
        .then((response) => {
          setUser(response.data);
          localStorage.setItem('loginTime', Date.now().toString());

          if (config.enableSessionTimeout) {
            timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error);

          const status = error.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            console.log(`Authentication/User fetch failed (${status}). clearing session.`);
            localStorage.removeItem('token');
            localStorage.removeItem('loginTime');

            if (window.location.pathname !== '/signin') {
              signOut();
              redirectToLogin();
            }
          } else {
            console.log('Non-auth error occurred during user fetch. Attempting to recover from token.', status);
            // On 500 or other errors, try to recover user info from JWT to avoid logout
            const decoded = parseJwt(token);
            if (decoded) {
              setUser({
                id: decoded.id,
                email: decoded.email,
                userType: decoded.userType,
                isActive: decoded.isActive,
                full_name: decoded.full_name,
              });

              if (config.enableSessionTimeout) {
                timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
              }
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      localStorage.removeItem('loginTime');
    }

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, []);

  // Effect to manage timeout interval when user state changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
    if (user && config.enableSessionTimeout) {
      timeoutRef.current = setInterval(checkSessionTimeout, CHECK_INTERVAL);
    }
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [user, checkSessionTimeout]);


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
