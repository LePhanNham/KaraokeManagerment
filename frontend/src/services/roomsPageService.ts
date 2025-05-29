import { Room } from '../types/interfaces';
import { roomService } from './roomService';

export interface RoomFormData {
  name: string;
  type: string;
  capacity: number;
  price_per_hour: number;
  description?: string;
}

export interface RoomFilters {
  type: string;
  minCapacity: number;
  maxCapacity: number;
  minPrice: number;
  maxPrice: number;
  search: string;
}

/**
 * Service để xử lý logic cho trang Rooms
 */
export const roomsPageService = {
  /**
   * Lấy tất cả phòng
   */
  getAllRooms: async (): Promise<Room[]> => {
    try {
      const response = await roomService.getAllRooms();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tải danh sách phòng');
    } catch (error: any) {
      console.error('Error getting all rooms:', error);
      throw new Error(error.message || 'Lỗi khi tải danh sách phòng');
    }
  },

  /**
   * Lấy thông tin phòng theo ID
   */
  getRoomById: async (id: number): Promise<Room> => {
    try {
      const response = await roomService.getRoomById(id);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tải thông tin phòng');
    } catch (error: any) {
      console.error('Error getting room by id:', error);
      throw new Error(error.message || 'Lỗi khi tải thông tin phòng');
    }
  },

  /**
   * Tạo phòng mới
   */
  createRoom: async (roomData: RoomFormData): Promise<Room> => {
    try {
      const response = await roomService.createRoom(roomData);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi tạo phòng mới');
    } catch (error: any) {
      console.error('Error creating room:', error);
      throw new Error(error.message || 'Lỗi khi tạo phòng mới');
    }
  },

  /**
   * Cập nhật thông tin phòng
   */
  updateRoom: async (id: number, roomData: Partial<RoomFormData>): Promise<Room> => {
    try {
      const response = await roomService.updateRoom(id, roomData);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Lỗi khi cập nhật phòng');
    } catch (error: any) {
      console.error('Error updating room:', error);
      throw new Error(error.message || 'Lỗi khi cập nhật phòng');
    }
  },

  /**
   * Xóa phòng
   */
  deleteRoom: async (id: number): Promise<boolean> => {
    try {
      const response = await roomService.deleteRoom(id);
      if (response.success) {
        return true;
      }
      throw new Error(response.message || 'Lỗi khi xóa phòng');
    } catch (error: any) {
      console.error('Error deleting room:', error);
      throw new Error(error.message || 'Lỗi khi xóa phòng');
    }
  },

  /**
   * Validate dữ liệu phòng
   */
  validateRoomData: (data: RoomFormData): string | null => {
    if (!data.name || data.name.trim().length === 0) {
      return 'Tên phòng không được để trống';
    }

    if (data.name.length > 100) {
      return 'Tên phòng không được quá 100 ký tự';
    }

    if (!data.type || data.type.trim().length === 0) {
      return 'Loại phòng không được để trống';
    }

    if (!data.capacity || data.capacity <= 0) {
      return 'Sức chứa phải lớn hơn 0';
    }

    if (data.capacity > 100) {
      return 'Sức chứa không được quá 100 người';
    }

    if (!data.price_per_hour || data.price_per_hour <= 0) {
      return 'Giá phòng phải lớn hơn 0';
    }

    if (data.price_per_hour > 10000000) {
      return 'Giá phòng không được quá 10,000,000đ';
    }

    return null;
  },

  /**
   * Lọc phòng theo điều kiện
   */
  filterRooms: (rooms: Room[], filters: RoomFilters): Room[] => {
    return rooms.filter(room => {
      // Filter by type
      if (filters.type && filters.type !== 'all' && room.type !== filters.type) {
        return false;
      }

      // Filter by capacity
      if (filters.minCapacity && room.capacity < filters.minCapacity) {
        return false;
      }

      if (filters.maxCapacity && room.capacity > filters.maxCapacity) {
        return false;
      }

      // Filter by price
      if (filters.minPrice && room.price_per_hour < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && room.price_per_hour > filters.maxPrice) {
        return false;
      }

      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = room.name.toLowerCase().includes(searchLower);
        const typeMatch = room.type.toLowerCase().includes(searchLower);
        const descMatch = room.description?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !typeMatch && !descMatch) {
          return false;
        }
      }

      return true;
    });
  },

  /**
   * Sắp xếp phòng
   */
  sortRooms: (rooms: Room[], sortBy: string, sortOrder: 'asc' | 'desc' = 'asc'): Room[] => {
    return [...rooms].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'price':
          aValue = a.price_per_hour;
          bValue = b.price_per_hour;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  },

  /**
   * Lấy các loại phòng unique
   */
  getRoomTypes: (rooms: Room[]): string[] => {
    const types = rooms.map(room => room.type);
    return [...new Set(types)];
  },

  /**
   * Tính thống kê phòng
   */
  getRoomStats: (rooms: Room[]) => {
    const totalRooms = rooms.length;
    const roomsByType = rooms.reduce((acc, room) => {
      acc[room.type] = (acc[room.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgCapacity = totalRooms > 0 
      ? Math.round(rooms.reduce((sum, room) => sum + room.capacity, 0) / totalRooms)
      : 0;

    const avgPrice = totalRooms > 0
      ? Math.round(rooms.reduce((sum, room) => sum + room.price_per_hour, 0) / totalRooms)
      : 0;

    const minPrice = totalRooms > 0 
      ? Math.min(...rooms.map(room => room.price_per_hour))
      : 0;

    const maxPrice = totalRooms > 0
      ? Math.max(...rooms.map(room => room.price_per_hour))
      : 0;

    return {
      totalRooms,
      roomsByType,
      avgCapacity,
      avgPrice,
      minPrice,
      maxPrice
    };
  },

  /**
   * Format giá tiền
   */
  formatPrice: (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  /**
   * Tạo dữ liệu mặc định cho form
   */
  getDefaultFormData: (): RoomFormData => {
    return {
      name: '',
      type: '',
      capacity: 1,
      price_per_hour: 50000,
      description: ''
    };
  },

  /**
   * Tạo filters mặc định
   */
  getDefaultFilters: (): RoomFilters => {
    return {
      type: '',
      minCapacity: 0,
      maxCapacity: 0,
      minPrice: 0,
      maxPrice: 0,
      search: ''
    };
  }
};

export default roomsPageService;
