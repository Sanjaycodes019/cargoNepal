const Booking = require('../models/BookingModel');
const Notification = require('../models/NotificationModel');

// Simulate payment
const simulatePayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('owner', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    if (booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status === 'declined' || booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot pay for declined or cancelled booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    // Simulate payment - in real app, this would call payment gateway
    booking.paymentStatus = 'paid';
    await booking.save();

    // Create notification for owner
    await Notification.create({
      userId: booking.owner._id,
      userRole: 'owner',
      message: `Payment received for booking from ${booking.customer.name}`,
      type: 'payment',
      relatedId: booking._id
    });

    res.json({
      success: true,
      data: booking,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { simulatePayment };

