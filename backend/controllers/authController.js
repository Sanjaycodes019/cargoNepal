const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/AdminModel');
const Owner = require('../models/OwnerModel');
const Customer = require('../models/CustomerModel');
const nodemailer = require('nodemailer');

// -----------------------
// EMAIL SENDER CONFIG
// -----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // MUST BE app password
  }
});

// -----------------------
// SEND OTP EMAIL HELPER
// -----------------------
const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: `"CargoNepal" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your CargoNepal Email Verification Code",
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP code is:</p>
      <h1 style="color:#ff6600;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};

// -----------------------
// GENERATE OTP
// -----------------------
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// -----------------------
// REGISTER (SENDS OTP)
// -----------------------
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (!['customer', 'owner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    let UserModel = role === 'admin' ? Admin : role === 'owner' ? Owner : Customer;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    const user = await UserModel.create({
      name,
      email,
      passwordHash,
      phone,
      address,
      role,
      otp: otpHash,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send OTP Email
    await sendOTPEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'Registered successfully. OTP sent to your email.',
      data: { email }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------
// VERIFY OTP
// -----------------------
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email & OTP required" });

    let user =
      (await Admin.findOne({ email }).select("+otp +otpExpires")) ||
      (await Owner.findOne({ email }).select("+otp +otpExpires")) ||
      (await Customer.findOne({ email }).select("+otp +otpExpires"));

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.isVerified)
      return res.json({ success: true, message: "User already verified" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    const isValid = await bcrypt.compare(otp, user.otp);
    if (!isValid)
      return res.status(400).json({ success: false, message: "Incorrect OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------
// RESEND OTP
// -----------------------
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    let user =
      (await Admin.findOne({ email })) ||
      (await Owner.findOne({ email })) ||
      (await Customer.findOne({ email }));

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (user.isVerified)
      return res.json({ success: true, message: "User already verified" });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    user.otp = otpHash;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ success: true, message: "OTP resent to email" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------
// LOGIN (BLOCKED IF NOT VERIFIED)
// -----------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user =
      (await Admin.findOne({ email })) ||
      (await Owner.findOne({ email })) ||
      (await Customer.findOne({ email }));

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified)
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please verify OTP.",
        requireVerification: true
      });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Login successful",
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
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------
// GET CURRENT USER
// -----------------------
const getMe = async (req, res) => {
  try {
    let user;

    if (req.user.role === 'admin')
      user = await Admin.findById(req.user.id).select("-passwordHash");
    else if (req.user.role === 'owner')
      user = await Owner.findById(req.user.id).select("-passwordHash").populate("trucks");
    else
      user = await Customer.findById(req.user.id).select("-passwordHash");

    res.json({ success: true, data: user });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, verifyOTP, resendOTP, getMe };
