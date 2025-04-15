import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
  profilePic?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Setup axios interceptor for authentication once on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }

    // Load user data from localStorage if available
    const storedUser = localStorage.getItem('user');

    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse stored user data');
      }
    }

    // Check authentication status from API
    if (token) {
      checkAuthStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      // Get user profile from token
      const response = await axios.get(`${API_URL}/auth/me`);
      const userData = response.data;

      // Save updated user data to localStorage
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't clear token on failed auth check - server might be temporarily down
      // Only clear if response code indicates authentication problem (401/403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      // Save token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Update state IMMEDIATELY - this is key to fixing the issue
      setUser(userData);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login failed:', error);

      if (error.response) {
        console.error('Error data:', error.response.data);
      }

      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      // Save token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Set auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Update state IMMEDIATELY - this is key to fixing the issue
      setUser(userData);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Signup failed:', error);

      if (error.response) {
        console.error('Error data:', error.response.data);
      }

      return false;
    }
  };

  const logout = () => {
    // Remove token
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];

    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};