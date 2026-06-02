import MedicalRecord from "../models/MedicalRecord.js";
import asyncHandler from "../utils/asyncHandler.js";
import { storeMedicalFile } from "../utils/fileStorage.js";

export const uploadRecord = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Medical record file is required.");
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const storedFile = await storeMedicalFile({
    file: req.file,
    baseUrl
  });

  const record = await MedicalRecord.create({
    user: req.user._id,
    title: req.body.title,
    category: req.body.category || "other",
    fileUrl: storedFile.fileUrl,
    cloudinaryPublicId: storedFile.cloudinaryPublicId,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    tags: req.body.tags
      ? String(req.body.tags)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []
  });

  res.status(201).json({ record });
});

export const getRecords = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const records = await MedicalRecord.find(filter)
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json({ records });
});

export const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!record) {
    res.status(404);
    throw new Error("Medical record not found.");
  }

  res.status(200).json({ message: "Medical record deleted." });
});
