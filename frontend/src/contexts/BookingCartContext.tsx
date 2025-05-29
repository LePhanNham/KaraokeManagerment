import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Room } from '../types/interfaces';

export interface BookingCartItem {
  id: string; // unique ID for cart item
  room: Room;
  start_time: string;
  end_time: string;
  hours: number;
  subtotal: number;
  notes?: string;
  created_at: string;
}

interface BookingCartContextType {
  cartItems: BookingCartItem[];
  totalAmount: number;
  totalItems: number;
  addToCart: (room: Room, startTime: string, endTime: string, notes?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, updates: Partial<BookingCartItem>) => void;
  clearCart: () => void;
  isInCart: (roomId: number, startTime: string, endTime: string) => boolean;
  getCartItemByRoom: (roomId: number, startTime: string, endTime: string) => BookingCartItem | undefined;
}

const BookingCartContext = createContext<BookingCartContextType | undefined>(undefined);

interface BookingCartProviderProps {
  children: ReactNode;
}

export const BookingCartProvider: React.FC<BookingCartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<BookingCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bookingCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('bookingCart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookingCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate hours and subtotal
  const calculateBookingDetails = (startTime: string, endTime: string, pricePerHour: number) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const subtotal = hours * pricePerHour;
    return { hours, subtotal };
  };

  // Generate unique ID for cart item
  const generateCartItemId = (roomId: number, startTime: string, endTime: string) => {
    return `${roomId}_${startTime}_${endTime}`;
  };

  // Add item to cart
  const addToCart = (room: Room, startTime: string, endTime: string, notes?: string) => {
    const itemId = generateCartItemId(room.id!, startTime, endTime);
    
    // Check if item already exists
    const existingItem = cartItems.find(item => item.id === itemId);
    if (existingItem) {
      console.log('Item already in cart');
      return;
    }

    const { hours, subtotal } = calculateBookingDetails(startTime, endTime, room.price_per_hour);

    const newItem: BookingCartItem = {
      id: itemId,
      room,
      start_time: startTime,
      end_time: endTime,
      hours,
      subtotal,
      notes,
      created_at: new Date().toISOString()
    };

    setCartItems(prev => [...prev, newItem]);
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update cart item
  const updateCartItem = (itemId: string, updates: Partial<BookingCartItem>) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        
        // Recalculate if time changed
        if (updates.start_time || updates.end_time) {
          const { hours, subtotal } = calculateBookingDetails(
            updatedItem.start_time,
            updatedItem.end_time,
            updatedItem.room.price_per_hour
          );
          updatedItem.hours = hours;
          updatedItem.subtotal = subtotal;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // Check if item is in cart
  const isInCart = (roomId: number, startTime: string, endTime: string): boolean => {
    const itemId = generateCartItemId(roomId, startTime, endTime);
    return cartItems.some(item => item.id === itemId);
  };

  // Get cart item by room and time
  const getCartItemByRoom = (roomId: number, startTime: string, endTime: string): BookingCartItem | undefined => {
    const itemId = generateCartItemId(roomId, startTime, endTime);
    return cartItems.find(item => item.id === itemId);
  };

  // Calculate totals
  const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cartItems.length;

  const value = {
    cartItems,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    isInCart,
    getCartItemByRoom
  };

  return (
    <BookingCartContext.Provider value={value}>
      {children}
    </BookingCartContext.Provider>
  );
};

export const useBookingCart = (): BookingCartContextType => {
  const context = useContext(BookingCartContext);
  if (!context) {
    throw new Error('useBookingCart must be used within a BookingCartProvider');
  }
  return context;
};

export default BookingCartContext;
