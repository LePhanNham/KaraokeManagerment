import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  MeetingRoom,
  CalendarToday,
  ExitToApp,
  Dashboard,
  Person,
  BarChart
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import BookingCartIcon from '../CartIcon';

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const menuItems = [
    { text: 'Trang chủ', icon: <Dashboard />, path: '/' },
    { text: 'Đặt phòng', icon: <CalendarToday />, path: '/bookings' },
    { text: 'Quản lý phòng', icon: <MeetingRoom />, path: '/rooms' },
    { text: 'Thống kê', icon: <BarChart />, path: '/reports' }
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    handleClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        boxShadow: 1
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: 'pointer',
            color: theme.palette.primary.main,
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={() => navigate('/')}
        >
          KARAOKE HAPPY
        </Typography>

        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {menuItems.map((item) => (
              <Button
                key={item.text}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  color: theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                {item.text}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookingCartIcon />
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: theme.palette.primary.main,
              cursor: 'pointer'
            }}
            onClick={handleMenu}
          >
            <Person />
          </Avatar>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => {
                navigate('/profile');
                handleClose();
              }}
            >
              <Person sx={{ mr: 1 }} />
              Thông tin cá nhân
            </MenuItem>
            {isMobile && menuItems.map((item) => (
              <MenuItem
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  handleClose();
                }}
              >
                {React.cloneElement(item.icon, { sx: { mr: 1 } })}
                {item.text}
              </MenuItem>
            ))}
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Đăng xuất
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;