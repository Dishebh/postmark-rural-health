const axios = require("axios");

// Constants for API configuration
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_BASE_URL = "https://overpass-api.de/api/interpreter";
const SEARCH_RADIUS = 5000; // 5km in meters
const MAX_HOSPITALS = 3;

/**
 * Geocode a location string to coordinates using Nominatim
 * @param {string} locationText - The location text to geocode
 * @returns {Promise<{lat: number, lon: number} | null>} Coordinates or null if not found
 */
const geocodeLocation = async (locationText) => {
  try {
    // Clean and prepare the location text
    const cleanLocation = locationText
      .replace(/near\s+/i, "") // Remove "near" prefix
      .trim();

    const response = await axios.get(NOMINATIM_BASE_URL, {
      params: {
        q: cleanLocation,
        format: "json",
        limit: 1,
        addressdetails: 1,
      },
      headers: {
        "User-Agent": "RuralHealthApp/1.0", // Required by Nominatim's usage policy
      },
    });

    if (!response.data || response.data.length === 0) {
      console.log(`No coordinates found for location: ${locationText}`);
      return null;
    }

    const { lat, lon } = response.data[0];
    return {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    };
  } catch (error) {
    console.error("Error geocoding location:", error.message);
    return null;
  }
};

/**
 * Find nearby hospitals using Overpass API
 * @param {string} locationText - The location text to search around
 * @returns {Promise<Array<{name: string, address: string, lat: number, lon: number}>>} List of nearby hospitals
 */
const getNearbyHospitals = async (locationText) => {
  try {
    // First, get coordinates for the location
    const coords = await geocodeLocation(locationText);
    if (!coords) {
      return [];
    }

    // Construct Overpass QL query
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${SEARCH_RADIUS},${coords.lat},${coords.lon});
        node["amenity"="clinic"](around:${SEARCH_RADIUS},${coords.lat},${coords.lon});
        way["amenity"="hospital"](around:${SEARCH_RADIUS},${coords.lat},${coords.lon});
        way["amenity"="clinic"](around:${SEARCH_RADIUS},${coords.lat},${coords.lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.data || !response.data.elements) {
      return [];
    }

    // Process and format the results
    const hospitals = response.data.elements
      .filter((element) => {
        // Filter for nodes and ways that have a name
        return element.tags && element.tags.name;
      })
      .map((element) => {
        // Extract address components
        const addressParts = [];
        if (element.tags["addr:street"]) {
          addressParts.push(element.tags["addr:street"]);
        }
        if (element.tags["addr:city"]) {
          addressParts.push(element.tags["addr:city"]);
        }
        if (element.tags["addr:state"]) {
          addressParts.push(element.tags["addr:state"]);
        }

        return {
          name: element.tags.name,
          address: addressParts.join(", ") || "Address not available",
          lat: element.lat || element.center?.lat,
          lon: element.lon || element.center?.lon,
        };
      })
      // Remove duplicates based on name
      .filter(
        (hospital, index, self) =>
          index === self.findIndex((h) => h.name === hospital.name)
      )
      // Filter out entries without coordinates
      .filter((hospital) => hospital.lat && hospital.lon)
      // Limit to MAX_HOSPITALS
      .slice(0, MAX_HOSPITALS);

    return hospitals;
  } catch (error) {
    console.error("Error finding nearby hospitals:", error.message);
    return [];
  }
};

/**
 * Generate an OpenStreetMap link for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} name - Location name
 * @returns {string} OpenStreetMap URL
 */
const getMapLink = (lat, lon, name) => {
  const encodedName = encodeURIComponent(name);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=17&query=${encodedName}`;
};

// Helper function to format hospital list for email
const formatHospitalList = (hospitals) => {
  if (!hospitals || hospitals.length === 0) {
    return "No nearby hospitals found.";
  }

  return hospitals
    .map((hospital, index) => {
      const mapLink = getMapLink(hospital.lat, hospital.lon, hospital.name);
      return `${index + 1}. ${hospital.name}
   ${hospital.address}
   View on map: ${mapLink}`;
    })
    .join("\n\n");
};

module.exports = {
  geocodeLocation,
  getNearbyHospitals,
  formatHospitalList,
  getMapLink, // Export for testing
};
