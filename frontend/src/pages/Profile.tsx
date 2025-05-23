import React, { useState, useEffect } from 'react';
import { authApi } from '../services/auth';
import { bookingService } from '../services/bookingService';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Divider, 
  Tab, 
  Tabs, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { Edit, Save, Lock } from '@mui/icons-material';
import { format } from 'date-fns';
import { User, Booking, TabPanelProps } from '../types/interfaces';

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.getProfile();
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone_number: data.phone_number || ''
      });
    } catch (err) {
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await bookingService.getAllBookings();
      if (response.success && response.data) {
        setBookings(response.data);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Reset form data if canceling edit
      if (profile) {
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone_number: profile.phone_number || ''
        });
      }
    }
    setEditMode(!editMode);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await authApi.updateProfile(formData);
      if (response.success) {
        setSuccess('Cập nhật thông tin thành công');
        setProfile(response.data);
        setEditMode(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
    setPasswordError('');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation code...
    
    try {
      setLoading(true);
      const response = await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        setSuccess('Đổi mật khẩu thành công');
        handlePasswordDialogClose();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Thông tin cá nhân" />
            <Tab label="Lịch sử đặt phòng" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={handleUpdateProfile}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Tên đăng nhập
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {profile?.username}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Vai trò
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {profile?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Họ tên"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  disabled={!editMode}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  {!editMode ? (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEditToggle}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<Lock />}
                        onClick={handlePasswordDialogOpen}
                      >
                        Đổi mật khẩu
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outlined"
                        onClick={handleEditToggle}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<Save />}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {bookings.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Phòng</TableCell>
                    <TableCell>Thời gian bắt đầu</TableCell>
                    <TableCell>Thời gian kết thúc</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align="right">Tổng tiền</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.room_id}</TableCell>
                      <TableCell>{format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>
                        {booking.end_time 
                          ? format(new Date(booking.end_time), 'dd/MM/yyyy HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {booking.status === 'pending' && 'Chờ xác nhận'}
                        {booking.status === 'confirmed' && 'Đã xác nhận'}
                        {booking.status === 'completed' && 'Hoàn thành'}
                        {booking.status === 'cancelled' && 'Đã hủy'}
                      </TableCell>
                      <TableCell align="right">
                        {booking.total_amount?.toLocaleString() || 0} đ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Bạn chưa có lịch sử đặt phòng nào.
            </Typography>
          )}
        </TabPanel>
      </Paper>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose}>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>
          )}
          <DialogContentText>
            Để đổi mật khẩu, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
          </DialogContentText>
          <TextField
            margin="dense"
            label="Mật khẩu hiện tại"
            type="password"
            fullWidth
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordInputChange}
            required
          />
          <TextField
            margin="dense"
            label="Mật khẩu mới"
            type="password"
            fullWidth
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordInputChange}
            required
          />
          <TextField
            margin="dense"
            label="Xác nhận mật khẩu mới"
            type="password"
            fullWidth
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>Hủy</Button>
          <Button onClick={handlePasswordSubmit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
