const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');

// Import customer-specific controllers
const { getMyBookings, cancelBooking, updateProfile } = require('../controllers/customerController');

// Import the searchTrucks function from truckController
const { searchTrucks } = require('../controllers/truckController');

// All routes require authentication and customer role
router.use(authMiddleware);
router.use(authorize('customer'));

// Customer routes
router.get('/bookings', getMyBookings);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/profile', updateProfile);

// FIXED: Use searchTrucks from truckController instead of searchTrucksByRoute
router.post('/search-trucks', searchTrucks);

module.exports = router;
