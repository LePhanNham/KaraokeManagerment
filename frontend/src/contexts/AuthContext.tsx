import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/interfaces';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      
      if (response.success && response.data) {
        const { token, customer } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(customer));
        
        // Update state
        setUser({...customer, phone_number: '', role: 'user'});
        
        
        // Redirect to previous page or dashboard
        const from = location.state?.from || '/';
        navigate(from);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  // Function to check authentication status
  const checkAuth = (): boolean => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      // Clear any potentially invalid data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Redirect to login if not already there
      if (location.pathname !== '/login' && 
          location.pathname !== '/register' && 
          location.pathname !== '/quen-mat-khau') {
        navigate('/login', { state: { from: location.pathname } });
      }
      return false;
    }
    
    // If we have a token but no user in state, set the user
    if (token && storedUser && !user) {
      setUser(JSON.parse(storedUser));
    }
    
    return true;
  };

  // Add a useEffect to check auth on route changes
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};