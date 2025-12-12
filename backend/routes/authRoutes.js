const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe
} = require('../controllers/authController');

const { authMiddleware } = require('../middleware/authMiddleware');

// AUTH ROUTES
router.post('/register', register);        // Step 1: Register + Send OTP
router.post('/verify-otp', verifyOTP);     // Step 2: Verify OTP
router.post('/resend-otp', resendOTP);     // Optional: Resend OTP
router.post('/login', login);              // Login (works only after verification)

// AUTHORIZED USER ROUTE
router.get('/me', authMiddleware, getMe);

module.exports = router;
