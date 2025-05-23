require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createClient } = require("@supabase/supabase-js");
const { parseMedicalReport } = require("./parser");

// Initialize Express app
const app = express();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Simple keyword-based symptom extraction
const extractSymptoms = (text) => {
  const commonSymptoms = [
    "fever",
    "cough",
    "headache",
    "chest pain",
    "shortness of breath",
    "fatigue",
    "nausea",
    "vomiting",
    "diarrhea",
    "dizziness",
    "joint pain",
    "muscle pain",
    "sore throat",
    "runny nose",
  ];

  const foundSymptoms = commonSymptoms.filter((symptom) =>
    text.toLowerCase().includes(symptom.toLowerCase())
  );

  return foundSymptoms;
};

// Extract location using simple keyword matching
const extractLocation = (text) => {
  const locationKeywords = ["village", "town", "city", "near", "district"];
  const words = text.toLowerCase().split(" ");

  for (let i = 0; i < words.length; i++) {
    if (locationKeywords.includes(words[i]) && i + 1 < words.length) {
      // Return the next word as potential location
      return words[i + 1].replace(/[.,!?]/g, "");
    }
  }
  return null;
};

// Extract patient name (very basic implementation)
const extractPatientName = (text) => {
  // This is a very basic implementation
  // In a real system, you'd want to use more sophisticated NLP
  const nameMatch = text.match(/my name is ([A-Za-z\s]+)/i);
  return nameMatch ? nameMatch[1].trim() : null;
};

// Inbound email webhook endpoint
app.post("/inbound-email", async (req, res) => {
  try {
    const { From: email, Subject: subject, TextBody: textBody } = req.body;

    if (!email || !subject || !textBody) {
      return res.status(400).json({
        error: "Missing required fields: email, subject, or text body",
      });
    }

    // Parse the email text using our NLP parser
    console.log("Processing new medical report from:", email);
    const { symptoms, location } = parseMedicalReport(textBody);

    // Prepare data for database
    const reportData = {
      email,
      subject,
      symptoms,
      location,
      received_at: new Date().toISOString(),
    };

    // Log the data being saved
    // Insert into Supabase
    const { data, error } = await supabase
      .from("medical_reports")
      .insert([reportData]);

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Failed to save medical report",
        details: error.message,
      });
    }

    // Success response
    return res.status(200).json({
      message: "Medical report saved successfully",
      data: reportData,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

// Get all reports
app.get("/api/reports", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("medical_reports")
      .select("*")
      .order("received_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Get dashboard statistics
app.get("/api/stats", async (req, res) => {
  try {
    // Get total reports
    const { count: totalReports, error: countError } = await supabase
      .from("medical_reports")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // Get reports from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: reportsToday, error: todayError } = await supabase
      .from("medical_reports")
      .select("*", { count: "exact", head: true })
      .gte("received_at", today.toISOString());

    if (todayError) throw todayError;

    // Get unique locations
    const { data: locations, error: locationError } = await supabase
      .from("medical_reports")
      .select("location")
      .not("location", "is", null);

    if (locationError) throw locationError;
    const uniqueLocations = new Set(locations.map((l) => l.location)).size;

    // Get most common symptom
    const { data: allReports, error: reportsError } = await supabase
      .from("medical_reports")
      .select("symptoms");

    if (reportsError) throw reportsError;

    const symptomCounts = {};
    allReports.forEach((report) => {
      report.symptoms.forEach((symptom) => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    });

    const commonSymptom =
      Object.entries(symptomCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "None";

    res.json({
      totalReports,
      reportsToday,
      uniqueLocations,
      commonSymptom,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
