import { useState, useEffect, useMemo } from 'react';
import { Room } from '../types/interfaces';
import { useNotification } from '../contexts/NotificationContext';
import roomsPageService, { 
  RoomFormData, 
  RoomFilters 
} from '../services/roomsPageService';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Thay đổi port nếu cần

export const useRooms = () => {
  const { notifySuccess, notifyError } = useNotification();

  // States
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Form states
  const [formData, setFormData] = useState<RoomFormData>(
    roomsPageService.getDefaultFormData()
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter states
  const [filters, setFilters] = useState<RoomFilters>(
    roomsPageService.getDefaultFilters()
  );
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Computed values
  const filteredAndSortedRooms = useMemo(() => {
    const filtered = roomsPageService.filterRooms(rooms, filters);
    return roomsPageService.sortRooms(filtered, sortBy, sortOrder);
  }, [rooms, filters, sortBy, sortOrder]);

  const roomTypes = useMemo(() => {
    return roomsPageService.getRoomTypes(rooms);
  }, [rooms]);

  const roomStats = useMemo(() => {
    return roomsPageService.getRoomStats(rooms);
  }, [rooms]);

  // Load data on mount
  useEffect(() => {
    loadRooms();
  }, []);

  // API calls
  const loadRooms = async () => {
    try {
      setLoading(true);
      setError('');
      const roomsData = await fetchRooms();
      setRooms(roomsData);
    } catch (error: any) {
      setError(error.message);
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get<Room[]>(`${API_URL}/rooms`);
      setRooms(response.data);
      return response.data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const createRoom = async (roomData: Omit<Room, 'id'>) => {
    try {
      const response = await axios.post<Room>(`${API_URL}/rooms`, roomData);
      await fetchRooms();
      return response.data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const updateRoom = async (id: number, roomData: Partial<Room>) => {
    try {
      const response = await axios.put<Room>(`${API_URL}/rooms/${id}`, roomData);
      await fetchRooms();
      return response.data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const deleteRoom = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/rooms/${id}`);
      await fetchRooms();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return {
    // State
    rooms,
    loading,
    error,
    selectedRoom,
    setSelectedRoom,
    showDialog,
    setShowDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    roomToDelete,
    setRoomToDelete,
    
    // Form state
    formData,
    setFormData,
    formErrors,
    setFormErrors,

    // Filter state
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Computed values
    filteredAndSortedRooms,
    roomTypes,
    roomStats,

    // API functions
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,

    // Utility functions
    loadRooms,
    isFormValid: () => roomsPageService.validateRoomData(formData) === null
  };
};
