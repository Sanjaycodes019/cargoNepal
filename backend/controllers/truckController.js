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
      location: {
        address: locationString,
        lat,
        lng
      }
    });

    res.status(201).json({ success: true, data: truck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// SEARCH TRUCKS (FOR CUSTOMER BOOKING)
// Called by: POST /customer/search-trucks
// THIS IS THE MAIN FUNCTION YOUR FRONTEND USES
// ===============================
const searchTrucks = async (req, res) => {
  try {
    const { pickup, dropoff, requiredCapacity } = req.body;

    console.log('\n========================================');
    console.log('SEARCH TRUCKS - REQUEST RECEIVED');
    console.log('========================================');
    console.log('Pickup:', pickup?.address);
    console.log('Dropoff:', dropoff?.address);
    console.log('Required Capacity:', requiredCapacity);
    console.log('Required Capacity Type:', typeof requiredCapacity);
    console.log('========================================\n');

    // Validate inputs
    if (!pickup?.address || !dropoff?.address) {
      return res.status(400).json({ 
        success: false, 
        message: "Pickup and dropoff addresses are required" 
      });
    }

    if (!requiredCapacity) {
      return res.status(400).json({ 
        success: false, 
        message: "Required capacity must be specified" 
      });
    }

    // CRITICAL: Convert to number FIRST
    const requiredCapacityNum = Number(requiredCapacity);
    
    if (isNaN(requiredCapacityNum) || requiredCapacityNum <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid capacity value" 
      });
    }

    console.log('✓ Converted Required Capacity to Number:', requiredCapacityNum);

    // ===============================
    // STEP 1: GEOCODE PICKUP & DROPOFF
    // ===============================
    const OPENCAGE_API_KEY = 'e4019cff3b1f4ce38bb45a69ce38b990';

    const [pickupGeo, dropoffGeo] = await Promise.all([
      axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(pickup.address)}&key=${OPENCAGE_API_KEY}`),
      axios.get(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(dropoff.address)}&key=${OPENCAGE_API_KEY}`)
    ]);

    if (!pickupGeo.data.results[0] || !dropoffGeo.data.results[0]) {
      return res.status(400).json({ 
        success: false, 
        message: "Could not find one or both locations. Please check spelling." 
      });
    }

    const pickupCoords = {
      lat: pickupGeo.data.results[0].geometry.lat,
      lng: pickupGeo.data.results[0].geometry.lng,
      address: pickup.address
    };

    const dropoffCoords = {
      lat: dropoffGeo.data.results[0].geometry.lat,
      lng: dropoffGeo.data.results[0].geometry.lng,
      address: dropoff.address
    };

    console.log('✓ Geocoding successful');

    // ===============================
    // STEP 2: CALCULATE TRIP DISTANCE
    // ===============================
    const calcDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const tripDistance = Math.round(
      calcDistance(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng)
    );

    console.log('✓ Trip Distance:', tripDistance, 'km');

    // ===============================
    // STEP 3: FIND TRUCKS WITH SUFFICIENT CAPACITY
    // ===============================
    const allTrucks = await Truck.find().populate('owner', 'name email phone');

    console.log('\n========================================');
    console.log('FILTERING TRUCKS');
    console.log('========================================');
    console.log('Total trucks in database:', allTrucks.length);
    console.log('Required capacity:', requiredCapacityNum, 'tons');
    console.log('Filter rule: truck.capacityTons >= ', requiredCapacityNum);
    console.log('========================================\n');

    // CRITICAL FILTER: Only trucks with capacity >= required
    const eligibleTrucks = [];

    allTrucks.forEach((truck, index) => {
      const hasLocation = truck.location?.lat && truck.location?.lng;
      
      // FORCE CONVERSION TO NUMBER for comparison
      const truckCapacity = Number(truck.capacityTons);
      
      // THE CRITICAL COMPARISON
      const meetsCapacity = truckCapacity >= requiredCapacityNum;

      console.log(`[${index + 1}] ${truck.title || 'Unnamed Truck'}`);
      console.log(`    - Capacity in DB: ${truck.capacityTons} (type: ${typeof truck.capacityTons})`);
      console.log(`    - Capacity as Number: ${truckCapacity}`);
      console.log(`    - Has Location: ${hasLocation}`);
      console.log(`    - Comparison: ${truckCapacity} >= ${requiredCapacityNum} = ${meetsCapacity}`);
      console.log(`    - RESULT: ${hasLocation && meetsCapacity ? '✓ INCLUDED' : '✗ EXCLUDED'}`);
      console.log('');

      // Only add trucks that meet BOTH conditions
      if (hasLocation && meetsCapacity) {
        eligibleTrucks.push(truck);
      }
    });

    console.log('========================================');
    console.log('FILTER RESULTS');
    console.log('========================================');
    console.log('Eligible trucks:', eligibleTrucks.length);
    console.log('Excluded trucks:', allTrucks.length - eligibleTrucks.length);
    console.log('========================================\n');

    // Calculate distance from truck to pickup & estimated price
    const trucksWithDetails = eligibleTrucks.map(truck => {
      const distanceToPickup = Math.round(
        calcDistance(truck.location.lat, truck.location.lng, pickupCoords.lat, pickupCoords.lng)
      );

      // Estimate price: (trip distance * rate per km) + base fee
      const estimatedPrice = Math.round((tripDistance * (truck.ratePerKm || 50)) + 500);

      // Calculate excess capacity (how much more than required)
      const capacityDifference = Number(truck.capacityTons) - requiredCapacityNum;

      return {
        ...truck.toObject(),
        distanceToPickup,
        tripDistance,
        estimatedPrice,
        capacityDifference
      };
    });

    // ===============================
    // STEP 4: SMART SORTING
    // ===============================
    const capacityWeight = 10;  // Prioritize closer capacity match
    const distanceWeight = 1;   // Secondary priority

    const sortedTrucks = trucksWithDetails
      .map(truck => ({
        ...truck,
        matchScore: (truck.capacityDifference * capacityWeight) + (truck.distanceToPickup * distanceWeight)
      }))
      .sort((a, b) => a.matchScore - b.matchScore);

    console.log('✓ Sorting complete\n');

    // ===============================
    // RESPONSE
    // ===============================
    console.log('========================================');
    console.log('SENDING RESPONSE');
    console.log('========================================');
    console.log('Trucks being sent:', sortedTrucks.length);
    console.log('========================================\n');

    res.json({
      success: true,
      data: {
        trucks: sortedTrucks,
        route: {
          pickup: pickupCoords,
          dropoff: dropoffCoords,
          distance: tripDistance
        }
      }
    });

  } catch (error) {
    console.error('\n========================================');
    console.error('ERROR IN SEARCH TRUCKS');
    console.error('========================================');
    console.error(error);
    console.error('========================================\n');
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Something went wrong while searching trucks' 
    });
  }
};

