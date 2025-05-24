const axios = require("axios");

// Constants for API configuration
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_BASE_URL = "https://overpass-api.de/api/interpreter";
const SEARCH_RADIUS = 5000; // 5km in meters
const MAX_HOSPITALS = 3;

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param {number} lat1 - Latitude of first point in degrees
 * @param {number} lon1 - Longitude of first point in degrees
 * @param {number} lat2 - Latitude of second point in degrees
 * @param {number} lon2 - Longitude of second point in degrees
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

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
    `
      .replace(/\s+/g, " ")
      .trim();

    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.data?.elements) return [];

    // Process and format the results
    const hospitals = await Promise.all(
      response.data.elements
        .filter((element) => element.tags?.name)
        .map(async (element) => {
          // Extract address components
          const addressParts = [
            element.tags["addr:street"],
            element.tags["addr:city"],
            element.tags["addr:state"],
            element.tags["addr:postcode"],
          ].filter(Boolean);

          // Get coordinates either directly or from center/bounds
          let lat,
            lon,
            isApproximate = false;

          if (element.lat && element.lon) {
            lat = element.lat;
            lon = element.lon;
          } else if (element.center) {
            lat = element.center.lat;
            lon = element.center.lon;
            isApproximate = true;
          } else if (element.bounds) {
            lat = (element.bounds.minlat + element.bounds.maxlat) / 2;
            lon = (element.bounds.minlon + element.bounds.maxlon) / 2;
            isApproximate = true;
          } else if (addressParts.length > 0) {
            // Try to geocode the address if no coordinates available
            const address = `${element.tags.name}, ${addressParts.join(", ")}`;
            const geocodedCoords = await geocodeLocation(address);
            if (geocodedCoords) {
              lat = geocodedCoords.lat;
              lon = geocodedCoords.lon;
              isApproximate = true;
            } else {
              console.warn(
                "Could not geocode address for hospital:",
                element.tags.name
              );
              return null;
            }
          } else {
            console.warn(
              "No coordinates or address available for hospital:",
              element.tags.name
            );
            return null;
          }

          const distance = calculateDistance(coords.lat, coords.lon, lat, lon);

          return {
            name: element.tags.name,
            address: addressParts.join(", ") || "Address not available",
            lat,
            lon,
            distance: Math.round(distance),
            isApproximate,
            emergency: element.tags.emergency === "yes",
            phone: element.tags["contact:phone"] || element.tags.phone,
            website: element.tags.website,
            mapUrl: getMapLink(lat, lon, element.tags.name),
          };
        })
    );

    return hospitals
      .filter(Boolean)
      .filter(
        (hospital, index, self) =>
          index === self.findIndex((h) => h.name === hospital.name)
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_HOSPITALS);
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
