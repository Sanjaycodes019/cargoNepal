const express = require('express');
const router = express.Router();
const { getTrucks, getTruckById } = require('../controllers/truckController');

// Public routes - no authentication required
router.get('/', getTrucks);
router.get('/:id', getTruckById);

module.exports = router;

