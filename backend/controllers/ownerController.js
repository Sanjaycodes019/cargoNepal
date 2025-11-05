const Truck = require('../models/TruckModel');
const Booking = require('../models/BookingModel');
const Owner = require('../models/OwnerModel');
const Notification = require('../models/NotificationModel');

// Get owner's trucks
const getMyTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: trucks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add truck
const addTruck = async (req, res) => {
  try {
    const { title, type, capacityTons, ratePerKm, location, available, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const truck = await Truck.create({
      owner: req.user.id,
      title,
      type,
      capacityTons,
      ratePerKm: ratePerKm || process.env.DEFAULT_RATE_PER_KM || 25,
      location,
      available: available !== undefined ? available : true,
      description
    });

    // Add truck to owner's trucks array
    await Owner.findByIdAndUpdate(req.user.id, {
      $push: { trucks: truck._id }
    });

    res.status(201).json({
      success: true,
      data: truck,
      message: 'Truck added successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update truck
const updateTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Check ownership
    if (truck.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this truck' });
    }

    const updatedTruck = await Truck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedTruck,
      message: 'Truck updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete truck
const deleteTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Check ownership
    if (truck.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this truck' });
    }

    await Truck.findByIdAndDelete(req.params.id);

    // Remove from owner's trucks array
    await Owner.findByIdAndUpdate(req.user.id, {
      $pull: { trucks: truck._id }
    });

    res.json({ success: true, message: 'Truck deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get bookings for owner's trucks
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate('truck', 'title type capacityTons ratePerKm')
      .populate('customer', 'name email phone')
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update booking status (accept/decline)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    if (booking.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    if (!['accepted', 'declined', 'in_transit', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate('truck', 'title type capacityTons ratePerKm')
      .populate('customer', 'name email phone')
      .populate('owner', 'name email phone');

    // Create notification for customer with appropriate message
    const statusMessages = {
      'accepted': 'has been accepted',
      'declined': 'has been declined',
      'in_transit': 'is now in transit',
      'completed': 'has been completed'
    };
    
    const statusMessage = statusMessages[status] || `has been ${status}`;
    const notification = await Notification.create({
      userId: booking.customer,
      userRole: 'customer',
      message: `Your booking for ${updatedBooking.truck.title} ${statusMessage}`,
      type: 'booking',
      relatedId: booking._id
    });

    // Emit real-time update via Socket.IO to both customer and owner
    const io = req.app.get('io');
    if (io) {
      // Notify customer
      io.to(`user-${booking.customer}`).emit('booking_updated', {
        booking: updatedBooking,
        notification
      });
      
      // Also notify owner (so their dashboard updates too)
      io.to(`user-${req.user.id}`).emit('booking_updated', {
        booking: updatedBooking
      });
      
      // Broadcast to admin users (for admin dashboard updates)
      io.emit('admin_booking_updated', {
        booking: updatedBooking
      });
    }

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking status updated successfully'
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

    const updatedOwner = await Owner.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, select: '-passwordHash' }
    );

    res.json({
      success: true,
      data: updatedOwner,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle truck availability
const toggleTruckAvailability = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Check ownership
    if (truck.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    truck.available = !truck.available;
    await truck.save();

    res.json({
      success: true,
      data: truck,
      message: `Truck marked as ${truck.available ? 'available' : 'unavailable'}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyTrucks,
  addTruck,
  updateTruck,
  deleteTruck,
  getMyBookings,
  updateBookingStatus,
  updateProfile,
  toggleTruckAvailability
};

