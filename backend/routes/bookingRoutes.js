const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const { createBooking } = require('../controllers/bookingController');
const { generateInvoice } = require('../controllers/invoiceController');

// Create booking requires customer authentication
router.post('/', authMiddleware, authorize('customer'), createBooking);

// Generate invoice (accessible to customer and owner of the booking)
router.get('/:id/invoice', authMiddleware, generateInvoice);

module.exports = router;

