import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
  Room as RoomIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBookingConfirmation } from '../hooks/useBookingConfirmation';
import { useBookingCart } from '../contexts/BookingCartContext';
import { useNotification } from '../contexts/NotificationContext';

const BookingConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartItems, totalItems } = useBookingCart();
  const { notifySuccess } = useNotification();

  // Lấy dữ liệu từ navigation state
  const initialData = location.state;

  // Sử dụng custom hook để xử lý logic
  const {
    // States
    selectedRooms,
    availableRooms,
    editingRoom,
    showAddRoomDialog,
    loading,
    error,
    notes,
    totalAmount,
    originalStartTime,
    originalEndTime,

    // Actions
    handleEditRoom,
    handleSaveEdit,
    handleCancelEdit,
    handleRemoveRoom,
    handleAddRoom,
    handleShowAddRoomDialog,
    handleCloseAddRoomDialog,
    handleUpdateEditingRoom,
    handleUpdateNotes,
    handleGoBack,
    createBooking,
    clearError,

    // Utilities
    formatDateTime,
    formatTime
  } = useBookingConfirmation(initialData);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Xác nhận đặt phòng
      </Typography>

      {/* Thông tin thời gian gốc */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Khoảng thời gian đã lọc
          </Typography>
          <Typography>
            Từ: {formatDateTime(originalStartTime)} - Đến: {formatDateTime(originalEndTime)}
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Thời gian của từng phòng phải nằm trong khoảng này
          </Alert>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Danh sách phòng đã chọn */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              <RoomIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Phòng đã chọn ({selectedRooms.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleShowAddRoomDialog}
              disabled={availableRooms.length === 0}
            >
              Thêm phòng
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Phòng</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Giờ</TableCell>
                  <TableCell>Giá/giờ</TableCell>
                  <TableCell>Thành tiền</TableCell>
                  <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>
                      <Chip label={room.type} size="small" />
                    </TableCell>
                    <TableCell>
                      {formatTime(room.start_time)} - {formatTime(room.end_time)}
                    </TableCell>
                    <TableCell>{room.hours}h</TableCell>
                    <TableCell>{room.price_per_hour.toLocaleString()}đ</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {room.subtotal.toLocaleString()}đ
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRoom(room)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRoom(room.id!)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Tổng tiền và ghi chú */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <MoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Thông tin thanh toán
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Tổng tiền:</Typography>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {totalAmount.toLocaleString()}đ
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Ghi chú"
            value={notes}
            onChange={(e) => handleUpdateNotes(e.target.value)}
            placeholder="Nhập ghi chú cho đơn đặt phòng..."
          />
        </CardContent>
      </Card>

      {/* Nút hành động */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={handleGoBack}
          disabled={loading}
        >
          Quay lại
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              // Just add to cart without navigating
              selectedRooms.forEach(room => {
                addToCart(
                  {
                    id: room.id,
                    name: room.name,
                    type: room.type,
                    capacity: room.capacity,
                    price_per_hour: room.price_per_hour
                  },
                  room.start_time,
                  room.end_time,
                  notes
                );
              });

              // Show success notification
              notifySuccess(`🛒 Đã thêm ${selectedRooms.length} phòng vào giỏ hàng! Giỏ hàng hiện có ${totalItems + selectedRooms.length} booking.`);
            }}
            disabled={loading}
          >
            🛒 Thêm vào giỏ ({totalItems > 0 ? `${totalItems} trong giỏ` : 'Giỏ trống'})
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              // Add to cart and navigate to continue booking
              selectedRooms.forEach(room => {
                addToCart(
                  {
                    id: room.id,
                    name: room.name,
                    type: room.type,
                    capacity: room.capacity,
                    price_per_hour: room.price_per_hour
                  },
                  room.start_time,
                  room.end_time,
                  notes
                );
              });

              // Navigate to bookings page to add more
              navigate('/bookings', {
                state: {
                  message: `Đã thêm ${selectedRooms.length} phòng vào giỏ hàng. Tiếp tục đặt thêm phòng khác.`
                }
              });
            }}
            disabled={loading}
          >
            ➕ Đặt thêm booking khác
          </Button>

          <Button
            variant="contained"
            onClick={createBooking}
            disabled={loading || selectedRooms.length === 0}
            size="large"
          >
            {loading ? 'Đang xử lý...' : `✅ Đặt ngay (${totalAmount.toLocaleString()}đ)`}
          </Button>
        </Box>
      </Box>

      {/* Dialog sửa thời gian phòng */}
      <Dialog open={!!editingRoom} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Sửa thời gian - {editingRoom?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Thời gian bắt đầu"
                type="datetime-local"
                value={editingRoom?.start_time?.slice(0, 16) || ''}
                onChange={(e) => handleUpdateEditingRoom('start_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Thời gian kết thúc"
                type="datetime-local"
                value={editingRoom?.end_time?.slice(0, 16) || ''}
                onChange={(e) => handleUpdateEditingRoom('end_time', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mt: 2 }}>
            Thời gian phải nằm trong khoảng: {formatDateTime(originalStartTime)} - {formatDateTime(originalEndTime)}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Hủy</Button>
          <Button onClick={handleSaveEdit} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog thêm phòng */}
      <Dialog open={showAddRoomDialog} onClose={handleCloseAddRoomDialog} maxWidth="md" fullWidth>
        <DialogTitle>Thêm phòng vào đơn đặt</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {availableRooms.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{room.name}</Typography>
                    <Typography color="textSecondary">{room.type}</Typography>
                    <Typography>Sức chứa: {room.capacity} người</Typography>
                    <Typography color="primary" fontWeight="bold">
                      {room.price_per_hour.toLocaleString()}đ/giờ
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 2 }}
                      onClick={() => handleAddRoom(room)}
                    >
                      Thêm vào đơn
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {availableRooms.length === 0 && (
            <Alert severity="info">
              Không còn phòng trống nào trong khoảng thời gian này
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddRoomDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingConfirmation;
