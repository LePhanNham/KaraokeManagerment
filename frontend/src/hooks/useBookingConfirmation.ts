import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room } from '../types/interfaces';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import bookingConfirmationService, {
  SelectedRoom,
  BookingConfirmationData
} from '../services/bookingConfirmationService';

export const useBookingConfirmation = (initialData: BookingConfirmationData | null) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  // States
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>(initialData?.selectedRooms || []);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [editingRoom, setEditingRoom] = useState<SelectedRoom | null>(null);
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Computed values
  const totalAmount = selectedRooms.reduce((sum, room) => sum + room.subtotal, 0);
  const originalStartTime = initialData?.originalStartTime || '';
  const originalEndTime = initialData?.originalEndTime || '';

  // Validation
  useEffect(() => {
    if (!initialData || !originalStartTime || !originalEndTime) {
      navigate('/bookings');
      return;
    }
    loadAvailableRooms();
  }, [initialData, originalStartTime, originalEndTime, navigate]);

  // API calls
  const loadAvailableRooms = async () => {
    try {
      const allRooms = await bookingConfirmationService.getAvailableRooms(originalStartTime, originalEndTime);
      const selectedRoomIds = selectedRooms.map(r => r.id);
      const available = bookingConfirmationService.filterAvailableRooms(allRooms, selectedRoomIds);
      setAvailableRooms(available);
    } catch (error: any) {
      console.error('Error loading available rooms:', error);
      setError(error.message || 'Lỗi khi tải danh sách phòng trống');
    }
  };

  const createBooking = async () => {
    // Validate dữ liệu
    const validationError = bookingConfirmationService.validateBookingData(user?.id, selectedRooms);
    if (validationError) {
      setError(validationError);
      return false;
    }

    try {
      setLoading(true);

      // Chuẩn bị dữ liệu booking
      const bookingData = bookingConfirmationService.prepareBookingData(
        user!.id,
        selectedRooms,
        totalAmount,
        notes
      );

      const response = await bookingConfirmationService.createBooking(bookingData);

      if (response.success) {
        // Show success notification
        notifySuccess(`🎉 Đặt phòng thành công! Tổng tiền: ${totalAmount.toLocaleString()}đ`);

        navigate('/bookings', {
          state: {
            message: `Đặt phòng thành công! Tổng tiền: ${totalAmount.toLocaleString()}đ`
          }
        });
        return true;
      } else {
        const errorMsg = response.message || 'Lỗi khi đặt phòng';
        setError(errorMsg);
        notifyError(errorMsg);
        return false;
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Lỗi khi đặt phòng';
      setError(errorMsg);
      notifyError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Utility functions
  const calculateHoursAndSubtotal = bookingConfirmationService.calculateHoursAndSubtotal;

  const validateTimeRange = (startTime: string, endTime: string): string | null => {
    return bookingConfirmationService.validateTimeRange(startTime, endTime, originalStartTime, originalEndTime);
  };

  // Room management functions
  const handleEditRoom = (room: SelectedRoom) => {
    setEditingRoom({ ...room });
  };

  const handleSaveEdit = () => {
    if (!editingRoom) return false;

    // Validate thời gian
    const validationError = validateTimeRange(editingRoom.start_time, editingRoom.end_time);
    if (validationError) {
      setError(validationError);
      return false;
    }

    // Tính lại giờ và tiền
    const { hours, subtotal } = calculateHoursAndSubtotal(
      editingRoom.start_time,
      editingRoom.end_time,
      editingRoom.price_per_hour
    );

    const updatedRoom = {
      ...editingRoom,
      hours,
      subtotal
    };

    setSelectedRooms(prev =>
      prev.map(room => room.id === editingRoom.id ? updatedRoom : room)
    );

    setEditingRoom(null);
    setError('');
    return true;
  };

  const handleCancelEdit = () => {
    setEditingRoom(null);
    setError('');
  };

  const handleRemoveRoom = (roomId: number) => {
    setSelectedRooms(prev => prev.filter(room => room.id !== roomId));
    loadAvailableRooms(); // Reload để thêm phòng vừa xóa vào danh sách available
  };

  const handleAddRoom = (room: Room) => {
    setSelectedRooms(prev =>
      bookingConfirmationService.addSelectedRoom(prev, room, originalStartTime, originalEndTime)
    );
    setShowAddRoomDialog(false);
    loadAvailableRooms();
  };

  const handleShowAddRoomDialog = () => {
    setShowAddRoomDialog(true);
  };

  const handleCloseAddRoomDialog = () => {
    setShowAddRoomDialog(false);
  };

  const handleUpdateEditingRoom = (field: keyof SelectedRoom, value: any) => {
    if (!editingRoom) return;
    setEditingRoom(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleUpdateNotes = (newNotes: string) => {
    setNotes(newNotes);
  };

  const handleGoBack = () => {
    navigate('/bookings');
  };

  const clearError = () => {
    setError('');
  };

  // Format functions
  const formatDateTime = bookingConfirmationService.formatDateTime;
  const formatTime = bookingConfirmationService.formatTime;

  return {
    // States
    selectedRooms,
    availableRooms,
    editingRoom,
    showAddRoomDialog,
    loading,
    error,
    notes,
    totalAmount,
    originalStartTime,
    originalEndTime,

    // Actions
    handleEditRoom,
    handleSaveEdit,
    handleCancelEdit,
    handleRemoveRoom,
    handleAddRoom,
    handleShowAddRoomDialog,
    handleCloseAddRoomDialog,
    handleUpdateEditingRoom,
    handleUpdateNotes,
    handleGoBack,
    createBooking,
    clearError,

    // Utilities
    formatDateTime,
    formatTime,
    validateTimeRange,
    calculateHoursAndSubtotal
  };
};
