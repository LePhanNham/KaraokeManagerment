import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Money as CashIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Room as RoomIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import paymentService from '../services/paymentService';
import { UnpaidBooking, PaymentData } from '../types/interfaces';

const Payment: React.FC = () => {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [bookings, setBookings] = useState<UnpaidBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<UnpaidBooking | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [expandedBookings, setExpandedBookings] = useState<Set<number>>(new Set());
  const [paymentForm, setPaymentForm] = useState<PaymentData>({
    amount: 0,
    payment_method: 'cash',
    notes: ''
  });

  // Load unpaid bookings
  useEffect(() => {
    loadUnpaidBookings();
  }, []);

  const loadUnpaidBookings = async () => {
    try {
      setLoading(true);
      const unpaidBookings = await paymentService.getUnpaidBookings();

      console.log('=== REAL BACKEND DATA ===');
      unpaidBookings.forEach(booking => {
        console.log(`Booking #${booking.id}:`);
        console.log(`  total_amount: ${booking.total_amount} (${typeof booking.total_amount})`);
        booking.rooms.forEach(room => {
          console.log(`  Room ${room.room_name}:`);
          console.log(`    price_per_hour: ${room.price_per_hour} (${typeof room.price_per_hour})`);
          console.log(`    hours: ${room.hours} (${typeof room.hours})`);
          console.log(`    subtotal: ${room.subtotal} (${typeof room.subtotal})`);
        });

        const roomsTotal = booking.rooms.reduce((sum, room) => sum + Number(room.subtotal), 0);
        console.log(`  Rooms total: ${roomsTotal}`);
        console.log(`  Booking total: ${booking.total_amount}`);
        console.log(`  Match: ${roomsTotal === Number(booking.total_amount)}`);
      });

      setBookings(unpaidBookings);
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (booking: UnpaidBooking) => {
    setSelectedBooking(booking);
    setPaymentForm({
      booking_id: booking.id,
      amount: booking.total_amount,
      payment_method: 'cash',
      notes: `Thanh toán toàn bộ booking #${booking.id} - ${booking.customer_name}`
    });
    setShowPaymentDialog(true);
  };

  const processPayment = async () => {
    try {
      setLoading(true);

      if (selectedBooking) {
        // Single booking payment - pay for all rooms in booking
        for (const room of selectedBooking.rooms) {
          const paymentData = {
            booking_id: selectedBooking.id,
            booking_room_id: room.id, // Track which room was paid
            amount: Number(room.subtotal),
            payment_method: paymentForm.payment_method,
            notes: `${paymentForm.notes} - Phòng ${room.room_name}`
          };

          await paymentService.processPayment(paymentData);
        }
        notifySuccess('Thanh toán thành công!');
        // Reload bookings to update the list
        loadUnpaidBookings();
      } else {
        // Multiple rooms payment
        await processMultipleRoomsPayment();
        notifySuccess('Thanh toán nhiều phòng thành công!');
        // Reload bookings to update the list
        loadUnpaidBookings();
      }

      setShowPaymentDialog(false);
      setSelectedBooking(null);
      setSelectedRooms(new Set());

    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processMultipleRoomsPayment = async () => {
    // Prepare payment items for multiple payment API
    const paymentItems: any[] = [];

    bookings.forEach(booking => {
      const selectedBookingRooms = booking.rooms.filter(room => selectedRooms.has(room.id));
      selectedBookingRooms.forEach(room => {
        paymentItems.push({
          booking_id: booking.id,
          booking_room_id: room.id,
          amount: Number(room.subtotal),
          description: `Phòng ${room.room_name} - Booking #${booking.id}`
        });
      });
    });

    console.log('=== MULTIPLE PAYMENT ITEMS ===');
    console.log('Payment items:', paymentItems);
    console.log('Total items:', paymentItems.length);
    console.log('Total amount:', paymentItems.reduce((sum, item) => sum + item.amount, 0));

    // Use new multiple payment API
    await paymentService.processMultiplePayment(
      paymentItems,
      paymentForm.payment_method,
      paymentForm.notes || 'Thanh toán nhiều phòng từ các booking khác nhau'
    );
  };

  // Helper functions for room selection
  const toggleBookingExpansion = (bookingId: number) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  const toggleRoomSelection = (roomId: number) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const toggleBookingSelection = (booking: UnpaidBooking) => {
    const roomIds = booking.rooms.map(room => room.id);
    const allSelected = roomIds.every(id => selectedRooms.has(id));

    setSelectedRooms(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all rooms in this booking
        roomIds.forEach(id => newSet.delete(id));
      } else {
        // Select all rooms in this booking
        roomIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const getSelectedAmount = () => {
    let total = 0;
    bookings.forEach(booking => {
      booking.rooms.forEach(room => {
        if (selectedRooms.has(room.id)) {
          // Ensure subtotal is a number
          const subtotal = typeof room.subtotal === 'number' ? room.subtotal : parseFloat(room.subtotal) || 0;
          total += subtotal;
        }
      });
    });
    return total;
  };

  const getSelectedBookingsCount = () => {
    const bookingIds = new Set<number>();
    bookings.forEach(booking => {
      booking.rooms.forEach(room => {
        if (selectedRooms.has(room.id)) {
          bookingIds.add(booking.id);
        }
      });
    });
    return bookingIds.size;
  };

  const getSelectedRoomsSummary = () => {
    const summary: Array<{
      bookingId: number;
      customerName: string;
      rooms: any[];
      total: number;
    }> = [];

    bookings.forEach(booking => {
      const selectedBookingRooms = booking.rooms.filter(room => selectedRooms.has(room.id));
      if (selectedBookingRooms.length > 0) {
        const total = selectedBookingRooms.reduce((sum, room) => sum + Number(room.subtotal), 0);
        summary.push({
          bookingId: booking.id,
          customerName: booking.customer_name,
          rooms: selectedBookingRooms,
          total
        });
      }
    });

    return summary;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <CashIcon />;
      case 'card': return <CreditCardIcon />;
      case 'bank_transfer': return <BankIcon />;
      default: return <PaymentIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Quản lý thanh toán
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Danh sách các booking đã xác nhận và cần thanh toán
      </Typography>

      {bookings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Không có booking nào cần thanh toán
            </Typography>
            <Typography color="text.secondary">
              Tất cả booking đã được thanh toán hoặc chưa có booking nào được xác nhận
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* Selection Summary */}
          {selectedRooms.size > 0 && (
            <Card sx={{
              mb: 3,
              bgcolor: 'primary.50',
              border: '2px solid',
              borderColor: 'primary.200',
              borderRadius: 2,
              boxShadow: 3
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ReceiptIcon color="primary" />
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      Đã chọn {selectedRooms.size} phòng
                    </Typography>
                  </Box>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {paymentService.formatPrice(getSelectedAmount())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={() => {
                      setPaymentForm(prev => ({ ...prev, amount: getSelectedAmount() }));
                      setShowPaymentDialog(true);
                    }}
                    disabled={selectedRooms.size === 0}
                    sx={{ px: 3, py: 1.5 }}
                  >
                    Thanh toán đã chọn
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setSelectedRooms(new Set())}
                    sx={{ px: 3, py: 1.5 }}
                  >
                    Bỏ chọn tất cả
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Booking List */}
          {bookings.map((booking) => {
            const roomIds = booking.rooms.map(room => room.id);
            const allSelected = roomIds.every(id => selectedRooms.has(id));
            const someSelected = roomIds.some(id => selectedRooms.has(id));
            const isExpanded = expandedBookings.has(booking.id);

            return (
              <Accordion
                key={booking.id}
                expanded={isExpanded}
                onChange={() => toggleBookingExpansion(booking.id)}
                sx={{
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': {
                    borderColor: 'primary.main',
                    boxShadow: 4
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: allSelected ? 'primary.50' : 'grey.50',
                    borderRadius: '8px 8px 0 0',
                    '&.Mui-expanded': {
                      borderRadius: isExpanded ? '8px 8px 0 0' : 2
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" width="100%" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={() => toggleBookingSelection(booking)}
                      sx={{ mr: 2 }}
                      color="primary"
                    />
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                            Booking #{booking.id} - {booking.customer_name}
                          </Typography>

                          {/* Detailed Time Display */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                              Ngày: {new Date(booking.start_time).toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                              Thời gian: {new Date(booking.start_time).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(booking.end_time).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight="medium" sx={{ ml: 3 }}>
                              Tổng thời gian: {Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60))} giờ
                            </Typography>
                          </Box>
                        </Box>

                        <Box textAlign="right" sx={{ ml: 2 }}>
                          <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {paymentService.formatPrice(booking.total_amount)}
                          </Typography>
                          <Chip
                            label={paymentService.getStatusLabel(booking.status)}
                            color={paymentService.getStatusColor(booking.status)}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {booking.rooms.length} phòng
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ bgcolor: 'grey.50', p: 3 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold" color="primary.main">
                    <RoomIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Danh sách phòng ({booking.rooms.length} phòng)
                  </Typography>

                  <List sx={{ bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    {booking.rooms.map((room, index) => (
                      <ListItem
                        key={room.id}
                        divider={index < booking.rooms.length - 1}
                        sx={{
                          py: 2,
                          bgcolor: selectedRooms.has(room.id) ? 'primary.50' : 'white',
                          '&:hover': { bgcolor: selectedRooms.has(room.id) ? 'primary.100' : 'grey.50' }
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={selectedRooms.has(room.id)}
                            onChange={() => toggleRoomSelection(room.id)}
                            color="primary"
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                              <Typography variant="h6" fontWeight="bold">{room.room_name}</Typography>
                              <Chip
                                label={room.room_type}
                                size="small"
                                color={room.room_type === 'VIP' ? 'warning' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                <strong>Thời gian:</strong> {room.hours} giờ
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Đơn giá:</strong> {paymentService.formatPrice(room.price_per_hour)}/giờ
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box textAlign="right">
                            <Typography variant="h5" color="primary.main" fontWeight="bold">
                              {paymentService.formatPrice(room.subtotal)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {room.hours}h × {paymentService.formatPrice(room.price_per_hour)}
                            </Typography>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => toggleBookingSelection(booking)}
                    >
                      {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PaymentIcon />}
                      onClick={() => handlePayment(booking)}
                    >
                      Thanh toán booking này
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Xử lý thanh toán
        </DialogTitle>
        <DialogContent>
          {selectedBooking ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Booking #{selectedBooking.id} - {selectedBooking.customer_name}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Số tiền thanh toán"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    InputProps={{
                      endAdornment: 'đ'
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Phương thức thanh toán</InputLabel>
                    <Select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value as any }))}
                      label="Phương thức thanh toán"
                    >
                      <MenuItem value="cash">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CashIcon /> Tiền mặt
                        </Box>
                      </MenuItem>
                      <MenuItem value="card">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CreditCardIcon /> Thẻ tín dụng
                        </Box>
                      </MenuItem>
                      <MenuItem value="bank_transfer">
                        <Box display="flex" alignItems="center" gap={1}>
                          <BankIcon /> Chuyển khoản
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={3}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ghi chú về thanh toán (tùy chọn)"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Tổng thanh toán:</Typography>
                <Typography variant="h5" color="primary">
                  {paymentService.formatPrice(paymentForm.amount)}
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Thanh toán {selectedRooms.size} phòng từ {getSelectedBookingsCount()} booking khác nhau
              </Alert>

              {/* Show selected rooms summary */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Danh sách phòng đã chọn:
                </Typography>
                {getSelectedRoomsSummary().map((item, index) => (
                  <Box key={index} sx={{ mb: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Booking #{item.bookingId} - {item.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.rooms.map(r => r.room_name).join(', ')} - {paymentService.formatPrice(item.total)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Phương thức thanh toán</InputLabel>
                    <Select
                      value={paymentForm.payment_method}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value as any }))}
                      label="Phương thức thanh toán"
                    >
                      <MenuItem value="cash">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CashIcon /> Tiền mặt
                        </Box>
                      </MenuItem>
                      <MenuItem value="card">
                        <Box display="flex" alignItems="center" gap={1}>
                          <CreditCardIcon /> Thẻ tín dụng
                        </Box>
                      </MenuItem>
                      <MenuItem value="bank_transfer">
                        <Box display="flex" alignItems="center" gap={1}>
                          <BankIcon /> Chuyển khoản
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ghi chú"
                    multiline
                    rows={3}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Ghi chú về thanh toán (tùy chọn)"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Tổng thanh toán:</Typography>
                <Typography variant="h5" color="primary">
                  {paymentService.formatPrice(paymentForm.amount)}
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentDialog(false)}>Hủy</Button>
          <Button
            onClick={processPayment}
            variant="contained"
            disabled={loading || paymentForm.amount <= 0}
            startIcon={<PaymentIcon />}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payment;
