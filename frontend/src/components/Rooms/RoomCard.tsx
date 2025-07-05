"use client"

import type React from "react"
import { Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon, AccessTime as AccessTimeIcon } from "@mui/icons-material"
import type { Room } from "../../types/interfaces"
import { Card, CardContent, CardHeader, Button, Chip, Box, Typography, Grid } from "@mui/material"

interface RoomCardProps {
  room: Room
  onEdit: () => void
  onDelete: () => void
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onDelete }) => {
  const getTypeConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case "vip":
        return {
          color: "warning",
          icon: "👑",
        }
      case "premium":
        return {
          color: "secondary",
          icon: "💎",
        }
      case "suite":
        return {
          color: "primary",
          icon: "🏨",
        }
      default:
        return {
          color: "primary",
          icon: "🎤",
        }
    }
  }

  const typeConfig = getTypeConfig(room.type)

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderColor: `${typeConfig.color}.main`,
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h2" component="div">{typeConfig.icon}</Typography>
            <Box>
              <Typography variant="h6" component="h3">Phòng {room.name}</Typography>
              <Chip 
                label={room.type}
                color={typeConfig.color as any}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
        }
      />

      <CardContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Box
              sx={{
                bgcolor: 'grey.50',
                borderRadius: 1,
                p: 1.5,
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'text.secondary', mb: 0.5 }}>
                <PeopleIcon fontSize="small" />
                <Typography variant="caption" fontWeight="medium">Sức chứa</Typography>
              </Box>
              <Typography variant="h5" fontWeight="bold">{room.capacity}</Typography>
              <Typography variant="caption" color="text.secondary">người</Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box
              sx={{
                bgcolor: 'success.50',
                borderRadius: 1,
                p: 1.5,
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'success.main', mb: 0.5 }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="caption" fontWeight="medium">Giá thuê</Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold" color="success.dark">
                {(room.price_per_hour / 1000).toLocaleString("vi-VN")}K
              </Typography>
              <Typography variant="caption" color="success.main">đồng/giờ</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onEdit}
            startIcon={<EditIcon />}
            fullWidth
            sx={{
              '&:hover': {
                bgcolor: 'primary.50',
                borderColor: 'primary.300',
                color: 'primary.700'
              }
            }}
          >
            Sửa
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onDelete}
            startIcon={<DeleteIcon />}
            fullWidth
            sx={{
              '&:hover': {
                bgcolor: 'error.50',
                borderColor: 'error.300',
                color: 'error.700'
              }
            }}
          >
            Xóa
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default RoomCard
