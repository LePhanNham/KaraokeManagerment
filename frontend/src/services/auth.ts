
import api from './api';
import { AuthResponse, ApiResponse, LoginCredentials, RegisterCredentials, User } from '../types/interfaces';

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
  
  // Renamed from isAuthenticated to isLoggedIn
  isLoggedIn: (): boolean => {
    return !!localStorage.getItem('token');
  },
  
  // Add missing methods
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get<ApiResponse<User>>('/customers/profile');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error('Failed to get profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      const response = await api.put<ApiResponse<User>>('/customers/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post<ApiResponse<any>>('/customers/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
  
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/customers/auth/register', credentials);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }
};
