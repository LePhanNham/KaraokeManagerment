import React, { useState, useEffect } from 'react';
import { authApi } from '../services/auth';

interface User {
  name: string;
  email: string;
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#333'
  },
  info: {
    marginTop: '20px'
  },
  text: {
    margin: '10px 0',
    color: '#666'
  },
  error: {
    color: 'red',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid red',
    borderRadius: '4px'
  },
  loading: {
    textAlign: 'center' as const,
    padding: '20px',
    color: '#666'
  }
} as const;

const Profile = () => {
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authApi.getProfile();
        setProfile(data);
      } catch (err) {
        setError('Không thể tải thông tin người dùng');
      }
    };
    loadProfile();
  }, []);

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  if (!profile) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Thông tin cá nhân</h2>
        <div style={styles.info}>
          <p style={styles.text}>Tên: {profile.name}</p>
          <p style={styles.text}>Email: {profile.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;