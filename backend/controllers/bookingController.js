const Booking = require('../models/BookingModel');
const Truck = require('../models/TruckModel');
const Notification = require('../models/NotificationModel');
const { haversineKm, calculatePrice } = require('../utils/distanceCalculator');
const { geocodeLocation } = require('../utils/geocoding');

// Create booking (customer)
const createBooking = async (req, res) => {
  try {
    const { truckId, pickup, dropoff, notes } = req.body;

    if (!truckId || !pickup || !dropoff) {
      return res.status(400).json({
        success: false,
        message: 'Please provide truckId, pickup, and dropoff locations'
      });
    }

    // Geocode locations if coordinates are not provided
    let pickupCoords = { lat: pickup.lat, lng: pickup.lng };
    let dropoffCoords = { lat: dropoff.lat, lng: dropoff.lng };

    if (!pickup.lat || !pickup.lng) {
      if (!pickup.address) {
        return res.status(400).json({
          success: false,
          message: 'Please provide pickup location address'
        });
      }
      try {
        pickupCoords = await geocodeLocation(pickup.address);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Could not find pickup location: ${error.message}`
        });
      }
    }

    if (!dropoff.lat || !dropoff.lng) {
      if (!dropoff.address) {
        return res.status(400).json({
          success: false,
          message: 'Please provide dropoff location address'
        });
      }
      try {
        dropoffCoords = await geocodeLocation(dropoff.address);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Could not find dropoff location: ${error.message}`
        });
      }
    }

    // Update pickup and dropoff with coordinates
    const finalPickup = {
      address: pickup.address || `${pickupCoords.lat}, ${pickupCoords.lng}`,
      lat: pickupCoords.lat,
      lng: pickupCoords.lng
    };

    const finalDropoff = {
      address: dropoff.address || `${dropoffCoords.lat}, ${dropoffCoords.lng}`,
      lat: dropoffCoords.lat,
      lng: dropoffCoords.lng
    };

    const truck = await Truck.findById(truckId);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    if (!truck.available) {
      return res.status(400).json({ success: false, message: 'Truck is not available' });
    }

    // Calculate distance
    const distanceKm = haversineKm(
      finalPickup.lat,
      finalPickup.lng,
      finalDropoff.lat,
      finalDropoff.lng
    );

    // Calculate price
    const price = calculatePrice(distanceKm, truck.ratePerKm || process.env.DEFAULT_RATE_PER_KM || 25);

    // Create booking
    const booking = await Booking.create({
      truck: truckId,
      owner: truck.owner,
      customer: req.user.id,
      pickup: finalPickup,
      dropoff: finalDropoff,
      distanceKm: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
      price,
      status: 'pending',
      notes
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('truck', 'title type capacityTons ratePerKm')
      .populate('owner', 'name email phone');

    // Create notification for owner
    await Notification.create({
      userId: truck.owner,
      userRole: 'owner',
      message: `New booking request for ${populatedBooking.truck.title}`,
      type: 'booking',
      relatedId: booking._id
    });

    // Emit real-time notification to owner
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${truck.owner}`).emit('new_booking', {
        booking: populatedBooking
      });
    }

    res.status(201).json({
      success: true,
      data: populatedBooking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createBooking };

