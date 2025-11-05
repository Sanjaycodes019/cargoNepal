const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const {
  getUsers,
  deleteUser,
  getAllBookings,
  getAllTrucks,
  updateSettings,
  getDashboardStats,
  getAnalytics
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.delete('/user/:id', deleteUser);
router.get('/bookings', getAllBookings);
router.get('/trucks', getAllTrucks);
router.put('/settings', updateSettings);
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

module.exports = router;

