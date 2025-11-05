const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userRole: { type: String, enum: ['admin', 'owner', 'customer'], required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'system', 'payment'], default: 'booking' },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // booking ID, etc.
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);

