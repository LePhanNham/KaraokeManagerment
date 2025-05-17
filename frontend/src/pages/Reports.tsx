import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { reportService } from '../services/reportService';
import { RevenueData, TopRoomData } from '../types/interfaces';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<RevenueData[]>([]);
  const [yearlyData, setYearlyData] = useState<RevenueData[]>([]);
  const [topRooms, setTopRooms] = useState<TopRoomData[]>([]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setYear(event.target.value as number);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value) + ' VNĐ';
  };

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const quarterNames = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];

  // Format data for charts
  const formattedMonthlyData = monthlyData.map(item => ({
    ...item,
    name: monthNames[Number(item.period) - 1],
    total_revenue: Number(item.total_revenue)
  }));

  const formattedQuarterlyData = quarterlyData.map(item => ({
    ...item,
    name: quarterNames[Number(item.period) - 1],
    total_revenue: Number(item.total_revenue)
  }));

  const formattedYearlyData = yearlyData.map(item => ({
    ...item,
    name: `Năm ${item.period}`,
    total_revenue: Number(item.total_revenue)
  }));

  const formattedTopRooms = topRooms.map(item => ({
    ...item,
    name: item.name,
    value: Number(item.total_revenue)
  }));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch data based on active tab
        if (tabValue === 0) {
          const response = await reportService.getMonthlyRevenue(year);
          if (response.success) {
            setMonthlyData(response.data);
          }
        } else if (tabValue === 1) {
          const response = await reportService.getQuarterlyRevenue(year);
          if (response.success) {
            setQuarterlyData(response.data);
          }
        } else if (tabValue === 2) {
          const startYear = year - 5;
          const response = await reportService.getYearlyRevenue(startYear, year);
          if (response.success) {
            setYearlyData(response.data);
          }
        }

        // Always fetch top rooms data
        const topRoomsResponse = await reportService.getTopRooms(year);
        if (topRoomsResponse.success) {
          setTopRooms(topRoomsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tabValue, year]);

  // Calculate total revenue
  const calculateTotalRevenue = () => {
    let data: any[];
    switch (tabValue) {
      case 0:
        data = monthlyData;
        break;
      case 1:
        data = quarterlyData;
        break;
      case 2:
        data = yearlyData;
        break;
      default:
        data = [];
    }

    return data.reduce((sum, item) => sum + Number(item.total_revenue), 0);
  };

  // Calculate total bookings
  const calculateTotalBookings = () => {
    let data : any[];
    switch (tabValue) {
      case 0:
        data = monthlyData;
        break;
      case 1:
        data = quarterlyData;
        break;
      case 2:
        data = yearlyData;
        break;
      default:
        data = [];
    }

    return data.reduce((sum, item) => sum + Number(item.bookings_count), 0);
  };

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Báo cáo thống kê doanh thu
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="year-select-label">Năm</InputLabel>
          <Select
            labelId="year-select-label"
            id="year-select"
            value={year}
            label="Năm"
            onChange={handleYearChange}
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)
              .map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Tabs">
        <Tab label="Theo tháng" />
        <Tab label="Theo quý" />
        <Tab label="Theo năm" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Doanh thu
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(calculateTotalRevenue())}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Số lần đặt phòng
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {calculateTotalBookings()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={formattedMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => {
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'decimal',
                        maximumFractionDigits: 0
                      }).format(value);
                    }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), "Doanh thu"]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="total_revenue" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Doanh thu
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(calculateTotalRevenue())}
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
                    {calculateTotalBookings()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={formattedQuarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => {
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'decimal',
                        maximumFractionDigits: 0
                      }).format(value);
                    }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), "Doanh thu"]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="total_revenue" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Doanh thu
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(calculateTotalRevenue())}
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
                    {calculateTotalBookings()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={formattedYearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => {
                      // Only return the numeric part without any currency symbol
                      return new Intl.NumberFormat('vi-VN', {
                        style: 'decimal',
                        maximumFractionDigits: 0
                      }).format(value);
                    }}
                    width={100}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), "Doanh thu"]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="total_revenue" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>
        </TabPanel>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Phòng được ưa chuộng
              </Typography>
              {topRooms.map((room, index) => (
                <Typography key={index}>
                  {index + 1}. {room.name} - {formatCurrency(room.total_revenue)}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Doanh thu theo phòng
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={formattedTopRooms}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={120}
                    fill="#8884D8" 
                    dataKey="value"
                  >
                    {formattedTopRooms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;
