const express = require('express');
const router = express.Router();
const { getTrucks, getTruckById, nearestTrucks } = require('../controllers/truckController');

router.get('/', getTrucks);
router.post('/nearest', nearestTrucks); 
router.get('/:id', getTruckById);

module.exports = router;
