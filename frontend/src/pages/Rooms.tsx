import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Room, RoomStatus, Booking } from '../types/interfaces';

// Define RoomWithStatus type that extends Room with status property
type RoomWithStatus = Room & { status: RoomStatus };

import { roomService } from '../services/roomService';
import { bookingService } from '../services/bookingService';

const Rooms = () => {
  const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithStatus | null>(null);
  const [formData, setFormData] = useState<RoomWithStatus>({
    name: '',
    type: 'Standard',
    price_per_hour: 0,
    capacity: 0,
    status: 'available'
  });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      if (response.success) {
        // Thêm trạng thái mặc định cho mỗi phòng
        const roomsWithStatus: RoomWithStatus[] = response.data.map(room => ({
          ...room,
          status: 'available' // Giá trị mặc định
        }));
        setRooms(roomsWithStatus);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      // Cast room to RoomWithStatus with a default status
      const roomWithStatus: RoomWithStatus = {
        ...room,
        status: 'available' // Default status since Room doesn't have status property
      };
      setSelectedRoom(roomWithStatus);
      setFormData({
        name: room.name,
        type: room.type || 'Standard',
        price_per_hour: room.price_per_hour,
        capacity: room.capacity,
        status: 'available' // Default status
      });
    } else {
      setSelectedRoom(null);
      setFormData({
        name: '',
        type: 'Standard',
        price_per_hour: 0,
        capacity: 0,
        status: 'available'
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (selectedRoom?.id) {
        await roomService.updateRoom(selectedRoom.id, formData);
      } else {
        await roomService.createRoom(formData);
      }
      await loadRooms();
      setOpenDialog(false);
    } catch (err: any) {
      setError(err.message || 'Error saving room');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    
    try {
      setLoading(true);
      await roomService.deleteRoom(id);
      await loadRooms();
      setError(''); // Xóa thông báo lỗi nếu có
    } catch (err: any) {
      console.error('Error deleting room:', err);
      // Hiển thị thông báo lỗi từ server hoặc thông báo mặc định
      setError(err.response?.data?.message || 'Lỗi khi xóa phòng');
      
      // Nếu lỗi liên quan đến booking, hiển thị thông báo cụ thể
      if (err.response?.data?.message?.includes('đơn đặt phòng liên quan')) {
        setError('Không thể xóa phòng vì có đơn đặt phòng liên quan. Vui lòng hủy hoặc hoàn thành các đơn đặt phòng trước khi xóa.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Xóa hàm isRoomOccupied
  // const isRoomOccupied = (roomId: number | undefined) => {
  //   if (!roomId) return false;
  //   
  //   // Check if there's an active booking for this room
  //   const now = new Date();
  //   return bookings.some((booking: Booking) => 
  //     booking.room_id === roomId && 
  //     booking.status === 'confirmed' && 
  //     new Date(booking.start_time) <= now && 
  //     new Date(booking.end_time) > now
  //   );
  // };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quản lý phòng</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Thêm phòng mới
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {loading ? (
          <Box display="flex" justifyContent="center" width="100%" p={4}>
            <CircularProgress />
          </Box>
        ) : rooms.map(room => {
          return (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{room.name}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {room.type || 'Standard Room'}
                  </Typography>
                  <Typography variant="body2">
                    Giá: {room.price_per_hour?.toLocaleString()}đ/giờ
                  </Typography>
                  <Typography variant="body2">
                    Sức chứa: {room.capacity} người
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleOpenDialog(room)}
                    >
                      Sửa
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="error"
                      onClick={() => room.id !== undefined && handleDelete(room.id)}
                      disabled={room.status === 'occupied'}
                    >
                      Xóa
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }} noValidate>
            <TextField
              fullWidth
              label="Tên phòng"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Loại phòng</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Loại phòng"
              >
                <MenuItem value="VIP">VIP</MenuItem>
                <MenuItem value="Standard">Standard</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Giá/giờ"
              value={formData.price_per_hour}
              onChange={(e) => setFormData({ ...formData, price_per_hour: Number(e.target.value) })}
              margin="normal"
            />
            <TextField
              fullWidth
              type="number"
              label="Sức chứa"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              margin="normal"
            />
            {/* <FormControl fullWidth margin="normal">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as RoomStatus })}
              >
                <MenuItem value="available">Trống</MenuItem>
                <MenuItem value="occupied">Đang sử dụng</MenuItem>
                <MenuItem value="maintenance">Bảo trì</MenuItem>
              </Select>
            </FormControl> */}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Rooms;