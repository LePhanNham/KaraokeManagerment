import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import reportRoutes from './routes/reportRoutes';
// Import other routes as needed

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/reports', reportRoutes);
// Register other routes as needed

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Report routes registered at /api/reports`);
});

export default app;