// ===============================
// NEAREST TRUCKS (LEGACY)
// ===============================
const nearestTrucks = async (req, res) => {
  try {
    const { pickupLat, pickupLng, requiredCapacity } = req.body;
    
    if (!pickupLat || !pickupLng) {
      return res.status(400).json({ message: "Pickup location required" });
    }

    if (!requiredCapacity) {
      return res.status(400).json({ message: "Required capacity must be specified" });
    }

    const requiredCapacityNum = Number(requiredCapacity);
    
    if (isNaN(requiredCapacityNum) || requiredCapacityNum <= 0) {
      return res.status(400).json({ message: "Invalid capacity value" });
    }

    const trucks = await Truck.find();

    const calcDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    let filtered = trucks
      .filter(t => {
        const hasLocation = t.location?.lat && t.location?.lng;
        const truckCapacity = Number(t.capacityTons);
        const hasEnoughCapacity = truckCapacity >= requiredCapacityNum;
        
        if (hasLocation && !hasEnoughCapacity) {
          console.log(`Truck ${t.title} excluded: capacity ${truckCapacity} < required ${requiredCapacityNum}`);
        }
        
        return hasLocation && hasEnoughCapacity;
      })
      .map(t => {
        const distance = calcDistance(pickupLat, pickupLng, t.location.lat, t.location.lng);
        const estimatedPrice = Math.round(distance * 60 + 500);
        const capacityDifference = Number(t.capacityTons) - requiredCapacityNum;

        return {
          ...t.toObject(),
          distance,
          estimatedPrice,
          capacityDifference
        };
      });

    const capacityWeight = 10;
    const distanceWeight = 1;
    
    filtered = filtered
      .map(t => ({
        ...t,
        matchScore: (t.capacityDifference * capacityWeight) + (t.distance * distanceWeight)
      }))
      .sort((a, b) => a.matchScore - b.matchScore);

    res.json({ success: true, data: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ===============================
// UPDATE TRUCK
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
          address: locationString,
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
  updateTruck,
  nearestTrucks,
  searchTrucks
};
