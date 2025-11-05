const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: 'customer' }
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);

