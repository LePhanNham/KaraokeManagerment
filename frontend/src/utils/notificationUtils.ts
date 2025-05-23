// src/utils/notificationUtils.ts
import { toast, ToastOptions } from 'react-toastify';

// Cấu hình mặc định cho toast
const defaultOptions: ToastOptions = {
  position: 'bottom-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Các hàm thông báo
export const notifySuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, { ...defaultOptions, ...options });
};

export const notifyError = (message: string, options?: ToastOptions) => {
  return toast.error(message, { ...defaultOptions, ...options });
};

export const notifyInfo = (message: string, options?: ToastOptions) => {
  return toast.info(message, { ...defaultOptions, ...options });
};

export const notifyWarning = (message: string, options?: ToastOptions) => {
  return toast.warning(message, { ...defaultOptions, ...options });
};

// Hàm thông báo chung
export const notify = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', options?: ToastOptions) => {
  switch (type) {
    case 'success':
      return notifySuccess(message, options);
    case 'error':
      return notifyError(message, options);
    case 'warning':
      return notifyWarning(message, options);
    case 'info':
    default:
      return notifyInfo(message, options);
  }
};
