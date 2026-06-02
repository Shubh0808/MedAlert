import User from "../models/User.js";
import EmergencyContact from "../models/EmergencyContact.js";
import asyncHandler from "../utils/asyncHandler.js";

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

export const getProfile = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({
    isPrimary: -1,
    createdAt: -1
  });

  res.status(200).json({
    profile: req.user,
    contacts
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
    address: medicalProfile.address ?? user.medicalProfile.address
  };

  await user.save();

  res.status(200).json({
    profile: user
  });
});
