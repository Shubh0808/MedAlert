import EmergencyAlert from "../models/EmergencyAlert.js";
import EmergencyContact from "../models/EmergencyContact.js";
import asyncHandler from "../utils/asyncHandler.js";
import { notifyEmergencyContacts } from "../utils/notifyContacts.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createSOS = asyncHandler(async (req, res) => {
  const {
    latitude,
    longitude,
    notes = "",
    severity = "critical",
    accuracyMeters,
    accuracy
  } = req.body;

  const alert = await EmergencyAlert.create({
    user: req.user._id,
    latitude,
    longitude,
    notes,
    severity,
    accuracyMeters: accuracyMeters ?? accuracy,
    status: "active"
  });

  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({
    isPrimary: -1,
    priority: 1,
    createdAt: -1
  });
  const notifiedContacts = await notifyEmergencyContacts({
    user: req.user,
    contacts,
    alert
  });

  alert.notifiedContacts = notifiedContacts;
  await alert.save();
  await EmergencyContact.updateMany(
    { _id: { $in: contacts.map((contact) => contact._id) } },
    { lastNotifiedAt: new Date() }
  );

  res.status(201).json({
    alert,
    message: "SOS alert created and emergency contacts queued for notification."
  });
});

export const getAlerts = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const { status, severity, q, from, to } = req.query;

  if (status) {
    filter.status = status;
  }

  if (severity) {
    filter.severity = severity;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(String(q)), "i");
    filter.$or = [{ notes: pattern }, { resolutionNotes: pattern }];
  }

  const alerts = await EmergencyAlert.find(filter)
    .populate("user", "fullName email phone medicalProfile.bloodGroup")
    .sort({ createdAt: -1 });

  res.status(200).json({ alerts });
});

export const getActiveAlert = asyncHandler(async (req, res) => {
  const alert = await EmergencyAlert.findOne({
    user: req.user._id,
    status: "active"
  })
    .populate("user", "fullName email phone medicalProfile")
    .sort({ createdAt: -1 });

  res.status(200).json({ alert });
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
      resolvedAt: new Date(),
      resolutionNotes: req.body.resolutionNotes || req.body.notes || ""
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

export const cancelAlert = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    ...(req.user.role === "admin" ? {} : { user: req.user._id })
  };

  const alert = await EmergencyAlert.findOneAndUpdate(
    filter,
    {
      status: "cancelled",
      cancelledAt: new Date(),
      resolutionNotes: req.body.resolutionNotes || req.body.notes || "Cancelled by user"
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!alert) {
    res.status(404);
    throw new Error("Emergency alert not found.");
  }

  res.status(200).json({ alert });
});

export const updateAlertLocation = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    status: "active",
    ...(req.user.role === "admin" ? {} : { user: req.user._id })
  };

  const latitude = Number(req.body.latitude);
  const longitude = Number(req.body.longitude);

  const alert = await EmergencyAlert.findOne(filter);

  if (!alert) {
    res.status(404);
    throw new Error("Active emergency alert not found.");
  }

  alert.latitude = latitude;
  alert.longitude = longitude;
  alert.accuracyMeters = req.body.accuracyMeters ?? req.body.accuracy ?? alert.accuracyMeters;
  alert.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  if (req.body.notes !== undefined) {
    alert.notes = req.body.notes;
  }
  await alert.save();

  res.status(200).json({ alert });
});
