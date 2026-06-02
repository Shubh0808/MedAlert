import { Router } from "express";
import { body, param } from "express-validator";
import {
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.post(
  "/register",
  [
    body("fullName").trim().isLength({ min: 2 }).withMessage("Full name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long."),
    body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 })
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required."),
    body("password").notEmpty().withMessage("Password is required.")
  ],
  validate,
  login
);

router.get("/me", protect, getMe);

router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required.")],
  validate,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  [
    param("token").isLength({ min: 32 }).withMessage("Reset token is invalid."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
  ],
  validate,
  resetPassword
);

export default router;
