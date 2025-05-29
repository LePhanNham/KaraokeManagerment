import React from 'react';
import {
  IconButton,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ShoppingCart as CartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useBookingCart } from '../contexts/BookingCartContext';
import bookingCartService from '../services/bookingCartService';

const BookingCartIcon: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, totalItems, totalAmount } = useBookingCart();

  const handleCartClick = () => {
    navigate('/checkout');
  };

  return (
    <Tooltip
      title={
        totalItems > 0
          ? `${totalItems} booking - ${bookingCartService.formatPrice(totalAmount)}`
          : 'Giỏ hàng trống'
      }
    >
      <IconButton
        color="inherit"
        onClick={handleCartClick}
        sx={{
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
      >
        <Badge
          badgeContent={totalItems}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              minWidth: '18px',
              height: '18px'
            }
          }}
        >
          <CartIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default BookingCartIcon;
