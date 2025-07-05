import React, { useState, useEffect, Key } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tab,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  DialogContentText,
  Grid,
  Collapse
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
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Tooltip from '@mui/material/Tooltip';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import NoteIcon from '@mui/icons-material/Note';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { calculatePaymentStatus, PaymentStatus, isUnpaid, isPartiallyPaid, needsPayment, isPaid } from '../utils/bookingUtils';
import { notifySuccess, notifyError, notifyWarning } from '../utils/notificationUtils';
import { confirmDialog } from '../utils/confirmUtils';
import AddToCartButton from '../components/AddToCartButton';
import { useBookingCart } from '../contexts/BookingCartContext';

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
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
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
  // Thêm state để quản lý đặt nhiều phòng
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  // Thêm state cho các dialog
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [paymentAmount, setPaymentAmount] = useState(0);
  // Thêm state để quản lý nhóm đặt phòng
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});

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

  // Hàm sắp xếp bookings theo trạng thái
  const sortBookingsByStatus = (bookings: BookingWithRoom[]) => {
    // Định nghĩa thứ tự ưu tiên của các trạng thái
    const statusPriority: { [key: string]: number } = {
      'pending': 1,
      'confirmed': 2,
      'completed': 3,
      'cancelled': 4
    };

    // Sắp xếp bookings theo thứ tự ưu tiên trạng thái
    return [...bookings].sort((a, b) => {
      // Sắp xếp theo trạng thái trước
      const statusComparison = statusPriority[a.status] - statusPriority[b.status];

      // Nếu cùng trạng thái, sắp xếp theo thời gian bắt đầu (mới nhất lên đầu)
      if (statusComparison === 0) {
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      }

      return statusComparison;
    });
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

        // Process bookings with room details (backend already provides rooms array)
        const bookingsWithRoomDetails = response.data.map((booking) => {
          // Backend already provides rooms array with room details
          return {
            ...booking,
            // Keep the rooms array from backend
            rooms: booking.rooms || []
          };
        });

        // Sắp xếp bookings theo trạng thái
        const sortedBookings = sortBookingsByStatus(bookingsWithRoomDetails);
        setAllBookings(sortedBookings);

        // Filter personal bookings
        if (user?.id) {
          const userBookings = sortedBookings.filter(booking => booking.customer_id === user.id);
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
      if (!validateTime()) {
        return;
      }

      try {
        setLoading(true);
        console.log('Finding available rooms with times:', {
          start: bookingTime.start_time,
          end: bookingTime.end_time
        });

        const response = await bookingService.findAvailableRooms(
          bookingTime.start_time,
          bookingTime.end_time
        );

        if (response.success) {
          setAvailableRooms(response.data);
          if (response.data.length === 0) {
            setError('Không có phòng trống trong khoảng thời gian này');
            return;
          }
          setError('');
          setActiveStep((prev) => prev + 1);
        } else {
          // Handle unsuccessful response
          setError(response.message || 'Lỗi khi tìm phòng trống');
        }
      } catch (err: any) {
        console.error('Error finding available rooms:', err);

        // More detailed error handling
        if (err.message) {
          setError(err.message);
        } else {
          setError('Lỗi không xác định khi tìm phòng trống');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (activeStep === 1) {
      if (selectedRooms.length === 0) {
        setError('Vui lòng chọn ít nhất một phòng');
        return;
      }
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

    console.log('Validating times:', {
      start: start.toISOString(),
      end: end.toISOString(),
      now: now.toISOString()
    });

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Định dạng thời gian không hợp lệ');
      return false;
    }

    if (start >= end) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu');
      return false;
    }

    // Comment out for testing with future dates
    // if (start < now) {
    //   setError('Không thể đặt phòng trong quá khứ');
    //   return false;
    // }

    return true;
  };

  const handleSubmit = async () => {
    // Chuyển đến trang xác nhận đặt phòng
    if (selectedRooms.length === 0 || !user?.id) {
      setError('Vui lòng đăng nhập và chọn ít nhất một phòng');
      return;
    }

    if (!validateTime()) return;

    // Tính số giờ và chuẩn bị dữ liệu
    const start = new Date(bookingTime.start_time);
    const end = new Date(bookingTime.end_time);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));

    // Chuẩn bị dữ liệu phòng đã chọn với thời gian và giá
    const selectedRoomsWithDetails = selectedRooms.map(room => ({
      ...room,
      start_time: bookingTime.start_time,
      end_time: bookingTime.end_time,
      hours: hours,
      subtotal: (room.price_per_hour || 0) * hours
    }));

    // Chuyển đến trang xác nhận
    navigate('/booking-confirmation', {
      state: {
        selectedRooms: selectedRoomsWithDetails,
        originalStartTime: bookingTime.start_time,
        originalEndTime: bookingTime.end_time,
        notes: bookingNotes
      }
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedRooms([]);
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

      const bookingToConfirm = allBookings.find(b => b.id === id);
      if (!bookingToConfirm) {
        notifyError('Không tìm thấy đặt phòng để xác nhận.');
        setLoading(false);
        return;
      }

      const response = await bookingService.confirmBooking(id);

      if (response.success) {
        // Nếu booking chính được xác nhận, xác nhận tất cả các booking room liên quan
        if (bookingToConfirm.rooms && bookingToConfirm.rooms.length > 0) {
          await Promise.all(bookingToConfirm.rooms.map(async (room) => {
            if (room.id) { // Đảm bảo room.id tồn tại
              await bookingService.confirmBookingRoom(Number(room.id));
            }
          }));
        }
        notifySuccess('Xác nhận đặt phòng thành công!');
        await loadRooms();
        await loadBookings();
      } else {
        notifyError(response.message || 'Lỗi khi xác nhận đặt phòng.');
      }
    } catch (err: any) {
      console.error('Error confirming booking:', err);
      notifyError(err.response?.data?.message || 'Lỗi khi xác nhận đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id?: number) => {
    if (!id) return;

    const confirmed = await confirmDialog({
      message: 'Bạn có chắc muốn hủy đặt phòng này?'
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      const bookingToCancel = allBookings.find(b => b.id === id);
      if (!bookingToCancel) {
        notifyError('Không tìm thấy đặt phòng để hủy.');
        setLoading(false);
        return;
      }
      const response = await bookingService.cancelBooking(id);
      if (response.success) {
        // Nếu booking chính được hủy, hủy tất cả các booking room liên quan
        if (bookingToCancel.rooms && bookingToCancel.rooms.length > 0) {
          await Promise.all(bookingToCancel.rooms.map(async (room) => {
            if (room.id) { // Đảm bảo room.id tồn tại
              await bookingService.cancelBookingRoom(Number(room.id));
            }
          }));
        }
        notifySuccess('Đã hủy đặt phòng thành công');
        await loadBookings();
      } else {
        notifyError(response.message || 'Lỗi khi hủy đặt phòng');
      }
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      notifyError('Không thể hủy đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBooking = async (id: number) => {
    const confirmed = await confirmDialog({
      message: 'Bạn có chắc muốn trả phòng và thanh toán?'
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      // Tìm booking trong danh sách
      const booking = allBookings.find(b => b.id === id);
      if (!booking) {
        setError('Không tìm thấy thông tin đặt phòng');
        notifyError('Không tìm thấy thông tin đặt phòng');
        return;
      }

      // Tìm thông tin phòng
      const room = rooms.find(r => r.id === booking.room_id);
      if (!room) {
        setError('Không tìm thấy thông tin phòng');
        notifyError('Không tìm thấy thông tin phòng');
        return;
      }

      // Tính thời gian sử dụng thực tế
      const startTime = new Date(booking.start_time);
      const endTime = new Date(); // Thời điểm hiện tại
      const durationHours = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));

      // Tính lại tổng tiền
      const totalAmount = durationHours * room.price_per_hour;

      // Sử dụng phương thức mới để trả phòng và thanh toán
      const response = await bookingService.completeBookingWithPayment(id, endTime, totalAmount);

      if (response.success) {
        // Tải lại danh sách booking và phòng
        await loadRooms();
        await loadBookings();

        notifySuccess(`Trả phòng thành công! Tổng thời gian sử dụng: ${durationHours} giờ. Tổng tiền: ${totalAmount.toLocaleString()}đ`);
      }
    } catch (err: any) {
      console.error('Error completing booking:', err);
      setError(err.response?.data?.message || 'Lỗi khi trả phòng');
      notifyError('Lỗi khi trả phòng và thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendBooking = (id: number) => {
    // Mở dialog để gia hạn thời gian
    setSelectedBookingId(id);
    setExtendDialogOpen(true);
  };

  const handlePayment = (id: number) => {
    // Mở dialog thanh toán
    setSelectedBookingId(id);
    setPaymentDialogOpen(true);
  };

  // Hàm tiện ích để hiển thị thời gian nhất quán
  const formatLocalDateTime = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) {
      return 'N/A';
    }
    let date: Date;
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) {
      return 'N/A'; // Hoặc một thông báo lỗi khác
    }

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
      elevation={selectedRooms.some(r => r.id === room.id) ? 8 : 1}
      sx={{
        p: 2,
        border: selectedRooms.some(r => r.id === room.id) ?
          `2px solid ${theme.palette.primary.main}` :
          '2px solid transparent',
        '&:hover': {
          elevation: 4,
          backgroundColor: theme.palette.action.hover
        }
      }}
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

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <Button
          variant={selectedRooms.some(r => r.id === room.id) ? "contained" : "outlined"}
          onClick={() => toggleRoomSelection(room)}
          size="small"
          sx={{ flex: 1 }}
        >
          {selectedRooms.some(r => r.id === room.id) ? 'Đã chọn' : 'Chọn phòng'}
        </Button>

        <AddToCartButton
          room={room}
          variant="outlined"
          size="small"
        />
      </Box>
    </Paper>
  );

  // Hàm để mở rộng/thu gọn một nhóm đặt phòng
  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Hàm để nhóm các đặt phòng theo booking_group_id hoặc thời gian
  const groupBookings = (bookings: BookingWithRoom[]) => {
    const groups: {[key: string]: BookingWithRoom[]} = {};

    bookings.forEach(booking => {
      // Nếu có booking_group_id, nhóm theo đó
      if (booking.booking_group_id) {
        const groupKey = `group-${booking.booking_group_id}`;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(booking);
      } else {
        // Nếu không có booking_group_id, tạo key dựa trên thời gian và customer_id
        const timeKey = `single-${booking.id}`;
        groups[timeKey] = [booking];
      }
    });

    return groups;
  };

  // Hàm tính tổng tiền cho một nhóm đặt phòng
  const calculateGroupTotal = (bookings: BookingWithRoom[]) => {
    return bookings.reduce((total, booking) => total + Number(booking.total_amount || 0), 0);
  };

  // Thêm hàm xử lý thanh toán nhóm
  const handleGroupCheckout = async (groupId: number, bookings: BookingWithRoom[]) => {
    if (!window.confirm('Bạn có chắc chắn muốn thanh toán tất cả các phòng trong nhóm này?')) {
      return;
    }

    try {
      setLoading(true);

      // Tính tổng tiền của tất cả các phòng trong nhóm
      const totalAmount = calculateGroupTotal(bookings);

      // Thời gian hiện tại làm thời gian trả phòng
      const checkoutTime = new Date();

      const response = await bookingService.completeBookingGroup(
        groupId,
        checkoutTime,
        totalAmount,
        'cash', // Mặc định là tiền mặt
        'Thanh toán nhóm đặt phòng' // Ghi chú mặc định
      );

      if (response.success) {
        alert('Thanh toán nhóm đặt phòng thành công!');
        // Tải lại danh sách đặt phòng
        await loadBookings();
      } else {
        setError('Không thể thanh toán nhóm đặt phòng');
      }
    } catch (err: any) {
      console.error('Error completing group checkout:', err);
      setError(err.response?.data?.message || 'Lỗi khi thanh toán nhóm đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  // Render bảng đặt phòng với nhóm
  const renderBookingsTable = (bookings: BookingWithRoom[], isPersonal: boolean) => {
    // Nhóm các đặt phòng
    const groupedBookings = groupBookings(bookings);

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
            ) : Object.keys(groupedBookings).length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPersonal ? 7 : 6} align="center">
                  <Alert severity="info">Chưa có đặt phòng nào</Alert>
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedBookings).map(([groupKey, bookingsInGroup]) => {
                const isGroup = groupKey.startsWith('group-') && bookingsInGroup.length > 1;
                const bookingOrGroup = isGroup ? {
                  id: groupKey,
                  start_time: new Date(Math.min(...bookingsInGroup.map(b => new Date(b.start_time).getTime()))).toISOString(),
                  end_time: new Date(Math.max(...bookingsInGroup.map(b => new Date(b.end_time).getTime()))).toISOString(),
                  total_amount: calculateGroupTotal(bookingsInGroup),
                  notes: bookingsInGroup[0].notes || 'Không có ghi chú',
                  status: (() => {
                    let status = 'completed';
                    if (bookingsInGroup.some(b => b.status === 'pending')) status = 'pending';
                    else if (bookingsInGroup.some(b => b.status === 'confirmed')) status = 'confirmed';
                    else if (bookingsInGroup.some(b => b.status === 'cancelled')) status = 'cancelled';
                    return status;
                  })(),
                  payment_status: (() => {
                    let paymentStatus: PaymentStatus = 'paid';
                    if (bookingsInGroup.some(b => isUnpaid(calculatePaymentStatus(b)))) {
                      paymentStatus = 'unpaid';
                    } else if (bookingsInGroup.some(b => isPartiallyPaid(calculatePaymentStatus(b)))) {
                      paymentStatus = 'partially_paid';
                    }
                    return paymentStatus;
                  })(),
                  rooms: bookingsInGroup.flatMap(b => b.rooms || []),
                } : bookingsInGroup[0];

                const expanded = expandedGroups[groupKey] || false;

                return (
                  <React.Fragment key={groupKey}>
                    <TableRow
                      hover
                      sx={{
                        cursor: 'pointer',
                        '& > *': { borderBottom: 'unset' },
                        bgcolor: expanded ? 'action.selected' : 'inherit',
                      }}
                      onClick={() => toggleGroupExpand(groupKey)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {(bookingOrGroup.rooms && bookingOrGroup.rooms.length > 0) ? (expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />) : null}
                          <Typography sx={{ ml: 1 }}>{isGroup ? `#${groupKey.split('-')[1]}` : bookingOrGroup.id?.toString()}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isGroup ? (
                          <Typography variant="body2" color="primary">Tổng: {bookingOrGroup.rooms?.length || 0} phòng</Typography>
                        ) : (
                          <Typography variant="body2" fontWeight="medium">
                            {bookingOrGroup.rooms?.[0]?.room_name || 'Chưa xác định'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{formatLocalDateTime(bookingOrGroup.start_time)}</Typography>
                          <Typography variant="caption" color="text.secondary">đến {formatLocalDateTime(bookingOrGroup.end_time)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          console.log('Booking Room Status:', bookingOrGroup.status);
                          const status = bookingOrGroup.status;
                          let label = '';
                          let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
                          if (status === 'cancelled') {
                            label = 'Đã hủy'; color = 'error';
                          } else if (status === 'completed') {
                            label = 'Hoàn thành'; color = 'success';
                          } else if (bookingOrGroup.payment_status === 'paid') {
                            label = 'Đã thanh toán'; color = 'success';
                          } else if (status === 'pending') {
                            label = 'Chờ xác nhận'; color = 'warning';
                          } else if (status === 'confirmed') {
                            label = 'Đã xác nhận';
                            color = 'primary';
                          } else {
                            label = 'Chưa thanh toán'; color = 'error';
                          }
                          return <Chip label={label} color={color} size="small" sx={{ fontWeight: 500, fontSize: 13 }} />;
                        })()}
                      </TableCell>
                      <TableCell align="right">{Number(bookingOrGroup.total_amount || 0).toLocaleString()}đ</TableCell>
                      <TableCell>{bookingOrGroup.notes || 'Không có ghi chú'}</TableCell>
                      {isPersonal && (
                        <TableCell>
                          {isGroup ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {bookingOrGroup.status === 'pending' && (
                                <>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDialog({
                                        message: 'Xác nhận tất cả các đặt phòng trong nhóm này?'
                                      }).then(confirmed => {
                                        if (confirmed) {
                                          Promise.all(
                                            bookingsInGroup.map(async booking => {
                                              await handleConfirmBooking(Number(booking.id));
                                            })
                                          );
                                        }
                                      });
                                    }}
                                    title="Xác nhận tất cả"
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDialog({
                                        message: 'Hủy tất cả các đặt phòng trong nhóm này?'
                                      }).then(confirmed => {
                                        if (confirmed) {
                                          Promise.all(
                                            bookingsInGroup.map(async booking => {
                                              await handleCancelBooking(Number(booking.id));
                                            })
                                          );
                                        }
                                      });
                                    }}
                                    title="Hủy tất cả"
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}

                              {bookingOrGroup.status === 'confirmed' && (
                                <Tooltip title="Hủy tất cả (có thể phát sinh phí phạt)">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDialog({
                                        message: 'Đặt phòng đã được xác nhận. Việc hủy có thể phát sinh phí phạt. Bạn có chắc chắn muốn hủy tất cả?'
                                      }).then(confirmed => {
                                        if (confirmed) {
                                          Promise.all(
                                            bookingsInGroup.map(async booking => {
                                              await handleCancelBooking(Number(booking.id));
                                            })
                                          );
                                        }
                                      });
                                    }}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {(bookingOrGroup.status === 'completed' || bookingOrGroup.status === 'cancelled') && (
                                <Typography variant="caption" color="text.secondary">
                                  Không có thao tác
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>{renderBookingActions(bookingOrGroup as BookingWithRoom)}</Box>
                          )}
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Collapsible content for rooms in the booking/group */}
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isPersonal ? 7 : 6}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1, py: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                              {isGroup ? `Chi tiết các phòng trong nhóm ${groupKey.split('-')[1]}` : `Chi tiết phòng #${bookingOrGroup.id}`}
                            </Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Tên phòng</TableCell>
                                  <TableCell>Loại</TableCell>
                                  <TableCell>Thời gian</TableCell>
                                  <TableCell align="right">Số giờ</TableCell>
                                  <TableCell align="right">Giá/giờ</TableCell>
                                  <TableCell align="right">Thành tiền</TableCell>
                                  <TableCell>Trạng thái</TableCell>
                                  <TableCell>Thanh toán</TableCell>
                                  <TableCell>Thao tác</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(bookingOrGroup.rooms || []).map((room, idx) => {
                                  const start = (room.start_time && !isNaN(new Date(room.start_time).getTime())) ? new Date(room.start_time) : null;
                                  const end = (room.end_time && !isNaN(new Date(room.end_time).getTime())) ? new Date(room.end_time) : null;
                                  const hours = (start && end) ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)) : 0;

                                  const pricePerHour = Number(room.price_per_hour); // Đảm bảo là số
                                  const subtotal = hours * pricePerHour; // Phép tính an toàn

                                  return (
                                    <TableRow key={room.id || idx}>
                                      <TableCell>{room.room_name || `Phòng ${room.room_id}`}</TableCell>
                                      <TableCell>{room.room_type || 'Standard'}</TableCell>
                                      <TableCell>
                                        {(start && end) ?
                                          `${formatLocalDateTime(start)} - ${formatLocalDateTime(end)}` :
                                          'N/A'
                                        }
                                      </TableCell>
                                      <TableCell align="right">{hours !== 0 ? hours : 'N/A'}</TableCell>
                                      <TableCell align="right">{pricePerHour !== 0 ? pricePerHour.toLocaleString() + 'đ' : 'N/A'}</TableCell>
                                      <TableCell align="right">{subtotal !== 0 ? subtotal.toLocaleString() + 'đ' : 'N/A'}</TableCell>
                                      <TableCell>
                                        {(() => {
                                          console.log('Booking Room Status:', room.status);
                                          const roomStatus = room.status;
                                          let label = '';
                                          let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

                                          if (roomStatus === 'pending') {
                                            label = 'Chờ xác nhận';
                                            color = 'warning';
                                          } else if (roomStatus === 'completed') {
                                            label = 'Hoàn thành';
                                            color = 'success';
                                          } else if (roomStatus === 'cancelled') {
                                            label = 'Đã hủy';
                                            color = 'error';
                                          } else if (roomStatus === 'confirmed') {
                                            label = 'Đã xác nhận';
                                            color = 'primary';
                                          } else {
                                            label = 'Không xác định';
                                            color = 'default';
                                          }

                                          return (
                                            <Chip
                                              label={label}
                                              color={color}
                                              size="small"
                                            />
                                          );
                                        })()}
                                      </TableCell>
                                      <TableCell>
                                        <Chip
                                          label={room.payment_status ? (
                                            room.payment_status === 'unpaid' ? 'Chưa thanh toán'
                                            : room.payment_status === 'partially_paid' ? 'Đã thanh toán một phần'
                                            : room.payment_status === 'paid' ? 'Đã thanh toán'
                                            : 'Không xác định'
                                          ) : 'N/A'}
                                          color={room.payment_status === 'unpaid' ? 'error'
                                            : room.payment_status === 'partially_paid' ? 'warning'
                                            : room.payment_status === 'paid' ? 'success'
                                            : 'default' as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                                          size="small"
                                          sx={{ fontWeight: 500, fontSize: 12 }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                          {room.status === 'pending' && (
                                            <IconButton
                                              size="small"
                                              color="primary"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleConfirmIndividualBookingRoom(Number(room.id), Number(bookingOrGroup.id));
                                              }}
                                              title="Xác nhận phòng này"
                                            >
                                              <CheckCircleIcon fontSize="small" />
                                            </IconButton>
                                          )}
                                          {(room.status === 'pending' || room.status === 'confirmed') && (
                                            <IconButton
                                              size="small"
                                              color="error"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancelIndividualBookingRoom(Number(room.id), Number(bookingOrGroup.id));
                                              }}
                                              title="Hủy phòng này"
                                            >
                                              <CancelIcon fontSize="small" />
                                            </IconButton>
                                          )}
                                          {(room.status === 'completed' || room.status === 'cancelled') && (
                                            <Typography variant="caption" color="text.secondary">
                                              Không có thao tác
                                            </Typography>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Helper function to render booking actions based on status
  const renderBookingActions = (booking: BookingWithRoom) => {
    const actions = [];

    // Các nút thao tác dựa trên trạng thái đặt phòng
    if (booking.status === 'pending') {
      // Nút xác nhận cho đặt phòng đang chờ
      actions.push(
        <Button
          key="confirm"
          variant="contained"
          color="primary"
          size="small"
          onClick={() => handleConfirmBooking(booking.id)}
          sx={{ mr: 1 }}
        >
          Xác nhận
        </Button>
      );

      // Nút hủy cho đặt phòng đang chờ
      actions.push(
        <Button
          key="cancel"
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleCancelBooking(booking.id)}
        >
          Hủy
        </Button>
      );
    }

    // Nút thanh toán cho đặt phòng đã xác nhận VÀ cần thanh toán
    if (needsPayment(calculatePaymentStatus(booking))) {
      actions.push(
        <Button
          key="checkout"
          variant="contained"
          color="success"
          size="small"
          onClick={() => {
            // Chuyển đến trang thanh toán với ID đặt phòng
            console.log('Attempting to navigate to checkout for booking ID:', booking.id);
            if (booking.id) {
              window.location.href = `/checkout/${booking.id}`;
            } else {
              console.error('Booking ID is undefined, cannot navigate to checkout.');
            }
          }}
          sx={{ mr: 1 }}
        >
          Thanh toán
        </Button>
      );
    }

    // Nút gia hạn chỉ cho đặt phòng đã xác nhận VÀ đã thanh toán hoặc thanh toán một phần
    if (booking.status === 'confirmed' && (isPaid(calculatePaymentStatus(booking)) || isPartiallyPaid(calculatePaymentStatus(booking)))) {
      actions.push(
        <Button
          key="extend"
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => handleExtendBooking(booking.id!)}
          sx={{ mr: 1 }}
        >
          Gia hạn
        </Button>
      );
    }

    // Nút hủy cho đặt phòng đã xác nhận (không quan tâm trạng thái thanh toán)
    if (booking.status === 'confirmed') {
      actions.push(
        <Button
          key="cancel-confirmed"
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleCancelBooking(booking.id)}
        >
          Hủy
        </Button>
      );
    }

    return actions;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          <Box>
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
              // Hiển thị danh sách phòng dạng lưới
              <Grid container spacing={3}>
                {availableRooms.map((room) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                    <Paper
                      elevation={selectedRooms.some(r => r.id === room.id) ? 8 : 2}
                      sx={{
                        p: 3,
                        height: '100%',
                        cursor: 'pointer',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        border: selectedRooms.some(r => r.id === room.id) ?
                          `2px solid ${theme.palette.primary.main}` :
                          '2px solid transparent',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          backgroundColor: theme.palette.action.hover
                        }
                      }}
                      onClick={() => toggleRoomSelection(room)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {room.name}
                        </Typography>
                        <Checkbox
                          checked={selectedRooms.some(r => r.id === room.id)}
                          onChange={() => toggleRoomSelection(room)}
                          onClick={(e) => e.stopPropagation()}
                          color="primary"
                          sx={{
                            '& .MuiSvgIcon-root': {
                              fontSize: 28,
                              transition: 'all 0.2s ease'
                            }
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box component="span" sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'info.main',
                            display: 'inline-block',
                            mr: 1
                          }}/>
                          Loại: {room.type || 'Standard'}
                        </Typography>

                        <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box component="span" sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'success.main',
                            display: 'inline-block',
                            mr: 1
                          }}/>
                          Sức chứa: {room.capacity} người
                        </Typography>
                      </Box>

                      <Box sx={{
                        mt: 'auto',
                        pt: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        bgcolor: 'primary.light',
                        borderRadius: 1,
                        p: 1
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
                          {room.price_per_hour?.toLocaleString()}đ/giờ
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            {selectedRooms.length > 0 && (
              <Paper sx={{ mt: 4, p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  Đã chọn {selectedRooms.length} phòng
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  {selectedRooms.map(room => (
                    <Grid item xs={12} sm={6} md={4} key={room.id}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'background.default'
                      }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {room.name}
                          </Typography>
                          <Typography variant="body2" color="primary">
                            {room.price_per_hour?.toLocaleString()}đ/giờ
                          </Typography>
                        </Box>
                        <IconButton
                          edge="end"
                          onClick={() => toggleRoomSelection(room)}
                          color="error"
                          size="small"
                          sx={{
                            bgcolor: 'error.light',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.main' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
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

        // Tính toán thời gian và chi phí
        const bookingHours = Math.ceil(
          (new Date(bookingTime.end_time).getTime() - new Date(bookingTime.start_time).getTime())
          / (1000 * 60 * 60)
        );

        const totalCost = selectedRooms.reduce((total, room) =>
          total + ((room.price_per_hour || 0) * bookingHours), 0
        );

        return (
          <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', mb: 3 }}>
              Xác nhận đặt phòng
            </Typography>

            <Grid container spacing={3}>
              {/* Thông tin người đặt */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccountCircle sx={{ mr: 1 }} />
                    Thông tin người đặt
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Họ tên:</strong> {user.name}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {user.email}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Số điện thoại:</strong> {user.phone_number || 'Chưa cập nhật'}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Thông tin thời gian */}
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon sx={{ mr: 1 }} />
                    Thông tin thời gian
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ pl: 1 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Bắt đầu:</strong> {formatLocalDateTime(bookingTime.start_time)}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <strong>Kết thúc:</strong> {formatLocalDateTime(bookingTime.end_time)}
                    </Typography>
                    <Typography variant="body1" color="primary.main" sx={{ fontWeight: 'medium' }}>
                      <strong>Thời gian sử dụng:</strong> {bookingHours} giờ
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Thông tin phòng đã chọn */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <MeetingRoomIcon sx={{ mr: 1 }} />
                    Phòng đã chọn ({selectedRooms.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <TableContainer component={Box} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tên phòng</TableCell>
                          <TableCell>Loại</TableCell>
                          <TableCell>Thời gian</TableCell>
                          <TableCell align="right">Số giờ</TableCell>
                          <TableCell align="right">Giá/giờ</TableCell>
                          <TableCell align="right">Thành tiền</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRooms.map(room => (
                          <TableRow key={room.id}>
                            <TableCell>{room.name}</TableCell>
                            <TableCell>{room.type || 'Standard'}</TableCell>
                            <TableCell>
                              {formatLocalDateTime(bookingTime.start_time)} - {formatLocalDateTime(bookingTime.end_time)}
                            </TableCell>
                            <TableCell align="right">{bookingHours}</TableCell>
                            <TableCell align="right">{Number(room.price_per_hour).toLocaleString()}đ</TableCell>
                            <TableCell align="right">{Number(room.price_per_hour * bookingHours).toLocaleString()}đ</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Ghi chú */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <NoteIcon sx={{ mr: 1 }} />
                    Ghi chú
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Nhập ghi chú về buổi đặt phòng (nếu có)"
                    variant="outlined"
                  />
                </Paper>
              </Grid>

              {/* Tổng thanh toán */}
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'primary.light',
                    color: 'white',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Tổng thanh toán:
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {totalCost.toLocaleString()}đ
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        );
    }
  };

  // Hàm để thêm/xóa phòng khỏi danh sách đã chọn
  const toggleRoomSelection = (room: Room) => {
    if (selectedRooms.some(r => r.id === room.id)) {
      setSelectedRooms(selectedRooms.filter(r => r.id !== room.id));
    } else {
      setSelectedRooms([...selectedRooms, room]);
    }
  };

  // Thêm các hàm xử lý cho dialog
  const handleExtendSubmit = async () => {
    // if (!selectedBookingId) return;

    // try {
    //   setLoading(true);

    //   // Tìm booking trong danh sách
    //   const booking = allBookings.find(b => b.id === selectedBookingId);
    //   if (!booking) {
    //     setError('Không tìm thấy thông tin đặt phòng');
    //     return;
    //   }

    //   // Tính thời gian kết thúc mới
    //   const currentEndTime = new Date(booking.end_time);
    //   const newEndTime = new Date(currentEndTime.getTime() + (extendHours * 60 * 60 * 1000));

    //   // Tìm thông tin phòng
    //   const room = rooms.find(r => r.id === booking.room_id);
    //   if (!room) {
    //     setError('Không tìm thấy thông tin phòng');
    //     return;
    //   }

    //   // Tính thêm tiền
    //   const additionalAmount = extendHours * room.price_per_hour;
    //   const newTotalAmount = Number(booking.total_amount) + additionalAmount;

    //   // Gọi API để gia hạn
    //   const response = await bookingService.extendBooking(
    //     selectedBookingId,
    //     newEndTime,
    //     newTotalAmount
    //   );

    //   if (response.success) {
    //     setExtendDialogOpen(false);
    //     await loadBookings();
    //   }
    // } catch (err: any) {
    //   console.error('Error extending booking:', err);
    //   setError(err.response?.data?.message || 'Lỗi khi gia hạn đặt phòng');
    // } finally {
    //   setLoading(false);
    // }
  };

  // Add this function to handle payment for a booking
  const handleRecordPayment = async (booking: BookingWithRoom) => {
    try {
      if (!booking.id) {
        alert('Không tìm thấy ID đặt phòng');
        return;
      }

      // Confirm with the user
      if (!window.confirm(`Xác nhận thanh toán cho đặt phòng #${booking.id} với số tiền ${Number(booking.total_amount).toLocaleString()}đ?`)) {
        return;
      }

      // Record payment and update status
      const response = await bookingService.recordPaymentAndUpdateStatus(
        booking.id,
        Number(booking.total_amount),
        'cash', // Default payment method
        'Thanh toán đặt phòng'
      );

      if (response.success) {
        alert('Thanh toán thành công!');
        // Reload bookings to update the UI
        await loadBookings();
      } else {
        alert(`Lỗi: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      alert(`Lỗi khi thanh toán: ${error.message || 'Lỗi không xác định'}`);
    }
  };

  // Thêm hàm tính toán trạng thái thanh toán
  const calculatePaymentStatus = (booking: BookingWithRoom) => {
    // Nếu không có total_amount hoặc total_amount = 0, không cần thanh toán
    if (!booking.total_amount || booking.total_amount <= 0) {
      return 'paid';
    }

    // Nếu booking đã hủy, không cần thanh toán
    if (booking.status === 'cancelled') {
      return 'paid';
    }

    // Trong thực tế, bạn cần gọi API để kiểm tra xem booking này đã có payment chưa
    // Hoặc backend cần trả về thông tin này dựa trên bảng payments

    // Mặc định là chưa thanh toán
    return 'unpaid';
  };

  const handleConfirmIndividualBookingRoom = async (roomBookingId: number, bookingId: number) => {
    try {
      const response = await bookingService.confirmBookingRoom(roomBookingId);
      if (response.success) {
        notifySuccess('Xác nhận phòng thành công!');
        // Sau khi xác nhận phòng con, kiểm tra và xác nhận booking mẹ nếu nó đang ở trạng thái pending
        const parentBooking = allBookings.find(b => b.id === bookingId);
        if (parentBooking && parentBooking.status === 'pending') {
          // Chỉ cập nhật trạng thái của booking mẹ, không xác nhận các booking room khác của nó
          await bookingService.updateBooking(bookingId, { status: 'confirmed' });
        }
        loadBookings(); // Tải lại danh sách bookings để cập nhật trạng thái
      } else {
        notifyError(response.message || 'Lỗi khi xác nhận phòng.');
      }
    } catch (err: any) {
      console.error('Error confirming individual booking room:', err);
      notifyError('Lỗi khi xác nhận phòng.');
    }
  };

  const handleCancelIndividualBookingRoom = async (roomBookingId: number, bookingId: number) => {
    try {
      const response = await bookingService.cancelBookingRoom(roomBookingId);
      if (response.success) {
        notifySuccess('Hủy phòng thành công!');
        loadBookings(); // Tải lại danh sách bookings để cập nhật trạng thái
      } else {
        notifyError(response.message || 'Lỗi khi hủy phòng.');
      }
    } catch (err: any) {
      console.error('Error canceling individual booking room:', err);
      notifyError('Lỗi khi hủy phòng.');
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom sx={{ mt: 3, mb: 4 }}>
        Đặt phòng
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Đặt phòng mới" />
          <Tab label="Đặt phòng của tôi" />
          <Tab label="Tất cả đặt phòng" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
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
          )}
          {tabValue === 1 && renderBookingsTable(personalBookings, true)}
          {tabValue === 2 && renderBookingsTable(allBookings, false)}
        </Box>
      </Paper>

      {/* Dialog gia hạn thời gian */}
      <Dialog open={extendDialogOpen} onClose={() => setExtendDialogOpen(false)}>
        <DialogTitle>Gia hạn thời gian</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Nhập số giờ muốn gia hạn thêm:
          </DialogContentText>
          <TextField
            autoFocus
            label="Số giờ"
            type="number"
            fullWidth
            value={extendHours}
            onChange={(e) => setExtendHours(Math.max(1, parseInt(e.target.value) || 1))}
            InputProps={{ inputProps: { min: 1 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExtendDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleExtendSubmit} color="primary">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog thanh toán */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Thanh toán</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Nhập số tiền thanh toán:
          </DialogContentText>
          <TextField
            autoFocus
            label="Số tiền"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Math.max(0, parseInt(e.target.value) || 0))}
            InputProps={{ inputProps: { min: 0 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)} color="error" variant="outlined">
            Hủy
          </Button>
          <Button onClick={() => {
            const booking = allBookings.find(b => b.id === selectedBookingId);
            if (booking) {
              handleRecordPayment(booking);
              setPaymentDialogOpen(false);
            } else {
              alert('Không tìm thấy thông tin đặt phòng');
            }
          }} color="primary" variant="contained">
            Xác nhận thanh toán
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Bookings;
