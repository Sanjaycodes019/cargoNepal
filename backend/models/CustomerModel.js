const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: 'customer' },

  // OTP / verification fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },        // hashed OTP, don't return by default
  otpExpires: { type: Date, select: false }    // expiry timestamp
}, { timestamps: true });

// Optional: helper method to hide sensitive fields when converting to JSON
CustomerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpires;
  return obj;
};

module.exports = mongoose.model('Customer', CustomerSchema);
