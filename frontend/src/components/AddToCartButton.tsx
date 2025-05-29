import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Alert
} from '@mui/material';
import {
  AddShoppingCart as AddCartIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { Room } from '../types/interfaces';
import { useBookingCart } from '../contexts/BookingCartContext';
import { useNotification } from '../contexts/NotificationContext';
import bookingCartService from '../services/bookingCartService';

interface AddToCartButtonProps {
  room: Room;
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  room,
  variant = 'contained',
  size = 'medium',
  fullWidth = false
}) => {
  const { addToCart, isInCart } = useBookingCart();
  const { notifySuccess, notifyError } = useNotification();

  const [showDialog, setShowDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState(() => {
    const defaultTime = bookingCartService.getDefaultBookingTime();
    return {
      start_time: defaultTime.start_time,
      end_time: defaultTime.end_time,
      notes: ''
    };
  });

  // Check if this specific time slot is already in cart
  const isCurrentTimeInCart = isInCart(
    room.id!,
    bookingForm.start_time,
    bookingForm.end_time
  );

  const handleAddToCart = () => {
    // Validate time
    const timeError = bookingCartService.validateBookingTime(
      bookingForm.start_time,
      bookingForm.end_time
    );

    if (timeError) {
      notifyError(timeError);
      return;
    }

    // Check if already in cart
    if (isCurrentTimeInCart) {
      notifyError('Booking này đã có trong giỏ hàng');
      return;
    }

    // Add to cart
    addToCart(
      room,
      bookingForm.start_time,
      bookingForm.end_time,
      bookingForm.notes
    );

    notifySuccess(`Đã thêm ${room.name} vào giỏ hàng`);
    setShowDialog(false);

    // Reset form for next use
    const defaultTime = bookingCartService.getDefaultBookingTime();
    setBookingForm({
      start_time: defaultTime.start_time,
      end_time: defaultTime.end_time,
      notes: ''
    });
  };

  const calculateDetails = () => {
    if (!bookingForm.start_time || !bookingForm.end_time) {
      return { hours: 0, subtotal: 0 };
    }

    const start = new Date(bookingForm.start_time);
    const end = new Date(bookingForm.end_time);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const subtotal = hours * room.price_per_hour;

    return { hours, subtotal };
  };

  const { hours, subtotal } = calculateDetails();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        startIcon={<AddCartIcon />}
        onClick={() => setShowDialog(true)}
        color="primary"
      >
        Thêm vào giỏ
      </Button>

      <Dialog 
        open={showDialog} 
        onClose={() => setShowDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Thêm vào giỏ hàng: {room.name}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Room Info */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                {room.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Loại: {room.type} • Sức chứa: {room.capacity} người
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Giá: {bookingCartService.formatPrice(room.price_per_hour)}/giờ
              </Typography>
            </Box>

            {/* Time Selection */}
            <TextField
              fullWidth
              label="Thời gian bắt đầu"
              type="datetime-local"
              value={bookingForm.start_time}
              onChange={(e) => setBookingForm(prev => ({ 
                ...prev, 
                start_time: e.target.value 
              }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Thời gian kết thúc"
              type="datetime-local"
              value={bookingForm.end_time}
              onChange={(e) => setBookingForm(prev => ({ 
                ...prev, 
                end_time: e.target.value 
              }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={3}
              value={bookingForm.notes}
              onChange={(e) => setBookingForm(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Ghi chú cho booking này (tùy chọn)"
              sx={{ mb: 2 }}
            />

            {/* Booking Summary */}
            {hours > 0 && (
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tóm tắt booking:
                </Typography>
                <Typography variant="body2">
                  Thời gian: {hours} giờ
                </Typography>
                <Typography variant="body2">
                  Ngày: {bookingCartService.formatDate(bookingForm.start_time)}
                </Typography>
                <Typography variant="body2">
                  Giờ: {bookingCartService.formatTime(bookingForm.start_time)} - {bookingCartService.formatTime(bookingForm.end_time)}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  Thành tiền: {bookingCartService.formatPrice(subtotal)}
                </Typography>
              </Box>
            )}

            {/* Warnings */}
            {isCurrentTimeInCart && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Booking này đã có trong giỏ hàng với thời gian đã chọn
              </Alert>
            )}

            {hours <= 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Vui lòng chọn thời gian hợp lệ
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleAddToCart}
            variant="contained"
            disabled={hours <= 0 || isCurrentTimeInCart}
            startIcon={<CheckIcon />}
          >
            Thêm vào giỏ hàng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddToCartButton;
