const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  console.error('\n⚠️  Please create a .env file in the backend directory with:');
  console.error('PORT=3000');
  console.error('MONGO_URI=mongodb://localhost:27017/cargoNepal');
  console.error('JWT_SECRET=verysecretkeychangethisinproduction');
  console.error('DEFAULT_RATE_PER_KM=25\n');
}

// Verify required environment variables
if (!process.env.MONGO_URI) {
  console.error('\n❌ MONGO_URI is not defined in .env file!');
  console.error('Please create a .env file with the required variables.\n');
  process.exit(1);
}

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: 'https://cargonepalfrontend.vercel.app',
  credentials: true
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

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'CargoNepal API is running' });
});

const PORT = process.env.PORT || 3000;

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://cargonepalfrontend.vercel.app',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join user room based on their ID
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

