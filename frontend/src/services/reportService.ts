import api from './api';
import { RevenueData, TopRoomData } from '../types/interfaces';
import { ApiResponse } from '../types/interfaces';

export const reportService = {
  getMonthlyRevenue: async (year: number): Promise<ApiResponse<RevenueData[]>> => {
    try {
      const response = await api.get<ApiResponse<RevenueData[]>>(`/reports/revenue/monthly?year=${year}`);
      return response.data;
    } catch (error) {
      console.error('Error getting monthly revenue:', error);
      throw error;
    }
  },

  getQuarterlyRevenue: async (year: number): Promise<ApiResponse<RevenueData[]>> => {
    try {
      const response = await api.get<ApiResponse<RevenueData[]>>(`/reports/revenue/quarterly?year=${year}`);
      return response.data;
    } catch (error) {
      console.error('Error getting quarterly revenue:', error);
      throw error;
    }
  },

  getYearlyRevenue: async (startYear: number, endYear: number): Promise<ApiResponse<RevenueData[]>> => {
    try {
      const response = await api.get<ApiResponse<RevenueData[]>>(
        `/reports/revenue/yearly?startYear=${startYear}&endYear=${endYear}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting yearly revenue:', error);
      throw error;
    }
  },

  getTopRooms: async (year: number, limit: number = 5): Promise<ApiResponse<TopRoomData[]>> => {
    try {
      const response = await api.get<ApiResponse<TopRoomData[]>>(
        `/reports/rooms/top?year=${year}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting top rooms:', error);
      throw error;
    }
  }
};
