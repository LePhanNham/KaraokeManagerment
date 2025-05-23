import api from './api';
import { Room } from '../types/interfaces';
import { ApiResponse } from '../types/interfaces';

export const roomService = {
  getAllRooms: async (): Promise<ApiResponse<Room[]>> => {
    try {
      // Keep /rooms in path to match backend routes
      const response = await api.get<ApiResponse<Room[]>>('/rooms');
      return response.data;
    } catch (error) {
      console.error('Error getting rooms:', error);
      throw error;
    }
  },

  createRoom: async (roomData: Partial<Room>): Promise<ApiResponse<Room>> => {
    try {
      // Keep /rooms in path to match backend routes
      const response = await api.post<ApiResponse<Room>>('/rooms', roomData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  updateRoom: async (id: number, roomData: Partial<Room>): Promise<ApiResponse<Room>> => {
    try {
      const response = await api.put<ApiResponse<Room>>(`/rooms/${id}`, roomData);
      return response.data;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  deleteRoom: async (id: number): Promise<ApiResponse<void>> => {
    try {
      const response = await api.delete<ApiResponse<void>>(`/rooms/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting room:', error);
      // Return a structured error response instead of throwing
      if (error.response && error.response.data) {
        // Return the server's error response
        return error.response.data;
      }
      // If no structured response, create a generic error response
      return {
        success: false,
        message: error.message || 'Failed to delete room',
        data: undefined
      };
    }
  },

  getRoomById: async (id: number): Promise<ApiResponse<Room>> => {
    try {
      const response = await api.get<ApiResponse<Room>>(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  }
};
