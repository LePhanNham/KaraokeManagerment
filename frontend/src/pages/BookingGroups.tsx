import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Collapse,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import { BookingWithRoom } from '../types/interfaces';
import { calculatePaymentStatus } from '../utils/bookingUtils';
import { notifySuccess, notifyError, notifyWarning } from '../utils/notificationUtils';
import { confirmDialog } from '../utils/confirmUtils';

const BookingGroups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookingGroups, setBookingGroups] = useState<{ [key: string]: BookingWithRoom[] }>({});
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookingGroups();
  }, [user]);

  const loadBookingGroups = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await bookingService.getAllBookings();

      if (response.success) {
        // Filter to only get the user's bookings
        const userBookings = response.data.filter(
          (booking: BookingWithRoom) => booking.customer_id === user.id
        );

        // Group bookings by booking_group_id
        const groups: { [key: string]: BookingWithRoom[] } = {};

        userBookings.forEach((booking: BookingWithRoom) => {
          // Skip bookings that are already paid
          if (calculatePaymentStatus(booking) === 'paid') {
            return;
          }

          // Only include bookings with a group_id
          if (booking.booking_group_id) {
            const groupKey = `group-${booking.booking_group_id}`;
            if (!groups[groupKey]) {
              groups[groupKey] = [];
            }
            groups[groupKey].push(booking);
          }
        });

        setBookingGroups(groups);
      }
    } catch (err: any) {
      console.error('Error loading booking groups:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
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

  const handlePayGroup = async (groupId: string) => {
    // Implement group payment logic
    notifySuccess(`Thanh toán nhóm đặt phòng #${groupId}`);
    // After payment is successful, reload the data
    await loadBookingGroups();
  };

  const handleDeleteGroup = async (groupId: string) => {
    const confirmed = await confirmDialog({
      message: 'Bạn có chắc muốn hủy tất cả các đặt phòng trong nhóm này?'
    });

    if (!confirmed) return;

    try {
      // Implement group cancellation logic
      // You might need to add a new API endpoint for this
      notifySuccess(`Đã hủy nhóm đặt phòng #${groupId}`);
      await loadBookingGroups();
    } catch (err: any) {
      console.error('Error cancelling booking group:', err);
      setError(err.response?.data?.message || 'Lỗi khi hủy nhóm đặt phòng');
      notifyError('Lỗi khi hủy nhóm đặt phòng');
    }
  };

  const calculateGroupTotal = (bookings: BookingWithRoom[]) => {
    return bookings.reduce((sum, booking) => sum + Number(booking.total_amount || 0), 0);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Nhóm đặt phòng</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/bookings')}
        >
          Đặt phòng mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {Object.keys(bookingGroups).length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info">
            Bạn chưa có nhóm đặt phòng nào cần thanh toán
          </Alert>
        </Paper>
      ) : (
        <Paper sx={{ width: '100%' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mã nhóm</TableCell>
                  <TableCell>Số phòng</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Tổng tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(bookingGroups).map(([groupKey, bookings]) => {
                  const groupId = groupKey.split('-')[1];
                  const isExpanded = expandedGroups[groupKey] || false;
                  const totalAmount = calculateGroupTotal(bookings);

                  // Get earliest start time and latest end time
                  const startTimes = bookings.map(b => new Date(b.start_time).getTime());
                  const endTimes = bookings.map(b => new Date(b.end_time).getTime());
                  const earliestStart = new Date(Math.min(...startTimes));
                  const latestEnd = new Date(Math.max(...endTimes));

                  return (
                    <React.Fragment key={groupKey}>
                      <TableRow
                        sx={{
                          '& > *': { borderBottom: 'unset' },
                          cursor: 'pointer',
                          bgcolor: isExpanded ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                        }}
                        onClick={() => toggleGroupExpand(groupKey)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            <Typography sx={{ ml: 1 }}>#{groupId}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{bookings.length} phòng</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatLocalDateTime(earliestStart)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            đến {formatLocalDateTime(latestEnd)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="primary">
                            {totalAmount.toLocaleString()}đ
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Chưa thanh toán"
                            color="error"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PaymentIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayGroup(groupId);
                            }}
                          >
                            Thanh toán
                          </Button>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(groupId);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expanded details */}
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ py: 2, px: 1 }}>
                              <Typography variant="h6" gutterBottom component="div">
                                Chi tiết đặt phòng
                              </Typography>
                              <Divider sx={{ mb: 2 }} />

                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Phòng</TableCell>
                                    <TableCell>Thời gian</TableCell>
                                    <TableCell>Trạng thái</TableCell>
                                    <TableCell>Giá tiền</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {bookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                      <TableCell>
                                        {booking.roomName || `Phòng ${booking.room_id}`}
                                      </TableCell>
                                      <TableCell>
                                        {formatLocalDateTime(booking.start_time)} - {formatLocalDateTime(booking.end_time)}
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
                                        {Number(booking.total_amount).toLocaleString()}đ
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default BookingGroups;
