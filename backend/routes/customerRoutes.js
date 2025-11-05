const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const { getMyBookings, cancelBooking, updateProfile, searchTrucksByRoute } = require('../controllers/customerController');

// All routes require authentication and customer role
router.use(authMiddleware);
router.use(authorize('customer'));

router.get('/bookings', getMyBookings);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/profile', updateProfile);
router.post('/search-trucks', searchTrucksByRoute);

module.exports = router;

