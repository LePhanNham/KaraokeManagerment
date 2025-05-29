import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, BookingWithRoom } from '../types/interfaces';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import bookingsPageService, { 
  BookingTimeRange, 
  SelectedRoomWithDetails 
} from '../services/bookingsPageService';

export const useBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  // States
  const [activeStep, setActiveStep] = useState(0);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [userBookings, setUserBookings] = useState<BookingWithRoom[]>([]);
  const [bookingTime, setBookingTime] = useState<BookingTimeRange>(
    bookingsPageService.getDefaultTimeRange()
  );
  const [bookingNotes, setBookingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    minCapacity: 0,
    maxPrice: 0
  });

  // Computed values
  const totalAmount = bookingsPageService.calculateTotalAmount(
    selectedRooms.map(room => 
      bookingsPageService.calculateRoomDetails(room, bookingTime.start_time, bookingTime.end_time)
    )
  );

  const roomTypes = bookingsPageService.getRoomTypes(allRooms);

  // Load initial data
  useEffect(() => {
    loadAllRooms();
    if (user?.id) {
      loadUserBookings();
    }
  }, [user?.id]);

  // Apply filters when rooms or filters change
  useEffect(() => {
    const filtered = bookingsPageService.applyFilters(availableRooms, filters);
    setFilteredRooms(filtered);
  }, [availableRooms, filters]);

  // API calls
  const loadAllRooms = async () => {
    try {
      setLoading(true);
      const rooms = await bookingsPageService.getAllRooms();
      setAllRooms(rooms);
    } catch (error: any) {
      setError(error.message);
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBookings = async () => {
    if (!user?.id) return;

    try {
      const bookings = await bookingsPageService.getUserBookings(user.id);
      setUserBookings(bookings);
    } catch (error: any) {
      console.error('Error loading user bookings:', error);
      // Don't show error for bookings load failure
    }
  };

  const findAvailableRooms = async () => {
    // Validate time first
    const timeValidation = bookingsPageService.validateBookingTime(
      bookingTime.start_time,
      bookingTime.end_time
    );

    if (timeValidation) {
      setError(timeValidation);
      return false;
    }

    try {
      setLoading(true);
      setError('');

      const rooms = await bookingsPageService.findAvailableRooms(
        bookingTime.start_time,
        bookingTime.end_time
      );

      setAvailableRooms(rooms);
      setActiveStep(1); // Move to room selection step
      return true;
    } catch (error: any) {
      setError(error.message);
      notifyError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Room selection handlers
  const handleRoomSelect = (room: Room) => {
    setSelectedRooms(prev => {
      const isSelected = prev.some(r => r.id === room.id);
      if (isSelected) {
        return prev.filter(r => r.id !== room.id);
      } else {
        return [...prev, room];
      }
    });
  };

  const isRoomSelected = (roomId: number): boolean => {
    return selectedRooms.some(room => room.id === roomId);
  };

  // Time handlers
  const handleTimeChange = (field: keyof BookingTimeRange, value: string) => {
    setBookingTime(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter handlers
  const handleFilterChange = (filterName: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      minCapacity: 0,
      maxPrice: 0
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (activeStep === 0) {
      findAvailableRooms();
    } else if (activeStep === 1) {
      handleProceedToConfirmation();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedRooms([]);
    setAvailableRooms([]);
    setFilteredRooms([]);
    setBookingNotes('');
    setError('');
    setBookingTime(bookingsPageService.getDefaultTimeRange());
    clearFilters();
  };

  const handleProceedToConfirmation = () => {
    // Validate before proceeding
    const validationError = bookingsPageService.validateBeforeConfirmation(
      selectedRooms,
      bookingTime
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    // Prepare data for confirmation page
    const confirmationData = bookingsPageService.prepareConfirmationData(
      selectedRooms,
      bookingTime,
      bookingNotes
    );

    // Navigate to confirmation page
    navigate('/booking-confirmation', {
      state: confirmationData
    });
  };

  // Utility functions
  const formatDateTime = bookingsPageService.formatDateTime;

  const clearError = () => {
    setError('');
  };

  return {
    // States
    activeStep,
    allRooms,
    availableRooms,
    filteredRooms,
    selectedRooms,
    userBookings,
    bookingTime,
    bookingNotes,
    loading,
    error,
    filters,
    totalAmount,
    roomTypes,

    // Actions
    handleRoomSelect,
    isRoomSelected,
    handleTimeChange,
    handleFilterChange,
    clearFilters,
    handleNext,
    handleBack,
    handleReset,
    handleProceedToConfirmation,
    findAvailableRooms,
    loadUserBookings,
    setBookingNotes,
    clearError,

    // Utilities
    formatDateTime
  };
};
