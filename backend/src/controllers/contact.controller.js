import EmergencyContact from "../models/EmergencyContact.js";
import asyncHandler from "../utils/asyncHandler.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getContacts = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  const search = String(req.query.q || "").trim();

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { name: pattern },
      { relation: pattern },
      { phone: pattern },
      { email: pattern }
    ];
  }

  const contacts = await EmergencyContact.find(filter).sort({
    isPrimary: -1,
    priority: 1,
    createdAt: -1
  });

  res.status(200).json({ contacts });
});

export const createContact = asyncHandler(async (req, res) => {
  const isPrimary = Boolean(req.body.isPrimary);

  if (isPrimary) {
    await EmergencyContact.updateMany(
      { user: req.user._id, isPrimary: true },
      { isPrimary: false }
    );
  }

  const contact = await EmergencyContact.create({
    user: req.user._id,
    name: req.body.name,
    relation: req.body.relation,
    phone: req.body.phone,
    email: req.body.email || "",
    priority: Number(req.body.priority || 3),
    notificationPreference: req.body.notificationPreference || "sms",
    notes: req.body.notes || "",
    isPrimary
  });

  res.status(201).json({ contact });
});

export const updateContact = asyncHandler(async (req, res) => {
  const isPrimary = Boolean(req.body.isPrimary);

  if (isPrimary) {
    await EmergencyContact.updateMany(
      {
        user: req.user._id,
        _id: { $ne: req.params.id },
        isPrimary: true
      },
      { isPrimary: false }
    );
  }

  const contact = await EmergencyContact.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id
    },
    {
      name: req.body.name,
      relation: req.body.relation,
      phone: req.body.phone,
      email: req.body.email || "",
      priority: Number(req.body.priority || 3),
      notificationPreference: req.body.notificationPreference || "sms",
      notes: req.body.notes || "",
      isPrimary
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!contact) {
    res.status(404);
    throw new Error("Emergency contact not found.");
  }

  res.status(200).json({ contact });
});

export const deleteContact = asyncHandler(async (req, res) => {
  const contact = await EmergencyContact.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!contact) {
    res.status(404);
    throw new Error("Emergency contact not found.");
  }

  res.status(200).json({ message: "Contact deleted." });
});
