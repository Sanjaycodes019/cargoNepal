const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  trucks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Truck' }],
  role: { type: String, default: 'owner' }
}, { timestamps: true });

module.exports = mongoose.model('Owner', OwnerSchema);

