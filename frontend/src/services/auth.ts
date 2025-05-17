import api from './api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/customers/auth/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { token, customer } = response.data.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(customer));
        
        return response.data;
      }
      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/customers/auth/register', credentials);
      // Remove auto-login behavior - just return the response
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<{ success: boolean; data: User }>('/auth/profile');
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to get profile data');
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};