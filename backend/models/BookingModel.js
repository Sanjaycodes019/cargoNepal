const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  capacityTons: { type: Number, required: true },   // example: 15

  pickup: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  dropoff: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },

  distanceKm: { type: Number },
  price: { type: Number },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },

  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
