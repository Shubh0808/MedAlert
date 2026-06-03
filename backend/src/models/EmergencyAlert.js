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
    severity: {
      type: String,
      enum: ["critical", "high", "medium"],
      default: "critical",
      index: true
    },
    source: {
      type: String,
      enum: ["web", "qr", "admin", "api"],
      default: "web"
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    accuracyMeters: {
      type: Number,
      min: 0
    },
    googleMapsUrl: {
      type: String,
      trim: true,
      default: ""
    },
    notifiedContacts: [
      {
        contactId: mongoose.Schema.Types.ObjectId,
        name: String,
        phone: String,
        preference: String,
        channel: String,
        status: String,
        message: String,
        queuedAt: Date
      }
    ],
    resolvedAt: Date,
    cancelledAt: Date
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

  if (!this.googleMapsUrl && this.latitude !== undefined && this.longitude !== undefined) {
    this.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`;
  }

  next();
});

const EmergencyAlert = mongoose.model("EmergencyAlert", emergencyAlertSchema);

export default EmergencyAlert;
