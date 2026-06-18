import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required."],
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ""
    },
    emergencyPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ""
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
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
    services: {
      type: [String],
      default: ["Emergency", "ICU", "Ambulance"]
    },
    has24x7Emergency: {
      type: Boolean,
      default: true,
      index: true
    },
    ambulanceAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    capacityStatus: {
      type: String,
      enum: ["available", "limited", "full", "unknown"],
      default: "unknown",
      index: true
    },
    website: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    lastVerifiedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

hospitalSchema.index({ location: "2dsphere" });

hospitalSchema.pre("validate", function setGeoPoint() {
  this.location = {
    type: "Point",
    coordinates: [this.longitude, this.latitude]
  };
});

const Hospital = mongoose.model("Hospital", hospitalSchema);

export default Hospital;
