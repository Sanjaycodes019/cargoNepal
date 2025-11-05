const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  title: { type: String, required: true },
  type: { type: String },
  capacityTons: { type: Number },
  ratePerKm: { type: Number, default: 25 },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  available: { type: Boolean, default: true },
  description: { type: String },
  imageUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Truck', TruckSchema);

