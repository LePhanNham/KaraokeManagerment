import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Alert
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authApi } from '../services/auth';
import { RegisterCredentials } from '../types/auth';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterCredentials>({
    username: '',
    password: '',
    email: '',
    name: '',
    phone_number: '' // Changed from phone to phone_number
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    // Required fields validation
    if (!formData.username.trim()) {
      setError('Tên đăng nhập không được để trống');
      return false;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (!formData.email.trim() || !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Email không hợp lệ');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
        const sanitizedData = {
            username: formData.username.trim(),
            password: formData.password.trim(),
            email: formData.email.trim(),
            name: formData.name.trim(),
            phone_number: formData.phone_number.trim()
        };

        const response = await authApi.register(sanitizedData);
        
        if (response.success) {
            setSuccess(true);
            // Clear form
            setFormData({
                username: '',
                password: '',
                email: '',
                name: '',
                phone_number: ''
            });

            // Chờ 2 giây để người dùng thấy thông báo thành công
            setTimeout(() => {
                navigate('/login', { 
                    state: { 
                        message: 'Đăng ký thành công! Vui lòng đăng nhập với tài khoản của bạn.' 
                    } 
                });
            }, 2000);
        }
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        setError(errorMessage);
        console.error('Registration error:', err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Đăng ký tài khoản
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              required
              label="Tên đăng nhập"
              name="username"
              margin="normal"
              value={formData.username}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              label="Mật khẩu"
              name="password"
              type="password"
              margin="normal"
              value={formData.password}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              type="email"
              margin="normal"
              value={formData.email}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              label="Họ tên"
              name="name"
              margin="normal"
              value={formData.name}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              required
              label="Số điện thoại"
              name="phone_number" // Changed from phone to phone_number
              margin="normal"
              value={formData.phone_number}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>

            <Typography align="center">
              Đã có tài khoản?{' '}
              <Link component={RouterLink} to="/login">
                Đăng nhập
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;