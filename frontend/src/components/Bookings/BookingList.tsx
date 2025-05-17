import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';

const bookings = [
  {
    id: 1,
    room: 'Phòng VIP 01',
    customerName: 'Nguyễn Văn A',
    phone: '0123456789',
    startTime: '19:00 08/05/2025',
    status: 'Đã đặt'
  },
  {
    id: 2,
    room: 'Phòng VIP 02',
    customerName: 'Trần Thị B',
    phone: '0987654321',
    startTime: '20:00 08/05/2025',
    status: 'Đang sử dụng'
  }
];

const BookingList = () => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Phòng</TableCell>
            <TableCell>Khách hàng</TableCell>
            <TableCell>SĐT</TableCell>
            <TableCell>Thời gian</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map(booking => (
            <TableRow key={booking.id}>
              <TableCell>{booking.room}</TableCell>
              <TableCell>{booking.customerName}</TableCell>
              <TableCell>{booking.phone}</TableCell>
              <TableCell>{booking.startTime}</TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell>
                <Button size="small" sx={{ mr: 1 }}>
                  Check-in
                </Button>
                <Button size="small" color="error">
                  Hủy
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BookingList;