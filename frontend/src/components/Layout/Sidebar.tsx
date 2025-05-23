import React from 'react';
import { 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useTheme,
  useMediaQuery,
  Divider,
  Box
} from '@mui/material';
import { 
  Dashboard, 
  CalendarToday, 
  MeetingRoom, 
  BarChart, 
  Settings,
  GroupWork,
  Payment
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = 240;

  const menuItems = [
    { text: 'Trang chủ', icon: <Dashboard />, path: '/' },
    { text: 'Đặt phòng', icon: <CalendarToday />, path: '/bookings' },
    { text: 'Nhóm đặt phòng', icon: <GroupWork />, path: '/booking-groups' },
    { text: 'Quản lý phòng', icon: <MeetingRoom />, path: '/rooms' },
    { text: 'Thống kê', icon: <BarChart />, path: '/reports' },
    { text: 'Cài đặt', icon: <Settings />, path: '/settings' },
    { text: 'Thanh toán', icon: <Payment />, path: '/checkout' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`
        },
        display: { xs: 'none', md: 'block' }
      }}
    >
      <Toolbar /> {/* This creates space for the AppBar */}
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: isActive(item.path) ? theme.palette.action.selected : 'transparent',
                borderRadius: 1,
                mb: 0.5,
                mx: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.secondary 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 'bold' : 'normal',
                  color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
