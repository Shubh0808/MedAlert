import mongoose from "mongoose";

const emergencyAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    status: {
      type: String,
      enum: ["active", "resolved", "cancelled"],
      default: "active",
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    notifiedContacts: [
      {
        contactId: mongoose.Schema.Types.ObjectId,
        name: String,
        phone: String,
        channel: String,
        status: String,
        message: String
      }
    ],
    resolvedAt: Date
  },
  {
    timestamps: true
  }
);

emergencyAlertSchema.index({ location: "2dsphere" });

emergencyAlertSchema.pre("validate", function setGeoPoint(next) {
  this.location = {
    type: "Point",
    coordinates: [this.longitude, this.latitude]
  };
  next();
});

const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);

export default EmergencyAlert;
