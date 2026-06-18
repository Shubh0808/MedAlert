import axios from "axios";
import { findHospitalsNear } from "./hospitalLookup.service.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";

const splitProfileList = (items = []) => (Array.isArray(items) ? items.filter(Boolean) : []);

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

const unique = (items) => [...new Set(items.filter(Boolean))];

const medicineSafety = [
  "Use medicines only as directed on the label or by a clinician.",
  "Avoid a medicine if you are allergic to it, pregnant, have liver/kidney disease, or it conflicts with current medicines.",
  "For children, older adults, pregnancy, chronic disease, or worsening symptoms, speak with a doctor or pharmacist first."
];

const baselineResponse = ({ symptoms, profile, hospitals }) => {
  const text = symptoms.toLowerCase();
  const allergies = splitProfileList(profile?.medicalProfile?.allergies).join(", ") || "not recorded";
  const conditions = splitProfileList(profile?.medicalProfile?.existingDiseases).join(", ") || "not recorded";
  const nearestHospital = hospitals[0];

  const redFlags = [];
  if (hasAny(text, ["chest pain", "heart attack", "pressure in chest"])) {
    redFlags.push("Chest pain or pressure can be an emergency.");
  }
  if (hasAny(text, ["breath", "shortness", "wheezing", "can't breathe", "cannot breathe"])) {
    redFlags.push("Breathing difficulty needs urgent assessment.");
  }
  if (hasAny(text, ["stroke", "face droop", "slurred", "weakness one side", "paralysis"])) {
    redFlags.push("Stroke-like symptoms need emergency care immediately.");
  }
  if (hasAny(text, ["unconscious", "fainting", "seizure", "convulsion"])) {
    redFlags.push("Loss of consciousness or seizure needs emergency help.");
  }
  if (hasAny(text, ["bleeding", "blood loss", "deep cut"])) {
    redFlags.push("Heavy bleeding needs pressure and urgent medical care.");
  }
  if (hasAny(text, ["poison", "overdose", "suicide", "self harm"])) {
    redFlags.push("Poisoning, overdose, or self-harm risk is an emergency.");
  }
  if (hasAny(text, ["high fever", "103", "104", "40 c", "40c", "stiff neck"])) {
    redFlags.push("Very high fever, stiff neck, confusion, or dehydration needs urgent care.");
  }

  let urgency = redFlags.length ? "emergency" : "self-care";
  if (!redFlags.length && hasAny(text, ["fever", "vomit", "diarrhea", "severe pain", "infection", "dizzy"])) {
    urgency = "urgent";
  }

  const doctorType = (() => {
    if (urgency === "emergency") return "Emergency physician";
    if (hasAny(text, ["fever", "sore throat", "cold", "flu", "body ache"])) return "General physician";
    if (hasAny(text, ["chest", "heart", "palpitation"])) return "Cardiologist";
    if (hasAny(text, ["breath", "cough", "asthma", "wheezing"])) return "Pulmonologist or general physician";
    if (hasAny(text, ["stomach", "abdomen", "vomit", "diarrhea", "gastric"])) return "Gastroenterologist or general physician";
    if (hasAny(text, ["headache", "migraine", "dizzy", "numb", "weakness"])) return "Neurologist or general physician";
    if (hasAny(text, ["skin", "rash", "itch", "allergy"])) return "Dermatologist or general physician";
    if (hasAny(text, ["bone", "joint", "fracture", "sprain", "injury"])) return "Orthopedic doctor";
    return "General physician";
  })();

  const medicines = ["Do not start prescription medicines without a doctor."];
  if (hasAny(text, ["fever", "pain", "headache", "body ache"])) {
    medicines.push("Paracetamol/acetaminophen may help fever or mild pain if safe for you.");
  }
  if (hasAny(text, ["diarrhea", "vomit", "dehydration"])) {
    medicines.push("Oral rehydration solution can help prevent dehydration.");
  }
  if (hasAny(text, ["allergy", "sneezing", "itch", "rash"])) {
    medicines.push("A non-drowsy antihistamine may help mild allergy symptoms if safe for you.");
  }
  if (hasAny(text, ["acidity", "heartburn", "gastric"])) {
    medicines.push("An antacid may help mild acidity symptoms if safe for you.");
  }

  const hospitalRecommendation =
    urgency === "emergency" || urgency === "urgent"
      ? nearestHospital
        ? `Go to ${nearestHospital.name}, about ${nearestHospital.distanceKm} km away. Call ${nearestHospital.emergencyPhone || nearestHospital.phone || "the hospital"} before arrival if possible.`
        : "Go to the nearest emergency department or call local emergency services."
      : nearestHospital
        ? `${nearestHospital.name} is the nearest listed facility if symptoms worsen.`
        : "A hospital visit is not clearly required from the entered symptoms unless they worsen.";

  return {
    urgency,
    summary: `Based on the symptoms entered, profile allergies (${allergies}), and conditions (${conditions}), this looks like ${urgency} priority.`,
    immediateSteps:
      urgency === "emergency"
        ? [
            "Trigger SOS or call local emergency services now.",
            "Do not drive yourself if symptoms are severe.",
            "Keep medical records and emergency contacts ready."
          ]
        : [
            "Rest and monitor symptoms closely.",
            "Drink fluids unless a doctor has restricted fluids.",
            "Seek medical care if symptoms worsen or do not improve."
          ],
    medicines: unique([...medicines, ...medicineSafety]),
    doctorType,
    hospitalRecommendation,
    redFlags: redFlags.length
      ? redFlags
      : [
          "Chest pain, breathing difficulty, fainting, stroke symptoms, severe bleeding, confusion, or rapidly worsening symptoms need emergency care."
        ],
    followUpQuestions: [
      "How long have the symptoms been present?",
      "What is the patient's age and temperature, if fever is present?",
      "Any allergies, pregnancy, chronic disease, or current medicines?"
    ],
    disclaimer: "This is decision support, not a diagnosis. A licensed clinician should confirm medicines and treatment."
  };
};

