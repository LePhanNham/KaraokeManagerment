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
  Divider
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Room } from '../types';
import { roomService } from '../services/roomService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState({
    availableRooms: 0,
    totalCustomers: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await roomService.getAllRooms();
        if (response.success) {
          setRooms(response.data);
          // Calculate stats
          setStats({
            availableRooms: response.data.filter(room => room.status === 'available').length,
            totalCustomers: 24, // This should come from API
            todayRevenue: 2500000 // This should come from API
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
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
    <Container sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Bảng điều khiển
      </Typography>

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
          {rooms.map((room, index) => (
            <React.Fragment key={room.id}>
              <ListItem>
                <ListItemText
                  primary={room.name}
                  secondary={`${room.type} - ${formatCurrency(room.price_per_hour)}/giờ`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={room.status === 'available' ? 'Trống' : 
                           room.status === 'occupied' ? 'Đang sử dụng' : 'Bảo trì'}
                    color={getStatusColor(room.status)}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {index < rooms.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default Dashboard;
