import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import validator from "validator";

const medicalProfileSchema = new mongoose.Schema(
  {
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say", ""],
      default: ""
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: ""
    },
    allergies: {
      type: [String],
      default: []
    },
    existingDiseases: {
      type: [String],
      default: []
    },
    currentMedications: {
      type: [String],
      default: []
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: ""
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Enter a valid email address."]
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: ""
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    medicalProfile: {
      type: medicalProfileSchema,
      default: () => ({})
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    lastLoginAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;