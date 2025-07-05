import React, { useState, useEffect } from 'react';
import { Room, Booking } from '../types/interfaces';
import { useRooms } from '../hooks/useRooms';
import RoomCard from '../components/Rooms/RoomCard';
import RoomForm from '../components/Rooms/RoomForm';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  InputAdornment,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

const defaultFormData: Room = {
  name: '',
  type: '',
  price_per_hour: 0,
  capacity: 0
};

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState<Room>(defaultFormData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const { fetchRooms, createRoom, updateRoom, deleteRoom } = useRooms();
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info' | 'warning'}>({open: false, message: '', severity: 'success'});
  const [confirmDelete, setConfirmDelete] = useState<{open: boolean, roomId: number | null}>({open: false, roomId: null});

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const fetchedRooms = await fetchRooms();
      setRooms(fetchedRooms);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    const isDuplicate = rooms.some(
      (room) => room.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setError('Tên phòng đã tồn tại, vui lòng chọn tên khác!');
      return;
    }
    try {
      await createRoom(formData);
      setFormData(defaultFormData);
      setIsModalOpen(false);
      setError(null);
      loadRooms();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleUpdateRoom = async (id: number) => {
    if (!selectedRoom) return;
    const isDuplicate = rooms.some(
      (room) => room.name.trim().toLowerCase() === selectedRoom.name.trim().toLowerCase() && room.id !== id
    );
    if (isDuplicate) {
      setError('Tên phòng đã tồn tại, vui lòng chọn tên khác!');
      return;
    }
    try {
      await updateRoom(id, selectedRoom);
      setSelectedRoom(null);
      setError(null);
      loadRooms();
    } catch (error) {
      console.error('Failed to update room:', error);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    setConfirmDelete({ open: true, roomId: id });
  };

  const confirmDeleteRoom = async () => {
    if (!confirmDelete.roomId) return;
    try {
      await deleteRoom(confirmDelete.roomId);
      setSnackbar({ open: true, message: 'Xóa phòng thành công!', severity: 'success' });
      loadRooms();
    } catch (error) {
      setSnackbar({ open: true, message: 'Xóa phòng thất bại!', severity: 'error' });
    }
    setConfirmDelete({ open: false, roomId: null });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const handleCloseConfirm = () => setConfirmDelete({ open: false, roomId: null });

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || room.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const roomTypes = [...new Set(rooms.map(room => room.type))];

  const stats = [
    { label: 'Tổng số phòng', value: rooms.length, color: 'primary.main' },
    { 
      label: 'Phòng VIP', 
      value: rooms.filter(r => r.type.toLowerCase() === 'vip').length,
      color: 'warning.main'
    },
    { 
      label: 'Phòng Premium', 
      value: rooms.filter(r => r.type.toLowerCase() === 'premium').length,
      color: 'secondary.main'
    },
    { 
      label: 'Phòng Standard', 
      value: rooms.filter(r => r.type.toLowerCase() === 'standard').length,
      color: 'success.main'
    }
  ];

  return (
    <Box sx={{ bgcolor: '#f7f7f7', minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2 }}>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={600} color="text.primary">
            Quản lý phòng hát
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Quản lý và theo dõi thông tin các phòng karaoke
          </Typography>
        </Box>

        {/* Control Panel */}
        <Paper elevation={0} sx={{ borderRadius: 1, mb: 3, p: 2, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Tìm kiếm theo tên phòng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ bgcolor: '#fafafa' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-type-label">Loại phòng</InputLabel>
                <Select
                  labelId="filter-type-label"
                  value={filterType}
                  label="Loại phòng"
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ bgcolor: '#fafafa' }}
                >
                  <MenuItem value="all">Tất cả loại phòng</MenuItem>
                  {roomTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<AddIcon />}
                sx={{ height: '100%', fontWeight: 500, bgcolor: '#fafafa', borderColor: '#e0e0e0', '&:hover': { bgcolor: '#f0f0f0', borderColor: '#bdbdbd' } }}
              >
                Thêm phòng
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Room Stats */}
        <Grid container spacing={2} mb={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} md={3} key={index}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: '#f5f5f5', border: '1px solid #e0e0e0'
                }}>
                  <Typography variant="subtitle1" color="text.primary" fontWeight={600}>{stat.value}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  <Typography variant="body1" color="text.primary" fontWeight={500}>{stat.value} phòng</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Rooms Grid */}
        <Paper elevation={0} sx={{ borderRadius: 1, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {filteredRooms.map((room) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={room.id}>
                  <RoomCard
                    room={room}
                    onEdit={() => setSelectedRoom(room)}
                    onDelete={() => room.id && handleDeleteRoom(room.id)}
                  />
                </Grid>
              ))}
            </Grid>

            {filteredRooms.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Box sx={{ mb: 1 }}>
                  <SearchIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                </Box>
                <Typography variant="body1" color="text.primary" mb={0.5}>
                  Không tìm thấy phòng nào
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {searchTerm 
                    ? 'Thử tìm kiếm với từ khóa khác' 
                    : 'Chưa có phòng nào được thêm vào hệ thống'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Modals */}
      {isModalOpen && (
        <RoomForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateRoom}
          onClose={() => { setIsModalOpen(false); setError(null); }}
          error={error}
        />
      )}

      {selectedRoom && (
        <RoomForm
          formData={selectedRoom}
          setFormData={setSelectedRoom}
          onSubmit={() => selectedRoom.id && handleUpdateRoom(selectedRoom.id)}
          onClose={() => { setSelectedRoom(null); setError(null); }}
          error={error}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete.open} onClose={handleCloseConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>Xác nhận xóa phòng</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa phòng này không?</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <Button onClick={handleCloseConfirm} variant="outlined">Hủy</Button>
            <Button onClick={confirmDeleteRoom} variant="contained" color="error">Xóa</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Rooms;