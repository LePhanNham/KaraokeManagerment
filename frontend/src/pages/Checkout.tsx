import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon
} from '@mui/icons-material';
import { bookingService } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import { BookingWithRoom } from '../types/interfaces';
import { calculatePaymentStatus } from '../utils/bookingUtils';
import { notifySuccess, notifyError, notifyWarning } from '../utils/notificationUtils';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<BookingWithRoom[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<BookingWithRoom[]>([]);
  const [groupPaymentOpen, setGroupPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setLoading(false);
      setError('Vui lòng đăng nhập để xem thanh toán');
    }
  }, [user]);

  // Tính tổng tiền của các booking được chọn
  useEffect(() => {
    const total = selectedBookings.reduce(
      (sum, booking) => sum + calculateBookingAmount(booking),
      0
    );
    setTotalAmount(total);
  }, [selectedBookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAllBookings();

      if (response.success) {
        // Filter to only get confirmed bookings for the current user that haven't been paid
        const unpaidBookings = response.data.filter(
          (booking: BookingWithRoom) =>
            booking.status === 'confirmed' &&
            booking.customer_id === user?.id &&
            (calculatePaymentStatus(booking) === 'unpaid' || calculatePaymentStatus(booking) === 'partially_paid')
        );

        setBookings(unpaidBookings);
      }
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách đặt phòng');
    } finally {
      setLoading(false);
    }
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

  const handleViewBooking = (id: number) => {
    navigate(`/bookings/${id}`);
  };

  const handlePayment = (id: number) => {
    navigate(`/checkout/${id}`);
  };

  // Tính toán số tiền cần thanh toán cho một booking
  const calculateBookingAmount = (booking: BookingWithRoom) => {
    // Nếu đã có total_amount, sử dụng nó
    if (booking.total_amount) {
      return Number(booking.total_amount);
    }

    // Nếu không, tính dựa trên thời gian sử dụng và giá phòng
    const startTime = new Date(booking.start_time);
    const endTime = new Date(); // Thời điểm hiện tại
    const hoursUsed = Math.max(1, Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)));

    // Lấy giá phòng theo giờ từ thông tin phòng (nếu có)
    // Kiểm tra các thuộc tính có thể chứa thông tin giá phòng
    let hourlyRate = 0;
    if ('room' in booking && booking.room && 'price_per_hour' in booking.room) {
      hourlyRate = Number(booking.room.price_per_hour) || 0;
    } else if ('hourly_rate' in booking) {
      hourlyRate = Number((booking as any).hourly_rate) || 0;
    } else if ('room_price' in booking) {
      hourlyRate = Number((booking as any).room_price) || 0;
    } else {
      // Giá mặc định nếu không tìm thấy thông tin giá
      hourlyRate = 100000; // 100,000 VND/giờ
      console.warn(`Không tìm thấy thông tin giá phòng cho booking ${booking.id}, sử dụng giá mặc định`);
    }

    return hoursUsed * hourlyRate;
  };

  // Xử lý chọn/bỏ chọn một booking
  const handleToggleBooking = (booking: BookingWithRoom) => {
    setSelectedBookings(prev => {
      const isSelected = prev.some(b => b.id === booking.id);
      if (isSelected) {
        return prev.filter(b => b.id !== booking.id);
      } else {
        return [...prev, booking];
      }
    });
  };

  // Xử lý chọn/bỏ chọn tất cả
  const handleToggleAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings([...bookings]);
    }
  };

  // Mở dialog thanh toán nhóm
  const handleOpenGroupPayment = () => {
    if (selectedBookings.length === 0) {
      notifyWarning('Vui lòng chọn ít nhất một phòng để thanh toán');
      return;
    }
    setGroupPaymentOpen(true);
  };

  // Xử lý thanh toán nhiều phòng
  const handleGroupPayment = async () => {
    try {
      setLoading(true);

      // Thời gian hiện tại làm thời gian trả phòng
      const checkoutTime = new Date();

      // Nếu các phòng thuộc cùng một nhóm đặt phòng
      const firstBooking = selectedBookings[0];
      if (firstBooking.booking_group_id && selectedBookings.every(b => b.booking_group_id === firstBooking.booking_group_id)) {
        // Thanh toán cả nhóm
        const response = await bookingService.completeBookingGroup(
          Number(firstBooking.booking_group_id),
          checkoutTime,
          totalAmount,
          paymentMethod,
          paymentNotes
        );

        if (response.success) {
          notifySuccess('Thanh toán nhóm đặt phòng thành công!');
          setGroupPaymentOpen(false);
          setSelectedBookings([]);
          await loadBookings();
        } else {
          setError('Không thể hoàn tất thanh toán nhóm');
        }
      } else {
        // Thanh toán từng phòng một
        let successCount = 0;

        for (const booking of selectedBookings) {
          try {
            const amount = calculateBookingAmount(booking);
            const response = await bookingService.completeBookingWithPayment(
              Number(booking.id),
              checkoutTime,
              amount,
              paymentMethod,
              paymentNotes
            );

            if (response.success) {
              successCount++;
            }
          } catch (err) {
            console.error(`Error completing payment for booking ${booking.id}:`, err);
          }
        }

        if (successCount === selectedBookings.length) {
          notifySuccess('Thanh toán tất cả các phòng thành công!');
        } else if (successCount > 0) {
          notifySuccess(`Đã thanh toán ${successCount}/${selectedBookings.length} phòng thành công!`);
        } else {
          notifyError('Không thể thanh toán bất kỳ phòng nào!');
        }

        setGroupPaymentOpen(false);
        setSelectedBookings([]);
        await loadBookings();
      }
    } catch (err: any) {
      console.error('Error processing group payment:', err);
      setError(err.response?.data?.message || 'Lỗi khi xử lý thanh toán nhóm');
    } finally {
      setLoading(false);
    }
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            Thanh toán
          </Typography>

          {bookings.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PaymentIcon />}
              onClick={handleOpenGroupPayment}
              disabled={selectedBookings.length === 0}
            >
              Thanh toán {selectedBookings.length > 0 ? `(${selectedBookings.length})` : ''}
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {bookings.length === 0 ? (
          <Alert severity="info">
            Không có đặt phòng nào cần thanh toán.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedBookings.length > 0 && selectedBookings.length < bookings.length}
                      checked={bookings.length > 0 && selectedBookings.length === bookings.length}
                      onChange={handleToggleAll}
                    />
                  </TableCell>
                  <TableCell>Phòng</TableCell>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thanh toán</TableCell>
                  <TableCell align="right">Tổng tiền</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => {
                  const isSelected = selectedBookings.some(b => b.id === booking.id);
                  const bookingAmount = calculateBookingAmount(booking);

                  return (
                    <TableRow
                      key={booking.id}
                      selected={isSelected}
                      hover
                      onClick={() => handleToggleBooking(booking)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => handleToggleBooking(booking)}
                        />
                      </TableCell>
                      <TableCell>{booking.roomName || `Phòng ${booking.room_id}`}</TableCell>
                      <TableCell>{user?.name || 'Khách hàng'}</TableCell>
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
                          label="Đã xác nhận"
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            calculatePaymentStatus(booking) === 'unpaid' ? 'Chưa thanh toán' :
                            calculatePaymentStatus(booking) === 'partially_paid' ? 'Thanh toán một phần' :
                            'Đã thanh toán'
                          }
                          color={
                            calculatePaymentStatus(booking) === 'unpaid' ? 'error' :
                            calculatePaymentStatus(booking) === 'partially_paid' ? 'warning' :
                            'success'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {bookingAmount > 0 ?
                          `${bookingAmount.toLocaleString()}đ` :
                          '0đ'
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex' }}>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewBooking(Number(booking.id));
                            }}
                            title="Xem chi tiết"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayment(Number(booking.id));
                            }}
                            title="Thanh toán"
                          >
                            <PaymentIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {selectedBookings.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        Tổng cộng ({selectedBookings.length} phòng):
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {totalAmount.toLocaleString()}đ
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog thanh toán nhóm */}
      <Dialog open={groupPaymentOpen} onClose={() => setGroupPaymentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thanh toán nhiều phòng</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Phòng đã chọn: {selectedBookings.length}
            </Typography>

            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Phòng</TableCell>
                    <TableCell align="right">Số tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedBookings.map(booking => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.roomName || `Phòng ${booking.room_id}`}</TableCell>
                      <TableCell align="right">{calculateBookingAmount(booking).toLocaleString()}đ</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Tổng cộng
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight="bold">
                        {totalAmount.toLocaleString()}đ
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <FormControl fullWidth sx={{ mb: 3 }}>
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
              rows={3}
              fullWidth
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupPaymentOpen(false)}>Hủy</Button>
          <Button
            onClick={handleGroupPayment}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Checkout;



