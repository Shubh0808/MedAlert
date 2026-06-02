import User from "../models/User.js";
import EmergencyAlert from "../models/EmergencyAlert.js";
import MedicalRecord from "../models/MedicalRecord.js";
import Hospital from "../models/Hospital.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (_req, res) => {
  const [totalUsers, activeEmergencies, totalRecordsUploaded, registeredHospitals] =
    await Promise.all([
      User.countDocuments({ role: "user", isActive: true }),
      EmergencyAlert.countDocuments({ status: "active" }),
      MedicalRecord.countDocuments(),
      Hospital.countDocuments({ isActive: true })
    ]);

  const recentEmergencies = await EmergencyAlert.find()
    .populate("user", "fullName email phone")
    .sort({ createdAt: -1 })
    .limit(8);

  res.status(200).json({
    stats: {
      totalUsers,
      activeEmergencies,
      totalRecordsUploaded,
      registeredHospitals
    },
    recentEmergencies
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
