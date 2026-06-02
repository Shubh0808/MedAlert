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

hospitalSchema.pre("validate", function setGeoPoint(next) {
  this.location = {
    type: "Point",
    coordinates: [this.longitude, this.latitude]
  };
  next();
});

const Hospital = mongoose.model("Hospital", hospitalSchema);

export default Hospital;
