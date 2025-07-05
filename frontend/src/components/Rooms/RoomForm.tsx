"use client"

import type React from "react"
import type { FormEvent, ChangeEvent } from "react"
import { Close as CloseIcon } from "@mui/icons-material"
import type { Room } from "../../types/interfaces"
import { 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  InputAdornment
} from "@mui/material"
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

interface RoomFormProps {
  formData: Room
  setFormData: (room: Room) => void
  onSubmit: () => void
  onClose: () => void
  error?: string | null
}

const RoomForm: React.FC<RoomFormProps> = ({ formData, setFormData, onSubmit, onClose, error }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "price_per_hour" || name === "capacity" ? Number(value) : value,
    })
  }

  const handleSelectChange = (e: any) => {
    setFormData({
      ...formData,
      type: e.target.value,
    })
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {formData.id ? "Cập nhật phòng" : "Thêm phòng mới"}
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, mt: 3 }}>
            <WarningAmberIcon color="warning" sx={{ mr: 1, fontSize: 24 }} />
            <Typography color="error" sx={{ fontWeight: 600, fontSize: 17, textAlign: 'center' }}>
              {error}
            </Typography>
          </Box>
        )}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            bgcolor: 'grey.50',
            borderRadius: 2
          }}
        >
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                id="name"
                name="name"
                label="Tên phòng"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nhập tên phòng (VD: A01)"
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white'
                  }
                }}
              />

              <FormControl fullWidth required>
                <InputLabel id="type-label">Loại phòng</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  value={formData.type}
                  label="Loại phòng"
                  onChange={handleSelectChange}
                  sx={{
                    bgcolor: 'white'
                  }}
                >
                  <MenuItem value="Standard">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🎤</span>
                      <Typography>Standard</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Premium">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>💎</span>
                      <Typography>Premium</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="VIP">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>👑</span>
                      <Typography>VIP</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Suite">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🏨</span>
                      <Typography>Suite</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    type="number"
                    id="price_per_hour"
                    name="price_per_hour"
                    label="Giá theo giờ"
                    value={formData.price_per_hour}
                    onChange={handleChange}
                    inputProps={{ min: 0, step: 1000 }}
                    placeholder="100000"
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    type="number"
                    id="capacity"
                    name="capacity"
                    label="Sức chứa"
                    value={formData.capacity}
                    onChange={handleChange}
                    inputProps={{ min: 1, max: 20 }}
                    placeholder="4"
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">người</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white'
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={onClose} 
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'grey.400',
                      bgcolor: 'grey.50'
                    }
                  }}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  {formData.id ? "Cập nhật" : "Thêm phòng"}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </DialogContent>
    </Dialog>
  )
}

export default RoomForm
