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
import { Room, RoomStatus } from '../types';
import { roomService } from '../services/roomService';

const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<Room>({
    name: '',
    type: 'Thường',
    price_per_hour: 0,
    capacity: 0,
    status: 'available'
  });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      if (response.success) {
        setRooms(response.data);
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
      setSelectedRoom(room);
      setFormData({
        name: room.name,
        type: room.type || '',
        price_per_hour: room.price_per_hour,
        capacity: room.capacity,
        status: room.status
      });
    } else {
      setSelectedRoom(null);
      setFormData({
        name: '',
        type: 'Thường',
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
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    
    try {
      setLoading(true);
      await roomService.deleteRoom(id);
      await loadRooms();
    } catch (err: any) {
      setError(err.message || 'Error deleting room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Danh sách phòng</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Thêm phòng
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        {loading ? (
          <Box display="flex" justifyContent="center" width="100%" p={4}>
            <CircularProgress />
          </Box>
        ) : rooms.map(room => (
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
                <Typography variant="body2">
                  Trạng thái: {room.status === 'available' ? 'Trống' : 
                              room.status === 'occupied' ? 'Đang sử dụng' : 'Bảo trì'}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => handleOpenDialog(room)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(room.id!)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
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
            <FormControl fullWidth margin="normal">
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as RoomStatus })}
              >
                <MenuItem value="available">Trống</MenuItem>
                <MenuItem value="occupied">Đang sử dụng</MenuItem>
                <MenuItem value="maintenance">Bảo trì</MenuItem>
              </Select>
            </FormControl>
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