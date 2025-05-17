import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';

const Reports = () => {
  // Sample data
  const stats = {
    revenue: '15,000,000đ',
    customers: '120',
    rooms: ['Phòng VIP 201', 'Phòng 101', 'Phòng 102'],
    songs: ['Nơi này có anh', 'Waiting for you', 'See tình']
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Báo cáo thống kê
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Doanh thu
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.revenue}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Số khách
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.customers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phòng được ưa chuộng
              </Typography>
              {stats.rooms.map((room, index) => (
                <Typography key={index}>
                  {index + 1}. {room}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bài hát yêu thích
              </Typography>
              {stats.songs.map((song, index) => (
                <Typography key={index}>
                  {index + 1}. {song}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;