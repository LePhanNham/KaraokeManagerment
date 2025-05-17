import React from 'react';
import { Grid } from '@mui/material';
import RoomCard from './RoomCard';

interface Room {
  id: number;
  name: string;
  capacity: number;
  status: string;
}

interface RoomListProps {
  rooms: Room[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const RoomList: React.FC<RoomListProps> = ({ rooms, onEdit, onDelete }) => {
  return (
    <Grid container spacing={3}>
      {rooms.map(room => (
        <Grid item xs={12} sm={6} md={4} key={room.id}>
          <RoomCard {...room} onEdit={onEdit} onDelete={onDelete} />
        </Grid>
      ))}
    </Grid>
  );
};

export default RoomList;