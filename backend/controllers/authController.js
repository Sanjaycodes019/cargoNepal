const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/AdminModel');
const Owner = require('../models/OwnerModel');
const Customer = require('../models/CustomerModel');

// Register user (customer or owner)
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!['customer', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be customer, owner, or admin' });
    }

    // Check if user exists
    let UserModel;
    if (role === 'admin') {
      UserModel = Admin;
    } else if (role === 'owner') {
      UserModel = Owner;
    } else {
      UserModel = Customer;
    }
    
    const existingUser = await UserModel.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      phone,
      address,
      role
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        }
      },
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login user (admin, owner, or customer)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Try to find user in any collection
    let user = await Admin.findOne({ email });
    let UserModel = Admin;

    if (!user) {
      user = await Owner.findOne({ email });
      UserModel = Owner;
    }

    if (!user) {
      user = await Customer.findOne({ email });
      UserModel = Customer;
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || null,
          address: user.address || null
        }
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    let user;

    if (req.user.role === 'admin') {
      user = await Admin.findById(req.user.id).select('-passwordHash');
    } else if (req.user.role === 'owner') {
      user = await Owner.findById(req.user.id).select('-passwordHash').populate('trucks');
    } else {
      user = await Customer.findById(req.user.id).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe };

