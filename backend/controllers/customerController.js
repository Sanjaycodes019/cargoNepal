const Booking = require('../models/BookingModel');
const Truck = require('../models/TruckModel');
const Customer = require('../models/CustomerModel');
const { haversineKm, calculatePrice } = require('../utils/distanceCalculator');
const { geocodeLocation } = require('../utils/geocoding');

// Get customer bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user.id })
      .populate('truck', 'title type capacityTons ratePerKm imageUrl')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or accepted bookings can be cancelled'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Search available trucks by route
const searchTrucksByRoute = async (req, res) => {
  try {
    const { pickup, dropoff } = req.body;

    if (!pickup || !dropoff || !pickup.address || !dropoff.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide pickup and dropoff addresses'
      });
    }

    // Geocode both locations
    let pickupCoords;
    let dropoffCoords;

    try {
      pickupCoords = await geocodeLocation(pickup.address);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Could not find pickup location: ${error.message}`
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

    // Calculate trip distance
    const tripDistance = haversineKm(
      pickupCoords.lat,
      pickupCoords.lng,
      dropoffCoords.lat,
      dropoffCoords.lng
    );

    // Get all available trucks
    const trucks = await Truck.find({ available: true })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate distance from pickup to each truck's location (if truck has location)
    // If no location, we'll use the pickup location as reference
    const trucksWithDistance = trucks.map(truck => {
      let distanceToPickup = 0;

      // If truck has location data, calculate distance from truck to pickup
      if (truck.location && truck.location.lat && truck.location.lng) {
        distanceToPickup = haversineKm(
          truck.location.lat,
          truck.location.lng,
          pickupCoords.lat,
          pickupCoords.lng
        );
      }

      // Total trip estimate (distance to pickup + actual trip distance)
      const totalDistance = distanceToPickup + tripDistance;

      // Calculate estimated price
      const estimatedPrice = calculatePrice(
        tripDistance, // Only charge for the actual trip, not truck's travel to pickup
        truck.ratePerKm || process.env.DEFAULT_RATE_PER_KM || 25
      );

      return {
        ...truck.toObject(),
        distanceToPickup: Math.round(distanceToPickup * 100) / 100,
        tripDistance: Math.round(tripDistance * 100) / 100,
        totalDistance: Math.round(totalDistance * 100) / 100,
        estimatedPrice,
        pickupCoords,
        dropoffCoords
      };
    });

    // Sort by distance to pickup (nearest first), then by price (lowest first)
    trucksWithDistance.sort((a, b) => {
      // First sort by distance to pickup
      if (a.distanceToPickup !== b.distanceToPickup) {
        return a.distanceToPickup - b.distanceToPickup;
      }
      // Then by price
      return a.estimatedPrice - b.estimatedPrice;
    });

    res.json({
      success: true,
      data: {
        trucks: trucksWithDistance,
        route: {
          pickup: {
            address: pickup.address,
            ...pickupCoords
          },
          dropoff: {
            address: dropoff.address,
            ...dropoffCoords
          },
          distance: Math.round(tripDistance * 100) / 100
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, select: '-passwordHash' }
    );

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyBookings,
  cancelBooking,
  searchTrucksByRoute,
  updateProfile
};
