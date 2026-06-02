import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "Contact name is required."],
      trim: true,
      maxlength: 80
    },
    relation: {
      type: String,
      required: [true, "Relation is required."],
      trim: true,
      maxlength: 50
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      maxlength: 20
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const EmergencyContact = mongoose.model("EmergencyContact", emergencyContactSchema);

export default EmergencyContact;
