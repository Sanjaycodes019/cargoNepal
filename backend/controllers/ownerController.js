const Truck = require('../models/TruckModel');
const Booking = require('../models/BookingModel');
const Owner = require('../models/OwnerModel');
const Notification = require('../models/NotificationModel');
const axios = require("axios");


// -----------------------------
// GET OWNER'S TRUCKS
// -----------------------------
const getMyTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: trucks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// ADD TRUCK
// -----------------------------
const addTruck = async (req, res) => {
  try {
    const { title, type, capacityTons, ratePerKm, locationString, available, description, imageUrl } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "Title is required" });
    if (!locationString) return res.status(400).json({ success: false, message: "Location is required" });

    // 🌍 Geocode Address
    const geoRes = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationString)}&key=e4019cff3b1f4ce38bb45a69ce38b990`
    );

    const geo = geoRes.data.results[0];
    if (!geo) return res.status(400).json({ success: false, message: "Invalid location" });

    const location = {
      lat: geo.geometry.lat,
      lng: geo.geometry.lng,
      address: geo.formatted
    };

    const truck = await Truck.create({
      owner: req.user.id,
      title,
      type,
      capacityTons,
      ratePerKm: ratePerKm || 25,
      location,
      available: available ?? true,
      description,
      imageUrl
    });

    await Owner.findByIdAndUpdate(req.user.id, { $push: { trucks: truck._id } });

    res.status(201).json({ success: true, data: truck, message: "Truck added successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// UPDATE TRUCK
// -----------------------------
const updateTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });

    if (truck.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (req.body.locationString) {
      const geoRes = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(req.body.locationString)}&key=e4019cff3b1f4ce38bb45a69ce38b990`
      );

      const geo = geoRes.data.results[0];
      if (geo) {
        req.body.location = {
          lat: geo.geometry.lat,
          lng: geo.geometry.lng,
          address: geo.formatted
        };
      }
    }

    const updatedTruck = await Truck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedTruck, message: "Truck updated successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// TOGGLE TRUCK AVAILABILITY
// -----------------------------
const toggleTruckAvailability = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });

    if (truck.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    truck.available = !truck.available;
    await truck.save();

    res.json({ success: true, message: "Truck availability updated", data: truck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// DELETE TRUCK
// -----------------------------
const deleteTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });

    if (truck.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await Truck.findByIdAndDelete(req.params.id);
    await Owner.findByIdAndUpdate(req.user.id, { $pull: { trucks: truck._id } });

    res.json({ success: true, message: "Truck deleted successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// GET OWNER BOOKINGS
// -----------------------------
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate("truck", "title type capacityTons ratePerKm")
      .populate("customer", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// UPDATE BOOKING STATUS
// -----------------------------
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (!["accepted", "declined", "in_transit", "completed"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate("truck")
      .populate("customer")
      .populate("owner");

    const io = req.app.get("io");
    if (io) {
      io.to(`user-${booking.customer}`).emit("booking_updated", { booking: updatedBooking });
      io.to(`user-${req.user.id}`).emit("booking_updated", { booking: updatedBooking });
    }

    res.json({ success: true, data: updatedBooking, message: "Status updated" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// UPDATE OWNER PROFILE
// -----------------------------
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    const updated = await Owner.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated, message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// EXPORT
module.exports = {
  getMyTrucks,
  addTruck,
  updateTruck,
  deleteTruck,
  getMyBookings,
  updateBookingStatus,
  updateProfile,
  toggleTruckAvailability,
};
