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
  id?: number;
  customer_id: number;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  rooms?: BookingRoom[]; // Danh sách phòng trong booking
}

export interface BookingRoom {
  id?: number;
  booking_id?: number;
  room_id: number;
  price_per_hour: number;
  room?: Room; // Thông tin chi tiết phòng
}

export type BookingInput = {
  customer_id: number;
  rooms?: {
    room_id: number;
    start_time: string;
    end_time: string;
    price_per_hour: number;
  }[];
  // Backward compatibility
  room_id?: number;
  start_time?: string;
  end_time?: string;
  price_per_hour?: number;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount?: number;
};

export interface BookingWithRoom extends Booking {
  // Backward compatibility
  room_id?: number;
  booking_group_id?: number;
  // Display fields
  roomName?: string;
  roomType?: string;
  roomCapacity?: number;
  roomPrice?: number;
  price_per_hour?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  room?: Room; // Thông tin phòng đầy đủ
  // Payment status fields
  total_rooms?: number;
  paid_rooms?: number;
  payment_status?: 'unpaid' | 'partially_paid' | 'paid';
}

// Thêm interface cho BookingGroup
export interface BookingGroup {
  id?: number;
  customer_id: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  total_amount: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid';
  created_at?: string;
  updated_at?: string;
}

// Interface cho response khi đặt nhiều phòng
export interface MultipleBookingResponse {
  success: boolean;
  data: {
    booking_group: BookingGroup;
    bookings: Booking[];
  };
  message: string;
}


//room services
export interface Room {
    id?: number;  // Optional for creation, required when returned from API,
    name: string;
    type: string;
    price_per_hour: number;
    capacity: number;
    description?: string;
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




export interface UnpaidBooking {
  id: number;
  customer_id: number;
  customer_name: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  rooms: {
    id: number;
    room_id: number;
    room_name: string;
    room_type: string;
    price_per_hour: number;
    hours: number;
    subtotal: number;
  }[];
}

export interface PaymentData {
  booking_id?: number;
  booking_group_id?: number;
  booking_room_id?: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
}

export interface PaymentItem {
  booking_id: number;
  booking_room_id?: number;
  amount: number;
  description?: string;
}

export interface MultiplePaymentData {
  payment_items: PaymentItem[];
  payment_method: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    payment_id?: number;
    payment_results?: any[];
    total_amount?: number;
    items_count?: number;
    receipt_number?: string;
  };
}

export interface PaymentHistory {
  id: number;
  booking_id?: number;
  booking_group_id?: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  notes?: string;
  receipt_number: string;
  created_at: string;
}

export interface PaymentStatistics {
  total_payments: number;
  total_amount: number;
  payment_methods: {
    cash: number;
    card: number;
    bank_transfer: number;
  };
  daily_revenue: {
    date: string;
    amount: number;
  }[];
}
