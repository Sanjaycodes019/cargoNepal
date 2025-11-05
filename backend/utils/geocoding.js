// Simple geocoding for Nepal locations
// This uses Nominatim (OpenStreetMap) for geocoding

const axios = require('axios');

// Common Nepal cities with coordinates (fallback if API fails)
const NEPAL_LOCATIONS = {
  'kathmandu': { lat: 27.7172, lng: 85.3240 },
  'pokhara': { lat: 28.2096, lng: 83.9856 },
  'lalitpur': { lat: 27.6710, lng: 85.4298 },
  'bhaktapur': { lat: 27.6710, lng: 85.4298 },
  'biratnagar': { lat: 26.4525, lng: 87.2718 },
  'birgunj': { lat: 27.0174, lng: 84.8758 },
  'dharan': { lat: 26.8147, lng: 87.2847 },
  'butwal': { lat: 27.7000, lng: 83.4667 },
  'nepalgunj': { lat: 28.0500, lng: 81.6167 },
  'hetauda': { lat: 27.4167, lng: 85.0333 },
  'janakpur': { lat: 26.7288, lng: 85.9254 },
  'dhangadhi': { lat: 28.6833, lng: 80.6167 },
  'itahari': { lat: 26.6639, lng: 87.2747 },
  'triyuga': { lat: 26.7907, lng: 86.8236 },
  'chitwan': { lat: 27.5292, lng: 84.3542 },
  'bharatpur': { lat: 27.6833, lng: 84.4333 },
  'lumbini': { lat: 27.4817, lng: 83.2765 },
  'patan': { lat: 27.6710, lng: 85.4298 },
};

/**
 * Geocode a location name to get coordinates
 * @param {string} locationName - Name of the location in Nepal
 * @returns {Promise<{lat: number, lng: number}>} Coordinates
 */
const geocodeLocation = async (locationName) => {
  if (!locationName || typeof locationName !== 'string') {
    throw new Error('Location name is required');
  }

  const locationLower = locationName.toLowerCase().trim();
  
  // First check if it's in our common locations
  if (NEPAL_LOCATIONS[locationLower]) {
    return NEPAL_LOCATIONS[locationLower];
  }

  // Try geocoding API (Nominatim)
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${locationName}, Nepal`,
        format: 'json',
        limit: 1,
        countrycodes: 'np' // Restrict to Nepal
      },
      headers: {
        'User-Agent': 'CargoNepal/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
    }
  } catch (error) {
    console.error('Geocoding API error:', error.message);
  }

  // Fallback: Try to match partial location names
  for (const [key, coords] of Object.entries(NEPAL_LOCATIONS)) {
    if (locationLower.includes(key) || key.includes(locationLower)) {
      return coords;
    }
  }

  // Ultimate fallback: Kathmandu center
  console.warn(`Could not geocode "${locationName}", using Kathmandu as fallback`);
  return NEPAL_LOCATIONS['kathmandu'];
};

module.exports = { geocodeLocation };

