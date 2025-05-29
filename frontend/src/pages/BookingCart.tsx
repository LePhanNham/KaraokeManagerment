import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Grid,
  Divider,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Room as RoomIcon
} from '@mui/icons-material';
import { useBookingCart } from '../contexts/BookingCartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import bookingCartService from '../services/bookingCartService';
import { useNavigate } from 'react-router-dom';

const BookingCart: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const {
    cartItems,
    totalAmount,
    totalItems,
    removeFromCart,
    updateCartItem,
    clearCart
  } = useBookingCart();

  const [loading, setLoading] = useState(false);
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    start_time: '',
    end_time: '',
    notes: ''
  });

  // Get cart statistics
  const cartStats = bookingCartService.getCartStats(cartItems);
  const sortedItems = bookingCartService.sortCartItems(cartItems, 'time');

  // Handle remove item
  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    notifySuccess('Đã xóa booking khỏi giỏ đặt phòng');
  };

  // Handle edit item
  const handleEditItem = (itemId: string) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      setEditForm({
        start_time: item.start_time.slice(0, 16), // Format for datetime-local
        end_time: item.end_time.slice(0, 16),
        notes: item.notes || ''
      });
      setEditingItem(itemId);
    }
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingItem) return;

    // Validate time
    const timeError = bookingCartService.validateBookingTime(
      editForm.start_time,
      editForm.end_time
    );

    if (timeError) {
      notifyError(timeError);
      return;
    }

    updateCartItem(editingItem, {
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      notes: editForm.notes
    });

    setEditingItem(null);
    notifySuccess('Đã cập nhật booking');
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!user?.id) {
      notifyError('Vui lòng đăng nhập');
      return;
    }

    if (cartItems.length === 0) {
      notifyError('Giỏ đặt phòng trống');
      return;
    }

    // Validate cart
    const validationErrors = bookingCartService.validateCart(cartItems);
    if (validationErrors.length > 0) {
      notifyError(validationErrors.join('\n'));
      return;
    }

    try {
      setLoading(true);

      const checkoutData = bookingCartService.prepareCheckoutData(
        user.id,
        cartItems,
        checkoutNotes
      );

      const result = await bookingCartService.checkout(checkoutData);

      if (result.success) {
        notifySuccess(result.message);
        clearCart();
        setShowCheckoutDialog(false);
        navigate('/bookings', {
          state: { message: result.message }
        });
      }
    } catch (error: any) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Giỏ đặt phòng trống
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Bạn chưa thêm booking nào vào giỏ đặt phòng
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/bookings')}
        >
          Đặt phòng ngay
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🛒 Giỏ đặt phòng
      </Typography>

      {/* Cart Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {cartStats.totalItems}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Booking
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {cartStats.uniqueRooms}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phòng
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {cartStats.totalHours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng thời gian
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {bookingCartService.formatPrice(totalAmount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng tiền
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cart Items */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            Danh sách booking ({totalItems})
          </Typography>

          {sortedItems.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <RoomIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {item.room.name}
                        </Typography>
                        <Chip
                          label={item.room.type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon color="action" />
                      <Box>
                        <Typography variant="body2">
                          {bookingCartService.formatDate(item.start_time)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bookingCartService.formatTime(item.start_time)} - {bookingCartService.formatTime(item.end_time)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.hours} giờ
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={2}>
                    <Typography variant="h6" color="primary" textAlign="right">
                      {bookingCartService.formatPrice(item.subtotal)}
                    </Typography>
                  </Grid>
                </Grid>

                {item.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ghi chú: {item.notes}
                  </Typography>
                )}

                <Box display="flex" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleEditItem(item.id)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveItem(item.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Checkout Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tóm tắt đặt phòng
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText primary="Số booking" />
                  <ListItemSecondaryAction>
                    <Typography>{totalItems}</Typography>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Tổng thời gian" />
                  <ListItemSecondaryAction>
                    <Typography>{cartStats.totalHours} giờ</Typography>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="h6">Tổng cộng</Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Typography variant="h6" color="primary">
                      {bookingCartService.formatPrice(totalAmount)}
                    </Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PaymentIcon />}
                  onClick={() => setShowCheckoutDialog(true)}
                  disabled={cartItems.length === 0}
                >
                  Xác nhận đặt phòng
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/bookings')}
                >
                  Tiếp tục đặt phòng
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  color="error"
                  sx={{ mt: 1 }}
                  onClick={clearCart}
                >
                  Xóa tất cả
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onClose={() => setEditingItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa booking</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Thời gian bắt đầu"
              type="datetime-local"
              value={editForm.start_time}
              onChange={(e) => setEditForm(prev => ({ ...prev, start_time: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Thời gian kết thúc"
              type="datetime-local"
              value={editForm.end_time}
              onChange={(e) => setEditForm(prev => ({ ...prev, end_time: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Ghi chú"
              multiline
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingItem(null)}>Hủy</Button>
          <Button onClick={handleSaveEdit} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onClose={() => setShowCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Xác nhận đặt phòng</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bạn sắp đặt {totalItems} booking với tổng tiền {bookingCartService.formatPrice(totalAmount)}
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            Thanh toán sẽ được thực hiện riêng biệt sau khi đặt phòng thành công.
          </Alert>

          <TextField
            fullWidth
            label="Ghi chú cho nhóm đặt phòng"
            multiline
            rows={3}
            value={checkoutNotes}
            onChange={(e) => setCheckoutNotes(e.target.value)}
            placeholder="Nhập ghi chú cho toàn bộ nhóm đặt phòng (tùy chọn)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckoutDialog(false)}>Hủy</Button>
          <Button
            onClick={handleCheckout}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingCart;
