import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  MenuItem,
} from '@mui/material';

const rooms = [
  { id: 1, name: 'Phòng VIP 01' },
  { id: 2, name: 'Phòng VIP 02' },
  { id: 3, name: 'Phòng Thường 01' },
  { id: 4, name: 'Phòng Thường 02' },
];

const BookingForm = () => {
  const [booking, setBooking] = useState({
    room: '',
    customerName: '',
    phone: '',
    startTime: '',
  });

  const handleChange = (e : any) => {
    setBooking({
      ...booking,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e :any) => {
    e.preventDefault();
    console.log(booking);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Đặt phòng
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          select
          fullWidth
          label="Chọn phòng"
          name="room"
          value={booking.room}
          onChange={handleChange}
          sx={{ mb: 2 }}
        >
          {rooms.map(room => (
            <MenuItem key={room.id} value={room.id}>
              {room.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Tên khách hàng"
          name="customerName"
          value={booking.customerName}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Số điện thoại"
          name="phone"
          value={booking.phone}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Thời gian bắt đầu"
          type="datetime-local"
          name="startTime"
          value={booking.startTime}
          onChange={handleChange}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
        >
          Đặt phòng
        </Button>
      </Box>
    </Paper>
  );
};

export default BookingForm;