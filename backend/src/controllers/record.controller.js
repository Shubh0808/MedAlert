import MedicalRecord from "../models/MedicalRecord.js";
import asyncHandler from "../utils/asyncHandler.js";
import { storeMedicalFile } from "../utils/fileStorage.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (!tags) {
    return [];
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parseBoolean = (value) => {
  if (typeof value === "string") {
    return value === "true" || value === "on";
  }

  return Boolean(value);
};

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
    tags: parseTags(req.body.tags),
    notes: req.body.notes || "",
    documentDate: req.body.documentDate || undefined,
    isFavorite: parseBoolean(req.body.isFavorite)
  });

  res.status(201).json({ record });
});

export const getRecords = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const { category, favorite, tag, q } = req.query;

  if (category) {
    filter.category = category;
  }

  if (favorite !== undefined && favorite !== "") {
    filter.isFavorite = favorite === "true";
  }

  if (tag) {
    filter.tags = tag;
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(String(q)), "i");
    filter.$or = [
      { title: pattern },
      { originalName: pattern },
      { tags: pattern },
      { notes: pattern }
    ];
  }

  const records = await MedicalRecord.find(filter)
    .populate("user", "fullName email")
    .sort({ createdAt: -1 });

  res.status(200).json({ records });
});

export const getRecordSummary = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const records = await MedicalRecord.find(filter).select("category size isFavorite tags createdAt");
  const byCategory = records.reduce((summary, record) => {
    summary[record.category] = (summary[record.category] || 0) + 1;
    return summary;
  }, {});

  const tags = [...new Set(records.flatMap((record) => record.tags || []))].sort();

  res.status(200).json({
    totalRecords: records.length,
    favoriteRecords: records.filter((record) => record.isFavorite).length,
    totalSize: records.reduce((total, record) => total + (record.size || 0), 0),
    byCategory,
    tags
  });
});

export const updateRecord = asyncHandler(async (req, res) => {
  const filter = {
    _id: req.params.id,
    ...(req.user.role === "admin" ? {} : { user: req.user._id })
  };

  const update = {
    title: req.body.title,
    category: req.body.category,
    notes: req.body.notes || "",
    documentDate: req.body.documentDate || undefined,
    isFavorite: parseBoolean(req.body.isFavorite),
    tags: parseTags(req.body.tags)
  };

  const record = await MedicalRecord.findOneAndUpdate(filter, update, {
    new: true,
    runValidators: true
  });

  if (!record) {
    res.status(404);
    throw new Error("Medical record not found.");
  }

  res.status(200).json({ record });
});

export const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findOneAndDelete({
    _id: req.params.id,
    ...(req.user.role === "admin" ? {} : { user: req.user._id })
  });

  if (!record) {
    res.status(404);
    throw new Error("Medical record not found.");
  }

  res.status(200).json({ message: "Medical record deleted." });
});
