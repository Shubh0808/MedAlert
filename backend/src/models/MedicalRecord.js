import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Record title is required."],
      trim: true,
      maxlength: 120
    },
    category: {
      type: String,
      enum: ["prescription", "lab_report", "insurance", "imaging", "other"],
      default: "other"
    },
    fileUrl: {
      type: String,
      required: true
    },
    cloudinaryPublicId: String,
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
