import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { bookingService } from '../services/bookingService';
import { roomService } from '../services/roomService';
import { useAuth } from '../contexts/AuthContext';
import { Booking, Room } from '../types/interfaces';
import { notifySuccess, notifyError } from '../utils/notificationUtils';

const CheckoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [additionalFees, setAdditionalFees] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLateCheckout, setIsLateCheckout] = useState(false);
  const [lateCheckoutFee, setLateCheckoutFee] = useState(0);

  useEffect(() => {
    if (!id) return;
    loadBookingDetails(parseInt(id));
  }, [id]);

  const loadBookingDetails = async (bookingId: number) => {
    try {
      setLoading(true);

      // Get booking details
      const bookingResponse = await bookingService.getBookingById(bookingId);
      if (!bookingResponse.success || !bookingResponse.data) {
        setError('Không thể tải thông tin đặt phòng');
        return;
      }

      const bookingData = bookingResponse.data;
      setBooking(bookingData);

      // Get room details from booking rooms
      const firstRoom = bookingData.rooms?.[0];
      if (firstRoom?.room_id) {
        const roomResponse = await roomService.getRoomById(firstRoom.room_id);
        if (roomResponse.success && roomResponse.data) {
          setRoom(roomResponse.data);
        }
      }

      // Calculate payment amount
      calculatePaymentAmount(bookingData);

    } catch (err: any) {
      console.error('Error loading booking details:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const calculatePaymentAmount = (bookingData: Booking) => {
    if (!bookingData) return;

    // Calculate actual usage time
    const startTime = new Date(bookingData.start_time);
    const endTime = new Date();
    const plannedEndTime = new Date(bookingData.end_time);

    // Check if checkout is late
    if (endTime > plannedEndTime) {
      setIsLateCheckout(true);

      // Calculate late hours
      const lateHours = Math.ceil((endTime.getTime() - plannedEndTime.getTime()) / (1000 * 60 * 60));

      // Calculate late fee (50% of hourly rate for each late hour)
      const lateFee = lateHours * (room?.price_per_hour || 0) * 0.5;
      setLateCheckoutFee(lateFee);

      // Add late fee to additional fees
      setAdditionalFees(lateFee);
    }

    // Calculate total hours used
    const hoursUsed = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));

    // Calculate total amount
    const baseAmount = hoursUsed * (room?.price_per_hour || 0);
    const totalAmount = baseAmount + additionalFees;

    setPaymentAmount(totalAmount);
  };

  const formatLocalDateTime = (dateString: string | Date) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Tính toán số tiền thanh toán dựa trên thời gian sử dụng và giá phòng
  useEffect(() => {
    if (booking && room && room.price_per_hour) {
      // Tính số giờ sử dụng
      const startTime = new Date(booking.start_time);
      const endTime = new Date(); // Thời gian hiện tại
      const hoursUsed = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));

      // Tính tổng tiền
      const calculatedAmount = hoursUsed * room.price_per_hour;
      setPaymentAmount(calculatedAmount);

      console.log('Calculated payment amount:', {
        startTime,
        endTime,
        hoursUsed,
        pricePerHour: room.price_per_hour,
        calculatedAmount
      });
    }
  }, [booking, room]);

  const handleCompleteCheckout = async () => {
    if (!booking || booking.id === undefined) {
      setError('Không tìm thấy thông tin đặt phòng');
      return;
    }

    try {
      setLoading(true);

      // Current time as checkout time
      const checkoutTime = new Date();

      // Đảm bảo số tiền thanh toán hợp lệ
      if (paymentAmount <= 0 && room && room.price_per_hour) {
        // Tính lại số tiền nếu giá trị không hợp lệ
        const startTime = new Date(booking.start_time);
        const hoursUsed = Math.ceil((checkoutTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
        const calculatedAmount = hoursUsed * room.price_per_hour;

        console.log('Recalculated payment amount:', calculatedAmount);
        setPaymentAmount(calculatedAmount);
      }

      console.log('Completing checkout with payment:', {
        bookingId: booking.id,
        checkoutTime,
        paymentAmount,
        paymentMethod,
        notes
      });

      // Complete booking with payment
      const response = await bookingService.completeBookingWithPayment(
        booking.id,
        checkoutTime,
        paymentAmount > 0 ? paymentAmount : booking.total_amount || 0, // Sử dụng total_amount nếu paymentAmount không hợp lệ
        paymentMethod,
        notes
      );

      if (response.success) {
        console.log('Checkout completed successfully:', response);
        notifySuccess('Trả phòng và thanh toán thành công!');
        navigate('/bookings');
      } else {
        console.error('Checkout failed:', response);
        setError('Không thể hoàn tất thanh toán');
      }
    } catch (err: any) {
      console.error('Error completing checkout:', err);
      setError(err.response?.data?.message || 'Lỗi khi trả phòng và thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!booking || !room) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Không tìm thấy thông tin đặt phòng'}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => navigate('/checkout')}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  // Calculate actual usage time
  const startTime = new Date(booking.start_time);
  const endTime = new Date();
  const hoursUsed = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));
  const baseAmount = hoursUsed * room.price_per_hour;
  const totalAmount = baseAmount + additionalFees;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Trả phòng và Thanh toán
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông tin đặt phòng
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Phòng"
                      secondary={room.name || `Phòng ${room.id}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Khách hàng"
                      secondary={user?.name || 'Khách hàng'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Thời gian bắt đầu"
                      secondary={formatLocalDateTime(booking.start_time)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Thời gian kết thúc (dự kiến)"
                      secondary={formatLocalDateTime(booking.end_time)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Thời gian kết thúc (thực tế)"
                      secondary={formatLocalDateTime(new Date())}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Tổng thời gian sử dụng"
                      secondary={`${hoursUsed} giờ`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Trạng thái"
                      secondary={
                        <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
                          <Chip
                            label="Đã xác nhận"
                            color="primary"
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chi tiết thanh toán
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Giá phòng"
                      secondary={`${formatCurrency(room.price_per_hour)} / giờ`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Thời gian sử dụng"
                      secondary={`${hoursUsed} giờ`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Thành tiền cơ bản"
                      secondary={formatCurrency(baseAmount)}
                    />
                  </ListItem>

                  {isLateCheckout && (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography component="div" color="error" sx={{ mr: 1 }}>
                              Phụ phí trả phòng muộn
                            </Typography>
                            <Chip size="small" color="error" label="Phụ phí" />
                          </Box>
                        }
                        secondary={formatCurrency(lateCheckoutFee)}
                      />
                    </ListItem>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          Tổng cộng
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          {formatCurrency(totalAmount)}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Phương thức thanh toán
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Phương thức thanh toán</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Phương thức thanh toán"
              >
                <MenuItem value="cash">Tiền mặt</MenuItem>
                <MenuItem value="card">Thẻ ngân hàng / POS</MenuItem>
                <MenuItem value="transfer">Chuyển khoản</MenuItem>
                <MenuItem value="e-wallet">Ví điện tử</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Ghi chú thanh toán"
              multiline
              rows={2}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleCancel}
              >
                Hủy
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={handleCompleteCheckout}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Hoàn tất thanh toán'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CheckoutDetail;












