import React, { useState, FormEvent, ChangeEvent } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Grid 
} from '@mui/material';

interface Room {
  name: string;
  capacity: number;
}

interface RoomFormProps {
  onSubmit: (room: Room) => void;
  initialRoom?: Room;
}

const RoomForm: React.FC<RoomFormProps> = ({ onSubmit, initialRoom }) => {
  const [name, setName] = useState(initialRoom?.name || '');
  const [capacity, setCapacity] = useState(initialRoom?.capacity?.toString() || '');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      name,
      capacity: Number(capacity),
    });
    setName('');
    setCapacity('');
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tên phòng"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Sức chứa"
              value={capacity}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCapacity(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              {initialRoom ? 'Cập nhật' : 'Thêm phòng'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default RoomForm;