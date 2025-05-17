import api from './api';
import { Room } from '../types';
import { ApiResponse } from '../types/api';

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
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
};