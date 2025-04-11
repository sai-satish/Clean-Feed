
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { users } from '../constants/mockData';

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  profilePic: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('reelverse_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll accept any credential with valid format
    // and randomly assign a profile from our users array
    if (email && password && password.length >= 6) {
      const randomUserIndex = Math.floor(Math.random() * users.length);
      const mockUser = users[randomUserIndex];
      
      const loggedInUser = {
        id: Date.now().toString(),
        username: mockUser.username,
        name: mockUser.name,
        email: email,
        profilePic: mockUser.profilePic
      };
      
      setUser(loggedInUser);
      localStorage.setItem('reelverse_user', JSON.stringify(loggedInUser));
      return true;
    }
    
    return false;
  };

  const signup = async (name: string, username: string, email: string, password: string): Promise<boolean> => {
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll accept any valid format
    if (name && username && email && password && password.length >= 6) {
      const newUser = {
        id: Date.now().toString(),
        username,
        name,
        email,
        profilePic: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`
      };
      
      setUser(newUser);
      localStorage.setItem('reelverse_user', JSON.stringify(newUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('reelverse_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      login, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
