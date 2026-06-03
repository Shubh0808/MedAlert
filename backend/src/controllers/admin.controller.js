import User from "../models/User.js";
import EmergencyAlert from "../models/EmergencyAlert.js";
import MedicalRecord from "../models/MedicalRecord.js";
import Hospital from "../models/Hospital.js";
import asyncHandler from "../utils/asyncHandler.js";

const parseBoolean = (value) => {
  if (typeof value === "string") {
    return value === "true";
  }

  return Boolean(value);
};

export const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeEmergencies,
    resolvedEmergencies,
    cancelledEmergencies,
    totalRecordsUploaded,
    registeredHospitals,
    inactiveUsers
  ] =
    await Promise.all([
      User.countDocuments({ role: "user", isActive: true }),
      EmergencyAlert.countDocuments({ status: "active" }),
      EmergencyAlert.countDocuments({ status: "resolved" }),
      EmergencyAlert.countDocuments({ status: "cancelled" }),
      MedicalRecord.countDocuments(),
      Hospital.countDocuments({ isActive: true }),
      User.countDocuments({ role: "user", isActive: false })
    ]);

  const [recentEmergencies, recentUsers, alertsBySeverity, recordsByCategory] =
    await Promise.all([
      EmergencyAlert.find()
        .populate("user", "fullName email phone")
        .sort({ createdAt: -1 })
        .limit(8),
      User.find({ role: "user" }).select("fullName email createdAt isActive").sort({ createdAt: -1 }).limit(5),
      EmergencyAlert.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
      MedicalRecord.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }])
    ]);

  res.status(200).json({
    stats: {
      totalUsers,
      activeEmergencies,
      resolvedEmergencies,
      cancelledEmergencies,
      totalRecordsUploaded,
      registeredHospitals,
      inactiveUsers
    },
    recentEmergencies,
    recentUsers,
    analytics: {
      alertsBySeverity: Object.fromEntries(
        alertsBySeverity.map((item) => [item._id || "unknown", item.count])
      ),
      recordsByCategory: Object.fromEntries(
        recordsByCategory.map((item) => [item._id || "other", item.count])
      )
    }
  });
});

export const getUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.status(200).json({ users });
});

export const getAdminAlerts = asyncHandler(async (_req, res) => {
  const alerts = await EmergencyAlert.find()
    .populate("user", "fullName email phone medicalProfile")
    .sort({ createdAt: -1 });
  res.status(200).json({ alerts });
});

export const getAdminRecords = asyncHandler(async (_req, res) => {
  const records = await MedicalRecord.find()
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });
  res.status(200).json({ records });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: parseBoolean(req.body.isActive) },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  res.status(200).json({ user });
});

export const adminResolveAlert = asyncHandler(async (req, res) => {
  const alert = await EmergencyAlert.findByIdAndUpdate(
    req.params.id,
    {
      status: "resolved",
      resolvedAt: new Date(),
      resolutionNotes: req.body.resolutionNotes || req.body.notes || "Resolved by admin"
    },
    { new: true, runValidators: true }
  );

  if (!alert) {
    res.status(404);
    throw new Error("Emergency alert not found.");
  }

  res.status(200).json({ alert });
});

export const adminCancelAlert = asyncHandler(async (req, res) => {
  const alert = await EmergencyAlert.findByIdAndUpdate(
    req.params.id,
    {
      status: "cancelled",
      cancelledAt: new Date(),
      resolutionNotes: req.body.resolutionNotes || req.body.notes || "Cancelled by admin"
    },
    { new: true, runValidators: true }
  );

  if (!alert) {
    res.status(404);
    throw new Error("Emergency alert not found.");
  }

  res.status(200).json({ alert });
});
