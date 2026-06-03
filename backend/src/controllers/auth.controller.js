import crypto from "node:crypto";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getProfileCompleteness } from "../utils/profileCompleteness.js";
import { signToken } from "../utils/token.js";

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  medicalProfile: user.medicalProfile,
  profileCompleteness: getProfileCompleteness(user),
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt
});

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error("An account already exists with this email.");
  }

  const user = await User.create({
    fullName,
    email,
    phone,
    password
  });

  const token = signToken(user);

  res.status(201).json({
    token,
    user: sanitizeUser(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user);

  res.status(200).json({
    token,
    user: sanitizeUser(user)
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    user: sanitizeUser(req.user)
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+passwordResetToken +passwordResetExpires"
  );

  if (!user) {
    res.status(200).json({
      message: "If the email exists, a reset link has been generated."
    });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    message: "Password reset token generated.",
    resetToken:
      process.env.NODE_ENV === "production"
        ? undefined
        : resetToken
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select("+passwordResetToken +passwordResetExpires +password");

  if (!user) {
    res.status(400);
    throw new Error("Reset token is invalid or expired.");
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    token: signToken(user),
    user: sanitizeUser(user)
  });
});
