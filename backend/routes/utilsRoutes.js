const express = require('express');
const router = express.Router();
const { calculateBookingDistance } = require('../controllers/utilsController');

// Calculate booking distance and price (for preview)
router.post('/bookings/calculate', calculateBookingDistance);

module.exports = router;

