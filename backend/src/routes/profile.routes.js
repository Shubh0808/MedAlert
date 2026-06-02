import { Router } from "express";
import { body } from "express-validator";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getProfile);
router.put(
  "/",
  [
    body("fullName").optional().trim().isLength({ min: 2, max: 80 }),
    body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
    body("medicalProfile.age").optional({ checkFalsy: true }).isInt({ min: 0, max: 120 }),
    body("medicalProfile.gender")
      .optional({ checkFalsy: true })
      .isIn(["male", "female", "other", "prefer_not_to_say", ""]),
    body("medicalProfile.bloodGroup")
      .optional({ checkFalsy: true })
      .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""]),
    body("medicalProfile.address").optional({ checkFalsy: true }).trim().isLength({ max: 300 })
  ],
  validate,
  updateProfile
);

export default router;
