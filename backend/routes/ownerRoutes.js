const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const {
  getMyTrucks,
  addTruck,
  updateTruck,
  deleteTruck,
  getMyBookings,
  updateBookingStatus,
  updateProfile,
  toggleTruckAvailability
} = require('../controllers/ownerController');

// All routes require authentication and owner role
router.use(authMiddleware);
router.use(authorize('owner'));

router.get('/trucks', getMyTrucks);
router.post('/trucks', addTruck);
router.put('/trucks/:id', updateTruck);
router.put('/trucks/:id/toggle', toggleTruckAvailability);
router.delete('/trucks/:id', deleteTruck);

router.get('/bookings', getMyBookings);

router.get('/bookings/:id', async (req, res) => {
  try {
    const Booking = require('../models/BookingModel');
    const booking = await Booking.findById(req.params.id)
      .populate('truck', 'title type capacityTons ratePerKm')
      .populate('customer', 'name email phone')
      .populate('owner', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/bookings/:id/status', updateBookingStatus);
router.put('/profile', updateProfile);

module.exports = router;
