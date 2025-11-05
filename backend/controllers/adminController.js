const Admin = require('../models/AdminModel');
const Owner = require('../models/OwnerModel');
const Customer = require('../models/CustomerModel');
const Truck = require('../models/TruckModel');
const Booking = require('../models/BookingModel');

// Get all users
const getUsers = async (req, res) => {
  try {
    const owners = await Owner.find().select('-passwordHash');
    const customers = await Customer.find().select('-passwordHash');
    const admins = await Admin.find().select('-passwordHash');

    res.json({
      success: true,
      data: {
        owners,
        customers,
        admins
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // owner, customer, or admin

    let UserModel;
    if (role === 'owner') {
      UserModel = Owner;
    } else if (role === 'customer') {
      UserModel = Customer;
    } else if (role === 'admin') {
      UserModel = Admin;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role parameter' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If deleting owner, also delete their trucks
    if (role === 'owner') {
      await Truck.deleteMany({ owner: id });
      await Booking.deleteMany({ owner: id });
    }

    // If deleting customer, delete their bookings
    if (role === 'customer') {
      await Booking.deleteMany({ customer: id });
    }

    await UserModel.findByIdAndDelete(id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('truck', 'title type')
      .populate('owner', 'name email')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all trucks
const getAllTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: trucks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings (for now, just return current settings)
// In a real app, you'd store these in a Settings model
const updateSettings = async (req, res) => {
  try {
    const { defaultRatePerKm } = req.body;

    if (defaultRatePerKm) {
      process.env.DEFAULT_RATE_PER_KM = defaultRatePerKm.toString();
    }

    res.json({
      success: true,
      data: {
        defaultRatePerKm: process.env.DEFAULT_RATE_PER_KM || 25
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await Owner.countDocuments() + await Customer.countDocuments();
    const totalTrucks = await Truck.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeBookings = await Booking.countDocuments({ status: { $in: ['accepted', 'in_transit'] } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTrucks,
        totalBookings,
        pendingBookings,
        activeBookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    // Bookings per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const bookingsByMonth = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Trucks per owner
    const trucksPerOwner = await Truck.aggregate([
      {
        $group: {
          _id: '$owner',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Populate owner names
    const trucksPerOwnerWithNames = await Truck.populate(trucksPerOwner, {
      path: '_id',
      select: 'name',
      model: 'Owner'
    });

    res.json({
      success: true,
      data: {
        bookingsByMonth,
        bookingsByStatus,
        trucksPerOwner: trucksPerOwnerWithNames
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getAllBookings,
  getAllTrucks,
  updateSettings,
  getDashboardStats,
  getAnalytics
};

