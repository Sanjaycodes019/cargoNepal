const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars - Don't crash if .env is missing (Render uses dashboard env vars)
try {
  const result = dotenv.config({ path: path.resolve(__dirname, '.env') });
  if (result.error && process.env.NODE_ENV !== 'production') {
    console.warn('No .env file found - using environment variables from system');
  }
} catch (error) {
  console.log('ℹ️  Running in production mode - using platform environment variables');
}

// Verify required environment variables
if (!process.env.MONGO_URI) {
  console.error('\nMONGO_URI is not defined!');
  console.error('Please set environment variables in Render dashboard or create .env file locally.\n');
  process.exit(1);
}

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// CORS Configuration - Allow both production frontend and localhost
const allowedOrigins = [
  'https://cargonepalfrontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/owner', require('./routes/ownerRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/trucks', require('./routes/truckRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/utils', require('./routes/utilsRoutes'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Health check / Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'CargoNepal API is running',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      trucks: '/api/trucks',
      bookings: '/api/bookings',
      reviews: '/api/reviews',
      payments: '/api/payments',
      notifications: '/api/notifications'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join user room based on their ID
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });
  
  // Handle new notification
  socket.on('new-notification', (data) => {
    io.to(`user-${data.userId}`).emit('notification', data);
  });
  
  // Handle booking updates
  socket.on('booking-update', (data) => {
    io.to(`user-${data.userId}`).emit('booking-status-change', data);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io accessible to routes
app.set('io', io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend: https://cargonepalfrontend.vercel.app`);
  console.log(`API: https://cargonepal.onrender.com`);
});
