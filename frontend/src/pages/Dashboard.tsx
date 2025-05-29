import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Paper,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  Button
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Booking, Room } from '../types/interfaces';
import { roomService } from '../services/roomService';
import { reportService } from '../services/reportService';
import { useNavigate } from 'react-router-dom';
import { bookingService } from 'services/bookingService';
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    availableRooms: 0,
    totalCustomers: 0,
    todayRevenue: 0
  });

  const handleViewReports = () => {
    navigate('/reports');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get room data
        const roomResponse = await roomService.getAllRooms();

        // Get booking data to determine room status
        const bookingsResponse = await bookingService.getAllBookings();

        // Get current month's revenue data
        const currentYear = new Date().getFullYear();
        const revenueResponse = await reportService.getMonthlyRevenue(currentYear);

        // Calculate today's stats from the monthly data
        const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed
        const currentMonthData = revenueResponse.success ?
          revenueResponse.data.find(item => item.period === currentMonth) : null;

        if (roomResponse.success && bookingsResponse.success) {
          setRooms(roomResponse.data);
          setBookings(bookingsResponse.data);

          // Find active bookings (confirmed bookings where current time is between start and end)
          const now = new Date();
          const activeBookings = bookingsResponse.data.filter((booking: Booking) =>
            booking.status === 'confirmed' &&
            new Date(booking.start_time) <= now &&
            new Date(booking.end_time) > now
          );

          // Count available rooms (those without active bookings)
          const occupiedRoomIds = activeBookings.map((booking: Booking) => {
            // Get room_id from first room in booking
            return booking.rooms?.[0]?.room_id;
          }).filter(Boolean);
          const availableRoomsCount = roomResponse.data.filter(
            room => room.id !== undefined && !occupiedRoomIds.includes(room.id)
          ).length;

          setStats({
            availableRooms: availableRoomsCount,
            totalCustomers: currentMonthData ? currentMonthData.bookings_count : 0,
            todayRevenue: currentMonthData ? currentMonthData.total_revenue / 30 : 0 // Rough estimate for daily revenue
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isRoomOccupied = (roomId: number | undefined) => {
    if (!roomId) return false;

    // Check if there's an active booking for this room
    const now = new Date();
    return bookings.some((booking: Booking) => {
      // Check if any room in the booking matches the roomId
      const hasRoom = booking.rooms?.some(room => room.room_id === roomId);
      return hasRoom &&
        booking.status === 'confirmed' &&
        new Date(booking.start_time) <= now &&
        new Date(booking.end_time) > now;
    });
  };

  const getStatusColor = (roomId: number | undefined) => {
    return isRoomOccupied(roomId) ? 'error' : 'success';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleViewReports}
        >
          Xem thống kê
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RoomIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Phòng trống</Typography>
              </Box>
              <Typography variant="h4">
                {stats.availableRooms}/{rooms.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Khách hàng</Typography>
              </Box>
              <Typography variant="h4">{stats.totalCustomers}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Doanh thu hôm nay</Typography>
              </Box>
              <Typography variant="h4">{formatCurrency(stats.todayRevenue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Danh sách phòng
        </Typography>
        <List>
          {rooms.map((room, index) => {
            const occupied = isRoomOccupied(room.id);

            return (
              <React.Fragment key={room.id}>
                <ListItem>
                  <ListItemText
                    primary={room.name}
                    secondary={`${room.type} - ${formatCurrency(room.price_per_hour)}/giờ`}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={occupied ? 'Đang sử dụng' : 'Trống'}
                      color={occupied ? 'error' : 'success'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < rooms.length - 1 && <Divider />}
              </React.Fragment>
            );
          })}
        </List>
      </Paper>
    </Container>
  );
};

export default Dashboard;