const promptForAssistant = ({ symptoms, profile, hospitals, fallback }) => `
You are MedAlert's emergency decision-support assistant. Return only valid JSON.
Do not diagnose. Do not prescribe antibiotics, controlled drugs, injections, or exact doses.
You may mention common OTC options only with safety warnings.
Escalate chest pain, breathing difficulty, stroke symptoms, unconsciousness, seizure, severe bleeding, poisoning, self-harm, severe dehydration, or very high fever to emergency care.

User symptoms:
${symptoms}

Known profile:
${JSON.stringify({
  age: profile?.medicalProfile?.age,
  gender: profile?.medicalProfile?.gender,
  bloodGroup: profile?.medicalProfile?.bloodGroup,
  allergies: profile?.medicalProfile?.allergies || [],
  existingDiseases: profile?.medicalProfile?.existingDiseases || [],
  currentMedications: profile?.medicalProfile?.currentMedications || [],
  emergencyNotes: profile?.medicalProfile?.emergencyNotes || ""
})}

Nearby hospitals:
${JSON.stringify(
  hospitals.slice(0, 5).map((hospital) => ({
    name: hospital.name,
    distanceKm: hospital.distanceKm,
    phone: hospital.emergencyPhone || hospital.phone,
    services: hospital.services,
    source: hospital.source
  }))
)}

Use this JSON shape exactly:
${JSON.stringify(fallback)}
`;

const parseJson = (value) => {
  const cleaned = String(value || "")
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
};

const normalizeAssistant = (candidate, fallback) => ({
  urgency: candidate.urgency || fallback.urgency,
  summary: candidate.summary || fallback.summary,
  immediateSteps: Array.isArray(candidate.immediateSteps)
    ? candidate.immediateSteps
    : fallback.immediateSteps,
  medicines: Array.isArray(candidate.medicines) ? candidate.medicines : fallback.medicines,
  doctorType: candidate.doctorType || fallback.doctorType,
  hospitalRecommendation: candidate.hospitalRecommendation || fallback.hospitalRecommendation,
  redFlags: Array.isArray(candidate.redFlags) ? candidate.redFlags : fallback.redFlags,
  followUpQuestions: Array.isArray(candidate.followUpQuestions)
    ? candidate.followUpQuestions
    : fallback.followUpQuestions,
  disclaimer: candidate.disclaimer || fallback.disclaimer
});

export const getHealthAssistantResponse = async ({
  symptoms,
  profile,
  latitude,
  longitude
}) => {
  const hospitals =
    latitude && longitude
      ? await findHospitalsNear({
          latitude,
          longitude,
          radiusKm: 50,
          filters: {},
          includeExternal: true
        })
      : [];
  const fallback = baselineResponse({ symptoms, profile, hospitals });

  try {
    const { data } = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: promptForAssistant({ symptoms, profile, hospitals, fallback }),
        stream: false,
        format: "json",
        options: {
          temperature: 0.2,
          num_predict: 700
        }
      },
      { timeout: 70000 }
    );

    return {
      assistant: normalizeAssistant(parseJson(data.response), fallback),
      source: "ollama",
      model: OLLAMA_MODEL,
      hospitals: hospitals.slice(0, 5)
    };
  } catch (_error) {
    return {
      assistant: fallback,
      source: "clinical-rules",
      model: null,
      hospitals: hospitals.slice(0, 5)
    };
  }
};
