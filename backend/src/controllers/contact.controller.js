import EmergencyContact from "../models/EmergencyContact.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getContacts = asyncHandler(async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({
    isPrimary: -1,
    createdAt: -1
  });

  res.status(200).json({ contacts });
});

export const createContact = asyncHandler(async (req, res) => {
  const contact = await EmergencyContact.create({
    user: req.user._id,
    name: req.body.name,
    relation: req.body.relation,
    phone: req.body.phone,
    isPrimary: Boolean(req.body.isPrimary)
  });

  res.status(201).json({ contact });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await EmergencyContact.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id
    },
    {
      name: req.body.name,
      relation: req.body.relation,
      phone: req.body.phone,
      isPrimary: Boolean(req.body.isPrimary)
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
