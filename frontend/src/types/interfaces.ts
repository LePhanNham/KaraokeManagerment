// api res
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// auth services
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  email: string;
  name: string;
  phone_number: string; // Changed from phone to match backend
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone_number: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    customer: {
      id: number;
      username: string;
      name: string;
      email: string;
    };
  };
  message?: string;
  error?: string;
}


// booking services

export interface Booking {
  id: number;
  room_id: number;
  customer_id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}


export type BookingInput = {
  room_id: number;
  customer_id: number;
  start_time: string;
  end_time: string;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount?: number;
};

export interface BookingWithRoom extends Booking {
  roomName?: string;
  roomType?: string;
}

//room services 
export interface Room {
    id?: number;  // Optional for creation, required when returned from API,
    name: string;
    type: string;
    price_per_hour: number;
    capacity: number;
    created_at?: Date;
    updated_at?: Date;
}

export type RoomFormData = Omit<Room, 'id' | 'created_at' | 'updated_at'>;

export type RoomStatus = 'available' | 'occupied' | 'maintenance';




// report
export interface RevenueData {
    period: string | number;
    total_revenue: number;
    bookings_count: number;
    avg_revenue: number;
}

export interface TopRoomData {
    id: number;
    name: string;
    type: string;
    booking_count: number;
    total_revenue: number;
}




//profile 


export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}