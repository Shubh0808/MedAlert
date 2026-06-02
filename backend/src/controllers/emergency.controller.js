import EmergencyAlert from "../models/EmergencyAlert.js";
import EmergencyContact from "../models/EmergencyContact.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notifyEmergencyContacts } from "../utils/notifyContacts.js";

export const createSOS = asyncHandler(async (req, res) => {
  const { latitude, longitude, notes = "" } = req.body;

  const alert = await EmergencyAlert.create({
    user: req.user._id,
    latitude,
    longitude,
    notes,
    status: "active"
  });

  const contacts = await EmergencyContact.find({ user: req.user._id });
  const notifiedContacts = await notifyEmergencyContacts({
    user: req.user,
    contacts,
    alert
  });

  alert.notifiedContacts = notifiedContacts;
  await alert.save();

  res.status(201).json({
    alert,
    message: "SOS alert created and emergency contacts queued for notification."
  });
});

export const getAlerts = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const alerts = await EmergencyAlert.find(filter)
    .populate("user", "fullName email phone medicalProfile.bloodGroup")
    .sort({ createdAt: -1 });

  res.status(200).json({ alerts });
});

export const getAlertById = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    ...(req.user.role === "admin" ? {} : { user: req.user._id })
  };

  const alert = await EmergencyAlert.findOne(filter).populate(
    "user",
    "fullName email phone medicalProfile"
  );

  if (!alert) {
    res.status(404);
    throw new Error("Emergency alert not found.");
  }

  res.status(200).json({ alert });
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    ...(req.user.role === "admin" ? {} : { user: req.user._id })
  };

  const alert = await EmergencyAlert.findOneAndUpdate(
    filter,
    {
      status: "resolved",
      resolvedAt: new Date()
    },
    {
      new: true
    }
  );

  if (!alert) {
    res.status(404);
    throw new Error("Emergency alert not found.");
  }

  res.status(200).json({ alert });
});
