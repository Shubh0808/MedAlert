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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: ""
    },
    priority: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    notificationPreference: {
      type: String,
      enum: ["sms", "call", "whatsapp", "all"],
      default: "sms"
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    },
    lastNotifiedAt: Date,
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
