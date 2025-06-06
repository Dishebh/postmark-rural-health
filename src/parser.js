const nlp = require("compromise");

// Common medical symptoms to look for
const COMMON_SYMPTOMS = [
  "fever",
  "cough",
  "pain",
  "vomiting",
  "chills",
  "headache",
  "dizziness",
  "fatigue",
  "nausea",
  "diarrhea",
  "shortness of breath",
  "chest pain",
  "joint pain",
  "muscle pain",
  "sore throat",
  "runny nose",
];

// Location patterns to match
const LOCATION_PATTERNS = [
  // Full address pattern (street, city, state zip)
  /(?:at|from|in|near|located at|based at)\s+(\d+\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Place|Pl|Terrace|Ter)[,\s]+[A-Za-z\s]+(?:,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)?)/i,
  // City, State ZIP pattern
  /(?:in|from|near|at|located in|based in)\s+([A-Za-z\s]+(?:,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?))/i,
  // Simple location pattern (original)
  /(?:in|from|near|at)\s+([A-Za-z\s]+(?:village|town|city|district|state|province)?)/i,
  /(?:located in|based in)\s+([A-Za-z\s]+(?:village|town|city|district|state|province)?)/i,
];

/**
 * Extract symptoms from text using compromise and keyword matching
 * @param {string} text - The text to analyze
 * @returns {string[]} Array of found symptoms
 */
const extractSymptoms = (text) => {
  // Use compromise to find medical terms
  const doc = nlp(text);

  // Get all terms and filter for potential medical terms
  // Using match() instead of terms() for better medical term detection
  const medicalTerms = doc
    .match("#Noun+") // Match nouns
    .concat(doc.match("#Adjective+")) // Match adjectives
    .out("array");

  // Combine compromise results with keyword matching
  const foundSymptoms = new Set();

  // Check for exact matches of common symptoms
  COMMON_SYMPTOMS.forEach((symptom) => {
    if (text.toLowerCase().includes(symptom.toLowerCase())) {
      foundSymptoms.add(symptom);
    }
  });

  // Check medical terms from compromise
  medicalTerms.forEach((term) => {
    const lowerTerm = term.toLowerCase();
    COMMON_SYMPTOMS.forEach((symptom) => {
      if (lowerTerm.includes(symptom) || symptom.includes(lowerTerm)) {
        foundSymptoms.add(symptom);
      }
    });
  });

  return Array.from(foundSymptoms);
};

/**
 * Extract location from text using regex patterns and compromise
 * @param {string} text - The text to analyze
 * @returns {string|null} Extracted location or null if not found
 */
const extractLocation = (text) => {
  // Try compromise's built-in place detection first
  const doc = nlp(text);
  const places = doc.places().out("array");

  // If compromise found a place, check if it's part of a larger address
  if (places.length > 0) {
    const place = places[0];
    // Look for address patterns around the found place
    for (const pattern of LOCATION_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].includes(place)) {
        // If the place is part of a larger address, return the full address
        return match[1].trim().replace(/[.,!?]$/, "");
      }
    }
    // If no larger address found, return just the place
    return place;
  }

  // Fallback to regex patterns
  for (const pattern of LOCATION_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up the location string
      const location = match[1].trim().replace(/[.,!?]$/, "");
      // Only return if we found something substantial
      if (location.length > 2) {
        return location;
      }
    }
  }

  return null;
};

/**
 * Parse medical report from email text
 * @param {string} text - The email text body
 * @returns {Object} Parsed data including symptoms and location
 */
const parseMedicalReport = (text) => {
  // Normalize text: remove extra spaces, convert to lowercase for matching
  const normalizedText = text.replace(/\s+/g, " ").trim();

  // Extract information
  const symptoms = extractSymptoms(normalizedText);
  const location = extractLocation(normalizedText);

  // Log parsing results
  console.log("Parsed Medical Report:");
  console.log("-------------------");
  console.log("Symptoms found:", symptoms);
  console.log("Location found:", location);
  console.log("-------------------");

  return {
    symptoms,
    location,
  };
};

module.exports = {
  parseMedicalReport,
  extractSymptoms,
  extractLocation,
};
