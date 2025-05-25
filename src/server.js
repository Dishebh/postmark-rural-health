require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createClient } = require("@supabase/supabase-js");
const { parseMedicalReport } = require("./parser");
const { sendAutoReply } = require("./emailService");

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
    const { FromFull, Subject, TextBody } = req.body;

    // Validate required fields
    if (!FromFull.Name || !FromFull.Email || !Subject || !TextBody) {
      console.error("Missing required fields:", {
        FromFull,
        Subject,
        TextBody: !!TextBody,
      });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Parse the email content
    const { symptoms, location } = parseMedicalReport(TextBody);

    // Extract name from email (basic implementation)
    const name = FromFull.Name;
    const email = FromFull.Email;

    // Prepare data for database
    const reportData = {
      email: email,
      subject: Subject,
      symptoms: symptoms,
      location: location,
      created_at: new Date().toISOString(),
      patient_name: name,
    };

    console.log("Saving report data:", reportData);

    // Save to database
    const { data: patient, error: dbError } = await supabase
      .from("medical_reports")
      .insert([reportData])
      .select();

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to save report" });
    }

    // Send auto-reply email
    try {
      const { autoReplyEmail } = await sendAutoReply({
        to: email,
        name,
        symptoms,
        location,
      });

      // save the email to the database
      const { data: autoReplyEmailData, error: dbError } = await supabase
        .from("auto_reply_emails")
        .insert([
          {
            patient_id: patient[0].id,
            subject: autoReplyEmail.Subject,
            body_text: autoReplyEmail.TextBody,
            body_html: autoReplyEmail.TextBody,
          },
        ])
        .select();

      if (dbError) {
        console.error("Database error:", dbError);
      } else {
        console.log("Email saved to database", autoReplyEmailData);
      }

      console.log("Auto-reply sent successfully");
      res.json({
        success: true,
        message: "Report processed and auto-reply sent",
        reportId: patient[0].id,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send auto-reply:", emailError);
      res.status(500).json({ error: "Failed to send auto-reply" });
    }
  } catch (error) {
    console.error("Error processing inbound email:", error);
    res.status(500).json({ error: "Internal server error" });
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
      .select(
        `
        *,
        responder:responders (
          id,
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to flatten the responder object
    const transformedData = data.map((report) => ({
      ...report,
      responder_id: report.responder?.id,
      responder_name: report.responder?.name,
      responder_email: report.responder?.email,
      responder: undefined, // Remove the nested object
    }));

    res.json(transformedData);
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
      .gte("created_at", today.toISOString());

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
      const symptoms = JSON.parse(report.symptoms);
      Array.from(new Set(symptoms)).forEach((symptom) => {
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

// Get all responders
app.get("/api/responders", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("responders")
      .select("id, name, email")
      .order("name");

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching responders:", error);
    res.status(500).json({ error: "Failed to fetch responders" });
  }
});

// Assign responder to a report
app.patch("/api/reports/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { responder_id, assigned_by } = req.body;

  if (!id || !responder_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Start a transaction
    const { data: report, error: reportError } = await supabase
      .from("medical_reports")
      .update({ responder_id })
      .eq("id", id)
      .select()
      .single();

    if (reportError) throw reportError;

    // Record in audit log
    const { error: auditError } = await supabase
      .from("assignment_audit")
      .insert({
        report_id: id,
        responder_id,
        assigned_by,
      });

    if (auditError) throw auditError;

    // Get responder details for response
    const { data: responder, error: responderError } = await supabase
      .from("responders")
      .select("name")
      .eq("id", responder_id)
      .single();

    if (responderError) throw responderError;

    res.json({
      success: true,
      message: `Report assigned to ${responder.name}`,
      report,
    });
  } catch (error) {
    console.error("Error assigning responder:", error);
    res.status(500).json({ error: "Failed to assign responder" });
  }
});

// Add new responder
app.post("/api/responders", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    // Check if email already exists
    const { data: existingResponder, error: checkError } = await supabase
      .from("responders")
      .select("id")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      throw checkError;
    }

    if (existingResponder) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Insert new responder
    const { data, error } = await supabase
      .from("responders")
      .insert([{ name, email }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error("Error adding responder:", error);
    res.status(500).json({ error: "Failed to add responder" });
  }
});

// Update responder
app.patch("/api/responders/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    // Check if email is already used by another responder
    const { data: existingResponder, error: checkError } = await supabase
      .from("responders")
      .select("id")
      .eq("email", email)
      .neq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingResponder) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Update responder
    const { data, error } = await supabase
      .from("responders")
      .update({ name, email })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Responder not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error updating responder:", error);
    res.status(500).json({ error: "Failed to update responder" });
  }
});

// Delete responder
app.delete("/api/responders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if responder is assigned to any reports
    const { data: assignedReports, error: checkError } = await supabase
      .from("medical_reports")
      .select("id")
      .eq("responder_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (assignedReports && assignedReports.length > 0) {
      return res.status(400).json({
        error:
          "Cannot delete responder who is assigned to reports. Please reassign or resolve the reports first.",
      });
    }

    // Delete responder
    const { error } = await supabase.from("responders").delete().eq("id", id);

    if (error) throw error;

    res.json({ message: "Responder deleted successfully" });
  } catch (error) {
    console.error("Error deleting responder:", error);
    res.status(500).json({ error: "Failed to delete responder" });
  }
});

// Get latest auto-reply email for a patient
app.get("/api/reports/:id/auto-reply", async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from("auto_reply_emails")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return res.status(404).json({ error: "No auto-reply email found" });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching auto-reply email:", error);
    res.status(500).json({ error: "Failed to fetch auto-reply email" });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
