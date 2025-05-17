import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { Room, Booking } from '../types/booking';
import { bookingService } from '../services/bookingService';
import { ApiResponse } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const Bookings = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingTime, setBookingTime] = useState({
    start_time: '',
    end_time: ''
  });
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['Chọn thời gian', 'Chọn phòng', 'Xác nhận'];

  useEffect(() => {
    console.log('Current user:', user); // Add this debug line
    
    if (!user) {
      setError('Vui lòng đăng nhập để đặt phòng');
      return;
    }
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingService.getAllBookings();
      if (response.success) {
        setBookings(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!validateTime()) return;
      
      setLoading(true);
      try {
        // Format dates to ISO string for API
        const startISO = new Date(bookingTime.start_time).toISOString();
        const endISO = new Date(bookingTime.end_time).toISOString();

        const response = await bookingService.findAvailableRooms(
          startISO,
          endISO
        );
        
        if (response.success) {
          setAvailableRooms(response.data);
          if (response.data.length === 0) {
            setError('Không có phòng trống trong khoảng thời gian này');
            return;
          }
          setError('');
          setActiveStep((prev) => prev + 1);
        }
      } catch (err: any) {
        console.error('Error finding available rooms:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy phòng trống trong khoảng thời gian này');
        } else if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Lỗi khi tìm phòng trống');
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (activeStep === 1 && !selectedRoom) {
      setError('Vui lòng chọn phòng');
      return;
    }

    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  const validateTime = () => {
    if (!bookingTime.start_time || !bookingTime.end_time) {
      setError('Vui lòng chọn thời gian bắt đầu và kết thúc');
      return false;
    }

    const start = new Date(bookingTime.start_time);
    const end = new Date(bookingTime.end_time);
    const now = new Date();

    if (start >= end) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return false;
    }

    if (start < now) {
      setError('Không thể đặt phòng trong quá khứ');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedRoom || !user?.id) {
      setError('Vui lòng đăng nhập để đặt phòng');
      return;
    }

    if (!validateTime()) return;

    setLoading(true);
    try {
      const start = new Date(bookingTime.start_time);
      const end = new Date(bookingTime.end_time);
      const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      
      // Ensure total_amount is a number
      const totalAmount = Number(durationHours * selectedRoom.price_per_hour);

      const bookingData = {
        room_id: selectedRoom.id,
        customer_id: user.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'pending' as const,
        total_amount: totalAmount, // Ensure it's a number
        notes: bookingNotes || "Không có ghi chú"
      };

      console.log('Booking data before send:', bookingData); // Debug log

      const response = await bookingService.createBooking(bookingData);
      
      if (response.success) {
        alert('Đặt phòng thành công');
        handleReset();
        await loadBookings();
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Lỗi khi đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedRoom(null);
    setBookingTime({ start_time: '', end_time: '' });
    setBookingNotes('');
    setError('');
  };

  const handleViewBooking = (id?: number) => {
    if (!id) return;
    // Add view booking details logic
    console.log('View booking:', id);
  };

  const handleConfirmBooking = async (id?: number) => {
    if (!id) return;
    try {
      const response = await bookingService.updateBooking(id, { status: 'confirmed' });
      if (response.success) {
        await loadBookings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi xác nhận đặt phòng');
    }
  };

  const handleCancelBooking = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn hủy đặt phòng này?')) return;
    
    try {
      const response = await bookingService.updateBooking(id, { status: 'cancelled' });
      if (response.success) {
        await loadBookings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi hủy đặt phòng');
    }
  };

  const renderRoomCard = (room: Room) => (
    <Paper
      key={room.id}
      elevation={selectedRoom?.id === room.id ? 8 : 1}
      sx={{
        p: 2,
        cursor: 'pointer',
        border: selectedRoom?.id === room.id ? 
          `2px solid ${theme.palette.primary.main}` : 
          '2px solid transparent',
        '&:hover': {
          elevation: 4,
          backgroundColor: theme.palette.action.hover
        }
      }}
      onClick={() => setSelectedRoom(room)}
    >
      <Typography variant="h6" gutterBottom>
        {room.name}
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Typography color="textSecondary">
        Loại: {room.type}
      </Typography>
      <Typography color="primary">
        Giá: {room.price_per_hour.toLocaleString()}đ/giờ
      </Typography>
      <Typography color="textSecondary">
        Sức chứa: {room.capacity} người
      </Typography>
      <Typography color="textSecondary">
        Trạng thái: {room.status}
      </Typography>
    </Paper>
  );

  const renderBookingTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Phòng</TableCell>
            <TableCell>Thời gian</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Tổng tiền</TableCell>
            <TableCell>Ghi chú</TableCell>
            <TableCell>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <CircularProgress sx={{ my: 2 }} />
              </TableCell>
            </TableRow>
          ) : bookings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Alert severity="info">Chưa có đặt phòng nào</Alert>
              </TableCell>
            </TableRow>
          ) : (
            bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.id}</TableCell>
                <TableCell>{booking.room_id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {new Date(booking.start_time).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      đến {new Date(booking.end_time).toLocaleString()}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      booking.status === 'pending' ? 'Chờ xác nhận' :
                      booking.status === 'confirmed' ? 'Đã xác nhận' :
                      booking.status === 'completed' ? 'Hoàn thành' :
                      'Đã hủy'
                    }
                    color={
                      booking.status === 'pending' ? 'warning' :
                      booking.status === 'confirmed' ? 'primary' :
                      booking.status === 'completed' ? 'success' :
                      'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {Number(booking.total_amount) > 0 ? 
                    `${Number(booking.total_amount).toLocaleString()}đ` : 
                    '0đ'
                  }
                </TableCell>
                <TableCell>
                  <Typography noWrap sx={{ maxWidth: 200 }}>
                    {booking.notes || 'Không có ghi chú'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewBooking(booking.id)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  {booking.status === 'pending' && (
                    <>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleConfirmBooking(booking.id)}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Thời gian bắt đầu"
              type="datetime-local"
              value={bookingTime.start_time}
              onChange={(e) => setBookingTime({ 
                ...bookingTime, 
                start_time: e.target.value 
              })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              error={!!error && !bookingTime.start_time}
              inputProps={{
                min: new Date().toISOString().slice(0, 16)
              }}
            />
            <TextField
              label="Thời gian kết thúc"
              type="datetime-local"
              value={bookingTime.end_time}
              onChange={(e) => setBookingTime({ 
                ...bookingTime, 
                end_time: e.target.value 
              })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
              error={!!error && !bookingTime.end_time}
              inputProps={{
                min: bookingTime.start_time || new Date().toISOString().slice(0, 16)
              }}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 2 
          }}>
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                width: '100%', 
                p: 3 
              }}>
                <CircularProgress />
              </Box>
            ) : availableRooms.length === 0 ? (
              <Alert severity="info" sx={{ width: '100%' }}>
                Không có phòng trống trong khoảng thời gian này
              </Alert>
            ) : (
              availableRooms.map((room) => renderRoomCard(room))
            )}
          </Box>
        );
      case 2:
        if (!user) {
          return (
            <Alert severity="error">
              Vui lòng đăng nhập để tiếp tục
            </Alert>
          );
        }
        
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Thông tin đặt phòng
            </Typography>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Divider />
              <Typography variant="subtitle1">Thông tin phòng:</Typography>
              <Typography>
                <strong>Phòng:</strong> {selectedRoom?.name} ({selectedRoom?.type})
              </Typography>
              <Typography>
                <strong>Sức chứa:</strong> {selectedRoom?.capacity} người
              </Typography>
              <Typography>
                <strong>Giá phòng:</strong> {selectedRoom?.price_per_hour?.toLocaleString()}đ/giờ
              </Typography>
              
              <Divider />
              <Typography variant="subtitle1">Thời gian đặt phòng:</Typography>
              <Typography>
                <strong>Bắt đầu:</strong> {new Date(bookingTime.start_time).toLocaleString()}
              </Typography>
              <Typography>
                <strong>Kết thúc:</strong> {new Date(bookingTime.end_time).toLocaleString()}
              </Typography>
              <Typography>
                <strong>Thời lượng:</strong> {
                  Math.ceil(
                    (new Date(bookingTime.end_time).getTime() - new Date(bookingTime.start_time).getTime()) 
                    / (1000 * 60 * 60)
                  )
                } giờ
              </Typography>

              <Divider />
              <Typography variant="subtitle1">Thông tin khách hàng:</Typography>
              <Typography>
                <strong>Họ tên:</strong> {user.name}
              </Typography>
              <Typography>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography>
                <strong>Số điện thoại:</strong> {user.phone_number || 'Chưa cập nhật'}
              </Typography>
              
              <Divider />
              <TextField
                label="Ghi chú đặt phòng"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                placeholder="Nhập ghi chú về buổi đặt phòng (nếu có)"
              />
              
              <Divider />
              <Typography variant="subtitle1">Tổng chi phí:</Typography>
              <Typography variant="h6" color="primary">
                <strong>Thành tiền:</strong> {
                  ((selectedRoom?.price_per_hour || 0) * 
                  Math.ceil(
                    (new Date(bookingTime.end_time).getTime() - new Date(bookingTime.start_time).getTime()) 
                    / (1000 * 60 * 60)
                  )).toLocaleString()
                }đ
              </Typography>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Đặt phòng
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2, mb: 4 }}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Quay lại
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              color="primary"
            >
              Xác nhận đặt phòng
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Tiếp tục
            </Button>
          )}
        </Box>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Danh sách đặt phòng
      </Typography>

      {renderBookingTable()}
    </Container>
  );
};

export default Bookings;