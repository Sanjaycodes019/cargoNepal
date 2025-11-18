const Truck = require('../models/TruckModel');

// Get all trucks (public, with filters)
const getTrucks = async (req, res) => {
  try {
    const { type, capacity, available } = req.query;
    const filter = {};

    // Case-insensitive search for type using regex
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

// Get single truck by ID
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

module.exports = { getTrucks, getTruckById };
