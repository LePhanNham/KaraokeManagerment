import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Room as RoomIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { Room } from '../types/interfaces';

interface ConfirmDeleteDialogProps {
  open: boolean;
  room: Room | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  hasActiveBookings?: boolean;
  activeBookingsCount?: number;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  open,
  room,
  onConfirm,
  onCancel,
  loading = false,
  hasActiveBookings = false,
  activeBookingsCount = 0
}) => {
  const theme = useTheme();

  if (!room) return null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10]
        }
      }}
    >
      {/* Header với icon warning */}
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.error.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1
            }}
          >
            <WarningIcon sx={{ fontSize: 32, color: theme.palette.error.main }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="error">
            Xác nhận xóa phòng
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Thông tin phòng */}
        <Box sx={{ 
          p: 2, 
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <RoomIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {room.name}
            </Typography>
            <Chip 
              label={room.type} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PeopleIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {room.capacity} người
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <MoneyIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {room.price_per_hour.toLocaleString()}đ/giờ
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Cảnh báo */}
        {hasActiveBookings ? (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            icon={<WarningIcon />}
          >
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Không thể xóa phòng này!
            </Typography>
            <Typography variant="body2">
              Phòng đang có <strong>{activeBookingsCount}</strong> đơn đặt phòng đang hoạt động. 
              Vui lòng hủy hoặc hoàn thành các đơn đặt phòng trước khi xóa.
            </Typography>
          </Alert>
        ) : (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            icon={<WarningIcon />}
          >
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Hành động này không thể hoàn tác!
            </Typography>
            <Typography variant="body2">
              Bạn có chắc chắn muốn xóa phòng <strong>{room.name}</strong>? 
              Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
            </Typography>
          </Alert>
        )}

        {/* Thông tin bổ sung */}
        {!hasActiveBookings && (
          <Box sx={{ 
            p: 2, 
            backgroundColor: alpha(theme.palette.grey[500], 0.05),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`
          }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Lưu ý:</strong> Sau khi xóa, bạn sẽ không thể khôi phục phòng này. 
              Hãy đảm bảo rằng không còn dữ liệu quan trọng nào liên quan.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          size="large"
          startIcon={<CancelIcon />}
          sx={{ 
            minWidth: 120,
            borderColor: theme.palette.grey[400],
            color: theme.palette.grey[700],
            '&:hover': {
              borderColor: theme.palette.grey[600],
              backgroundColor: alpha(theme.palette.grey[500], 0.1)
            }
          }}
        >
          Hủy bỏ
        </Button>
        
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          size="large"
          disabled={loading || hasActiveBookings}
          startIcon={loading ? undefined : <DeleteIcon />}
          sx={{ 
            minWidth: 120,
            fontWeight: 'bold',
            boxShadow: theme.shadows[4],
            '&:hover': {
              boxShadow: theme.shadows[8]
            }
          }}
        >
          {loading ? 'Đang xóa...' : 'Xóa phòng'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
