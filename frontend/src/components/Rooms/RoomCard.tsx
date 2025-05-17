import React from 'react';

interface RoomCardProps {
  id: number;
  name: string;
  status: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '15px',
    margin: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  status: {
    color: '#666',
    margin: '5px 0'
  },
  actions: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white'
  },
  editButton: {
    background: '#2196f3'
  },
  deleteButton: {
    background: '#f44336'
  }
} as const;

const RoomCard: React.FC<RoomCardProps> = ({
  id,
  name,
  status,
  onEdit,
  onDelete
}) => {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{name}</h3>
      <p style={styles.status}>{status}</p>
      <div style={styles.actions}>
        <button 
          onClick={() => onEdit(id)}
          style={{...styles.button, ...styles.editButton}}
        >
          Sửa
        </button>
        <button 
          onClick={() => onDelete(id)}
          style={{...styles.button, ...styles.deleteButton}}
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default RoomCard;