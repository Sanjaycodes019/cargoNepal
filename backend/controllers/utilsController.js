const { haversineKm, calculatePrice } = require('../utils/distanceCalculator');
const { geocodeLocation } = require('../utils/geocoding');

// Calculate distance and price for booking preview
const calculateBookingDistance = async (req, res) => {
  try {
    const { pickup, dropoff, ratePerKm } = req.body;

    if (!pickup || !dropoff || !pickup.address || !dropoff.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pickup and dropoff addresses'
      });
    }

    // Geocode both locations
    const pickupCoords = pickup.lat && pickup.lng 
      ? { lat: pickup.lat, lng: pickup.lng }
      : await geocodeLocation(pickup.address);
    
    const dropoffCoords = dropoff.lat && dropoff.lng
      ? { lat: dropoff.lat, lng: dropoff.lng }
      : await geocodeLocation(dropoff.address);

    // Calculate distance
    const distanceKm = haversineKm(
      pickupCoords.lat,
      pickupCoords.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );

    // Calculate price
    const estimatedPrice = calculatePrice(distanceKm, ratePerKm || 25);

    res.json({
      success: true,
      data: {
        distanceKm: Math.round(distanceKm * 100) / 100,
        estimatedPrice,
        pickupCoords,
        dropoffCoords
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { calculateBookingDistance };

