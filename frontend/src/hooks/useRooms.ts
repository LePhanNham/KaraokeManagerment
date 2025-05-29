import { useState, useEffect, useMemo } from 'react';
import { Room } from '../types/interfaces';
import { useNotification } from '../contexts/NotificationContext';
import roomsPageService, { 
  RoomFormData, 
  RoomFilters 
} from '../services/roomsPageService';

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
      const roomsData = await roomsPageService.getAllRooms();
      setRooms(roomsData);
    } catch (error: any) {
      setError(error.message);
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    // Validate form data
    const validationError = roomsPageService.validateRoomData(formData);
    if (validationError) {
      setFormErrors({ general: validationError });
      return;
    }

    try {
      setLoading(true);
      await roomsPageService.createRoom(formData);
      notifySuccess('Tạo phòng mới thành công');
      await loadRooms();
      handleCloseDialog();
    } catch (error: any) {
      setFormErrors({ general: error.message });
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!selectedRoom?.id) return;

    // Validate form data
    const validationError = roomsPageService.validateRoomData(formData);
    if (validationError) {
      setFormErrors({ general: validationError });
      return;
    }

    try {
      setLoading(true);
      await roomsPageService.updateRoom(selectedRoom.id, formData);
      notifySuccess('Cập nhật phòng thành công');
      await loadRooms();
      handleCloseDialog();
    } catch (error: any) {
      setFormErrors({ general: error.message });
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete?.id) return;

    try {
      setLoading(true);
      await roomsPageService.deleteRoom(roomToDelete.id);
      notifySuccess('Xóa phòng thành công');
      await loadRooms();
      setShowDeleteDialog(false);
      setRoomToDelete(null);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenCreateDialog = () => {
    setSelectedRoom(null);
    setFormData(roomsPageService.getDefaultFormData());
    setFormErrors({});
    setShowDialog(true);
  };

  const handleOpenEditDialog = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      price_per_hour: room.price_per_hour,
      description: room.description || ''
    });
    setFormErrors({});
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedRoom(null);
    setFormData(roomsPageService.getDefaultFormData());
    setFormErrors({});
    setShowDialog(false);
  };

  const handleOpenDeleteDialog = (room: Room) => {
    setRoomToDelete(room);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setRoomToDelete(null);
    setShowDeleteDialog(false);
  };

  // Form handlers
  const handleFormChange = (field: keyof RoomFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = () => {
    if (selectedRoom) {
      handleUpdateRoom();
    } else {
      handleCreateRoom();
    }
  };

  // Filter handlers
  const handleFilterChange = (field: keyof RoomFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters(roomsPageService.getDefaultFilters());
  };

  // Sort handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Utility functions
  const formatPrice = roomsPageService.formatPrice;

  const clearError = () => {
    setError('');
  };

  const isFormValid = () => {
    return roomsPageService.validateRoomData(formData) === null;
  };

  return {
    // States
    rooms,
    filteredAndSortedRooms,
    loading,
    error,
    selectedRoom,
    showDialog,
    showDeleteDialog,
    roomToDelete,
    formData,
    formErrors,
    filters,
    sortBy,
    sortOrder,
    roomTypes,
    roomStats,

    // Actions
    loadRooms,
    handleCreateRoom,
    handleUpdateRoom,
    handleDeleteRoom,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseDialog,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleFormChange,
    handleSubmit,
    handleFilterChange,
    handleClearFilters,
    handleSort,
    clearError,

    // Utilities
    formatPrice,
    isFormValid
  };
};
