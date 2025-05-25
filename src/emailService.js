const { ServerClient } = require("postmark");
const { getNearbyHospitals, formatHospitalList } = require("./locationService");

// Initialize Postmark client
const postmarkClient = new ServerClient(process.env.POSTMARK_SERVER_API_TOKEN);

// Health tips mapping for common symptoms
const HEALTH_TIPS = {
  fever: [
    "Rest and stay hydrated",
    "Take over-the-counter fever reducers like acetaminophen",
    "Use cool compresses to reduce body temperature",
    "Monitor temperature regularly",
  ],
  headache: [
    "Rest in a quiet, dark room",
    "Stay hydrated",
    "Take over-the-counter pain relievers",
    "Apply cold or warm compress to the affected area",
  ],
  cough: [
    "Stay hydrated with warm liquids",
    "Use a humidifier",
    "Try honey for natural relief",
    "Avoid irritants like smoke",
  ],
  "chest pain": [
    "Seek immediate medical attention if severe",
    "Rest and avoid strenuous activity",
    "Monitor for other symptoms like shortness of breath",
    "Keep a record of when pain occurs",
  ],
  vomiting: [
    "Stay hydrated with small sips of water",
    "Avoid solid foods until vomiting stops",
    "Rest and avoid sudden movements",
    "Seek medical help if vomiting persists",
  ],
  diarrhea: [
    "Stay hydrated with oral rehydration solutions",
    "Eat bland foods like bananas and rice",
    "Avoid dairy and fatty foods",
    "Rest and monitor for dehydration",
  ],
  "shortness of breath": [
    "Sit upright and try to relax",
    "Use prescribed inhalers if available",
    "Seek immediate medical attention if severe",
    "Monitor for other symptoms",
  ],
  fatigue: [
    "Get adequate rest",
    "Stay hydrated",
    "Eat nutritious meals",
    "Avoid strenuous activities",
  ],
};

/**
 * Get health tips based on reported symptoms
 * @param {string[]} symptoms - Array of reported symptoms
 * @returns {string[]} Array of relevant health tips
 */
const getHealthTips = (symptoms) => {
  const tips = new Set();

  symptoms.forEach((symptom) => {
    const symptomTips = HEALTH_TIPS[symptom.toLowerCase()] || [];
    symptomTips.forEach((tip) => tips.add(tip));
  });

  // Add general advice if no specific tips found
  if (tips.size === 0) {
    tips.add(
      "Please monitor your symptoms and seek medical attention if they worsen."
    );
    tips.add("Stay hydrated and get adequate rest.");
  }

  return Array.from(tips);
};

/**
 * Generate email content for auto-reply
 * @param {Object} params - Parameters for email generation
 * @param {string} params.name - Patient's name
 * @param {string[]} params.symptoms - Reported symptoms
 * @param {string} params.location - Patient's location
 * @returns {Promise<Object>} Email content with subject and body
 */
const generateEmailContent = async ({ name, symptoms, location }) => {
  const tips = getHealthTips(symptoms);
  const locationInfo = location ? ` in ${location}` : "";

  // Get nearby hospitals if location is available
  let hospitalsInfo = "";
  if (location) {
    try {
      const hospitals = await getNearbyHospitals(location);
      hospitalsInfo = `\n\n\nNearby Medical Facilities:\n${formatHospitalList(
        hospitals
      )}\n`;
    } catch (error) {
      console.error("Error getting nearby hospitals:", error);
      hospitalsInfo =
        "\nUnable to fetch nearby medical facilities at this time.\n";
    }
  }

  const subject = "We received your message – here's some help";

  const body = `
Dear ${name || "Patient"},

Thank you for reaching out to our medical support system${locationInfo}. We have received your report and would like to provide some immediate guidance.

Reported Symptoms:
${symptoms.map((s) => `- ${s}`).join("\n")}

Immediate Health Tips:
${tips.map((tip) => `- ${tip}`).join("\n")}${hospitalsInfo}

Important Notes:
- These are general guidelines and not a substitute for professional medical advice
- If your symptoms worsen or you experience severe symptoms, please seek immediate medical attention
- Our medical team will review your case and may follow up with additional guidance
- The listed medical facilities are based on OpenStreetMap data and may not be complete

Stay safe and take care,
Your Rural Health Support Team
  `.trim();

  return { subject, body };
};

/**
 * Send auto-reply email to the patient
 * @param {Object} params - Parameters for sending email
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - Patient's name
 * @param {string[]} params.symptoms - Reported symptoms
 * @param {string} params.location - Patient's location
 * @returns {Promise} Postmark send email promise
 */
const sendAutoReply = async ({ to, name, symptoms, location }) => {
  try {
    const { subject, body } = await generateEmailContent({
      name,
      symptoms,
      location,
    });

    const email = {
      From: process.env.POSTMARK_FROM_EMAIL || "noreply@yourdomain.com",
      To: to,
      Subject: subject,
      TextBody: body,
      MessageStream: "outbound",
    };

    console.log("Sending auto-reply to:", to);
    const response = await postmarkClient.sendEmail(email);
    console.log("Auto-reply sent successfully:", response.MessageID);

    return response;
  } catch (error) {
    console.error("Error sending auto-reply:", error);
    throw error;
  }
};

// generateEmailContent({
//   name: "ran",
//   symptoms: ["fever"],
//   location: "30 Memorial Drive Avon, MA 02322",
// });

module.exports = {
  sendAutoReply,
  getHealthTips,
  generateEmailContent,
};
