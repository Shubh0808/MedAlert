import User from "../models/User.js";
import EmergencyContact from "../models/EmergencyContact.js";
import asyncHandler from "../utils/asyncHandler.js";
import { buildEmergencyCard, getProfileCompleteness } from "../utils/profileCompleteness.js";

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const optionalNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return Number(value);
};

const optionalBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return Boolean(value);
};

export const getProfile = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({
    isPrimary: -1,
    priority: 1,
    createdAt: -1
  });

  res.status(200).json({
    profile: req.user,
    contacts,
    profileCompleteness: getProfileCompleteness(req.user, contacts),
    emergencyCard: buildEmergencyCard(req.user, contacts)
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, medicalProfile = {} } = req.body;

  const user = await User.findById(req.user._id);
  user.fullName = fullName ?? user.fullName;
  user.phone = phone ?? user.phone;
  user.medicalProfile = {
    ...user.medicalProfile?.toObject?.(),
    age: medicalProfile.age ?? user.medicalProfile.age,
    gender: medicalProfile.gender ?? user.medicalProfile.gender,
    bloodGroup: medicalProfile.bloodGroup ?? user.medicalProfile.bloodGroup,
    allergies:
      medicalProfile.allergies === undefined
        ? user.medicalProfile.allergies
        : toArray(medicalProfile.allergies),
    existingDiseases:
      medicalProfile.existingDiseases === undefined
        ? user.medicalProfile.existingDiseases
        : toArray(medicalProfile.existingDiseases),
    currentMedications:
      medicalProfile.currentMedications === undefined
        ? user.medicalProfile.currentMedications
        : toArray(medicalProfile.currentMedications),
    heightCm: optionalNumber(medicalProfile.heightCm, user.medicalProfile.heightCm),
    weightKg: optionalNumber(medicalProfile.weightKg, user.medicalProfile.weightKg),
    insuranceProvider:
      medicalProfile.insuranceProvider ?? user.medicalProfile.insuranceProvider,
    insurancePolicyNumber:
      medicalProfile.insurancePolicyNumber ?? user.medicalProfile.insurancePolicyNumber,
    physicianName: medicalProfile.physicianName ?? user.medicalProfile.physicianName,
    physicianPhone: medicalProfile.physicianPhone ?? user.medicalProfile.physicianPhone,
    emergencyNotes: medicalProfile.emergencyNotes ?? user.medicalProfile.emergencyNotes,
    preferredLanguage: medicalProfile.preferredLanguage ?? user.medicalProfile.preferredLanguage,
    organDonor: optionalBoolean(medicalProfile.organDonor, user.medicalProfile.organDonor),
    consentToShare: optionalBoolean(
      medicalProfile.consentToShare,
      user.medicalProfile.consentToShare
    ),
    address: medicalProfile.address ?? user.medicalProfile.address
  };

  await user.save();
  const contacts = await EmergencyContact.find({ user: req.user._id });

  res.status(200).json({
    profile: user,
    profileCompleteness: getProfileCompleteness(user, contacts),
    emergencyCard: buildEmergencyCard(user, contacts)
  });
});

export const getPublicEmergencyCard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select("-password");

  if (!user || !user.isActive) {
    res.status(404);
    throw new Error("Emergency profile not found.");
  }

  if (user.medicalProfile?.consentToShare === false) {
    res.status(403);
    throw new Error("This user has disabled public emergency card sharing.");
  }

  const contacts = await EmergencyContact.find({ user: user._id }).sort({
    isPrimary: -1,
    priority: 1,
    createdAt: -1
  });

  res.status(200).json({
    emergencyCard: buildEmergencyCard(user, contacts),
    profileCompleteness: getProfileCompleteness(user, contacts)
  });
});
