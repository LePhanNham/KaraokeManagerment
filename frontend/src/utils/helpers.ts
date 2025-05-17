// src/utils/helpers.ts

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const calculateRoomAvailability = (bookedSlots: Array<{ start: Date; end: Date }>, totalSlots: number): number => {
    const bookedCount = bookedSlots.length;
    return totalSlots - bookedCount;
};

export const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};