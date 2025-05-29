import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { BookingCartProvider } from './contexts/BookingCartContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Bookings from './pages/Bookings';
import Rooms from './pages/Rooms';
import Profile from './pages/Profile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Checkout from './pages/Checkout';
import CheckoutDetail from './pages/CheckoutDetail';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingCart from './pages/BookingCart';
import Payment from './pages/Payment';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuth();
  const location = useLocation();

  // Check authentication when component mounts or location changes
  useEffect(() => {
    const isAuth = checkAuth();
    if (!isAuth) {
      // checkAuth already handles redirection
      return;
    }
  }, [checkAuth, location]);

  // If authenticated, render children, otherwise the checkAuth function
  // will handle the redirection to login
  return isAuthenticated ? <>{children}</> : null;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bookings/new" element={<Bookings />} />
                <Route path="/bookings/:id" element={<Bookings />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/checkout" element={<BookingCart />} />
                <Route path="/payment" element={<Payment />} />

                <Route path="/rooms" element={<Rooms />} />
                <Route path="/rooms/new" element={<Rooms />} />
                <Route path="/rooms/:id" element={<Rooms />} />
                <Route path="/checkout/:id" element={
                  <PrivateRoute>
                    <CheckoutDetail />
                  </PrivateRoute>
                } />
                <Route path="/reports" element={<Reports />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <BookingCartProvider>
            <AppRoutes />
            <ToastContainer />
          </BookingCartProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
