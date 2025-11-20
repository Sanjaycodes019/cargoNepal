const axios = require('axios');
const Truck = require('../models/TruckModel');

// ===============================
// GET ALL TRUCKS (PUBLIC)
// ===============================
const getTrucks = async (req, res) => {
  try {
    const { type, capacity, available } = req.query;
    const filter = {};

    if (type) filter.type = { $regex: new RegExp(type, 'i') };
    if (capacity) filter.capacityTons = { $gte: Number(capacity) };
    if (available !== undefined) filter.available = available === 'true';

    const trucks = await Truck.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: trucks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// GET SINGLE TRUCK
// ===============================
const getTruckById = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('owner', 'name email phone address');

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    res.json({ success: true, data: truck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// CREATE TRUCK (AUTO GEOCODING)
// ===============================
const createTruck = async (req, res) => {
  try {
    const { locationString, ...rest } = req.body;

    let lat = null;
    let lng = null;

    if (locationString) {
      const geo = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationString)}&key=e4019cff3b1f4ce38bb45a69ce38b990`
      );

      if (geo.data.results.length > 0) {
        lat = geo.data.results[0].geometry.lat;
        lng = geo.data.results[0].geometry.lng;
      }
    }

    const truck = await Truck.create({
      ...rest,
      location: { lat, lng }
    });

    res.status(201).json({ success: true, data: truck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// UPDATE TRUCK (AUTO UPDATE LOCATION)
// ===============================
const updateTruck = async (req, res) => {
  try {
    const { locationString, ...rest } = req.body;

    let updateData = { ...rest };

    if (locationString) {
      const geo = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationString)}&key=e4019cff3b1f4ce38bb45a69ce38b990`
      );

      if (geo.data.results.length > 0) {
        updateData.location = {
          lat: geo.data.results[0].geometry.lat,
          lng: geo.data.results[0].geometry.lng
        };
      }
    }

    const truck = await Truck.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({ success: true, data: truck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck
};
