import React, { useState, useEffect, Key } from 'react';
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
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { Room, Booking } from '../types/interfaces';
import { bookingService } from '../services/bookingService';
import { ApiResponse } from '../types/interfaces';
import { useAuth } from '../contexts/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { roomService } from 'services/roomService';
import { BookingWithRoom } from '../types/interfaces';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`booking-tabpanel-${index}`}
      aria-labelledby={`booking-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}


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
  const [allBookings, setAllBookings] = useState<BookingWithRoom[]>([]);
  const [personalBookings, setPersonalBookings] = useState<BookingWithRoom[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const steps = ['Chọn thời gian', 'Chọn phòng', 'Xác nhận'];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    console.log('Current user:', user);
    
    if (!user) {
      setError('Vui lòng đăng nhập để đặt phòng');
      return;
    }
    
    // Load rooms first, then bookings
    const initData = async () => {
      await loadRooms();
      await loadBookings();
    };
    
    initData();
  }, [user]);

  const loadRooms = async () => {
    try {
      const response = await roomService.getAllRooms();
      if (response.success) {
        setRooms(response.data);
        console.log('Rooms loaded:', response.data);
      }
    } catch (err: any) {
      console.error('Error loading rooms:', err);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingService.getAllBookings();
      if (response.success) {
        console.log('Bookings loaded:', response.data);
        
        // Ensure rooms are loaded before processing bookings
        let roomsList = rooms;
        if (roomsList.length === 0) {
          const roomsResponse = await roomService.getAllRooms();
          if (roomsResponse.success) {
            roomsList = roomsResponse.data;
            setRooms(roomsList);
          }
        }
        
        // Get room details for each booking
        const bookingsWithRoomDetails = response.data.map((booking) => {
          const room = roomsList.find(r => r.id === booking.room_id);
          
          return {
            ...booking,
            roomName: room?.name || `Phòng ${booking.room_id}`,
            roomType: room?.type || 'Unknown'
          };
        });
        
        setAllBookings(bookingsWithRoomDetails);
        
        // Filter personal bookings
        if (user?.id) {
          const userBookings = bookingsWithRoomDetails.filter(booking => booking.customer_id === user.id);
          setPersonalBookings(userBookings);
        }
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
        // Tạo đối tượng Date từ giá trị input
        const start = new Date(bookingTime.start_time);
        const end = new Date(bookingTime.end_time);
        
        // Điều chỉnh múi giờ - thêm 7 giờ để bù đắp việc toISOString() sẽ chuyển về UTC
        const startWithOffset = new Date(start.getTime() + (7 * 60 * 60 * 1000));
        const endWithOffset = new Date(end.getTime() + (7 * 60 * 60 * 1000));
        
        // Chuyển đổi sang chuỗi ISO để gửi đến API
        const startISO = startWithOffset.toISOString();
        const endISO = endWithOffset.toISOString();
        
        console.log('Sending dates to API:', { 
          startISO, 
          endISO,
          originalStart: start.toString(),
          originalEnd: end.toString()
        });

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
      // Lấy thời gian từ form
      const startInput = bookingTime.start_time;
      const endInput = bookingTime.end_time;
      
      // Tạo đối tượng Date với thông tin múi giờ địa phương
      const start = new Date(startInput);
      const end = new Date(endInput);
      
      // Tính thời lượng và tổng tiền
      const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      const totalAmount = Number(durationHours * selectedRoom.price_per_hour);

      console.log('Local time representation:', {
        startInput,
        endInput,
        start: start.toString(),
        end: end.toString(),
        startISO: start.toISOString(),
        endISO: end.toISOString()
      });

      const bookingData = {
        room_id: selectedRoom.id,
        customer_id: user.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'pending' as const,
        total_amount: totalAmount,
        notes: bookingNotes || "Không có ghi chú"
      };

      console.log('Booking data before send:', bookingData);

      const response = await bookingService.createBooking({
        ...bookingData,
        room_id: selectedRoom.id!
      });
      
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
      setLoading(true);
      // Cập nhật trạng thái booking thành 'confirmed'
      const response = await bookingService.updateBooking(id, { status: 'confirmed' });
      
      if (response.success) {
        // Tải lại danh sách booking và phòng
        await loadRooms();
        await loadBookings();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi xác nhận đặt phòng');
    } finally {
      setLoading(false);
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

  const handleCompleteBooking = async (id?: number) => {
    if (!id) return;
    if (!window.confirm('Xác nhận trả phòng?')) return;
    
    try {
      setLoading(true);
      
      // Tìm booking để lấy thông tin
      const booking = allBookings.find(b => b.id === id);
      if (!booking) {
        throw new Error('Không tìm thấy thông tin đặt phòng');
      }
      
      // Tìm thông tin phòng
      const room = rooms.find(r => r.id === booking.room_id);
      if (!room) {
        throw new Error('Không tìm thấy thông tin phòng');
      }
      
      // Tính thời gian sử dụng thực tế
      const startTime = new Date(booking.start_time);
      const endTime = new Date(); // Thời điểm hiện tại
      const durationHours = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));
      
      // Tính lại tổng tiền
      const totalAmount = durationHours * room.price_per_hour;
      
      // Sử dụng phương thức mới để trả phòng
      const response = await bookingService.completeBooking(id, endTime, totalAmount);
      
      if (response.success) {
        // Tải lại danh sách booking và phòng
        await loadRooms();
        await loadBookings();
        
        alert(`Trả phòng thành công! Tổng thời gian sử dụng: ${durationHours} giờ. Tổng tiền: ${totalAmount.toLocaleString()}đ`);
      }
    } catch (err: any) {
      console.error('Error completing booking:', err);
      setError(err.message || 'Lỗi khi trả phòng');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tiện ích để hiển thị thời gian nhất quán
  const formatLocalDateTime = (dateString: string) => {
    const date = new Date(dateString);
    
    // Hiển thị thời gian theo múi giờ Việt Nam
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'Asia/Ho_Chi_Minh'
    });
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
        Trạng thái: {(room as any).status || 'Trống'}
      </Typography>
    </Paper>
  );

  const renderBookingTable = (bookings: BookingWithRoom[], isPersonal: boolean) => {
    return (
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
              {isPersonal && <TableCell>Thao tác</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isPersonal ? 7 : 6} align="center">
                  <CircularProgress sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPersonal ? 7 : 6} align="center">
                  <Alert severity="info">Chưa có đặt phòng nào</Alert>
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.id?.toString()}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {booking.roomName || `Phòng ${booking.room_id}`}
                    </Typography>
                    {booking.roomType && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Loại: {booking.roomType}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {formatLocalDateTime(booking.start_time)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        đến {formatLocalDateTime(booking.end_time)}
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
                  {isPersonal && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewBooking(Number(booking.id))}
                        title="Xem chi tiết"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {booking.status === 'pending' && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleConfirmBooking(Number(booking.id))}
                            title="Thanh toán"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelBooking(Number(booking.id))}
                            title="Hủy đặt phòng"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleCompleteBooking(Number(booking.id))}
                          title="Trả phòng"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

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
                <strong>Bắt đầu:</strong> {formatLocalDateTime(bookingTime.start_time)}
              </Typography>
              <Typography>
                <strong>Kết thúc:</strong> {formatLocalDateTime(bookingTime.end_time)}
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

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="booking tabs"
            variant="fullWidth"
          >
            <Tab label="Đặt phòng của tôi" />
            <Tab label="Tất cả đặt phòng" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {renderBookingTable(personalBookings, true)}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderBookingTable(allBookings, false)}
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Bookings;