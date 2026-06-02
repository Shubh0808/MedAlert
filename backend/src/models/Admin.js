import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    employeeCode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    department: {
      type: String,
      default: "Emergency Operations",
      trim: true
    },
    permissions: {
      type: [String],
      default: ["users:read", "alerts:read", "records:read", "hospitals:write"]
    }
  },
  {
    timestamps: true
  }
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
