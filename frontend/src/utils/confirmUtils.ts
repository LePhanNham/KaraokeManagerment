// src/utils/confirmUtils.ts
import { toast, ToastOptions } from 'react-toastify';
import React from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  toastOptions?: ToastOptions;
}

/**
 * Hiển thị một thông báo xác nhận sử dụng react-toastify
 * Trả về một Promise sẽ được resolve với true nếu người dùng xác nhận, hoặc false nếu hủy
 */
export const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
  const {
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    toastOptions
  } = options;

  return new Promise((resolve) => {
    const toastId = toast.info(
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { style: { marginBottom: '10px' } },
          message
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between' } },
          React.createElement(
            'button',
            {
              style: {
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              },
              onClick: () => {
                toast.dismiss(toastId);
                resolve(false);
              }
            },
            cancelText
          ),
          React.createElement(
            'button',
            {
              style: {
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              },
              onClick: () => {
                toast.dismiss(toastId);
                resolve(true);
              }
            },
            confirmText
          )
        )
      ),
      {
        position: 'top-center',
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        closeButton: false,
        ...toastOptions
      }
    );
  });
};
