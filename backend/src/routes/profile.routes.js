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
    body("medicalProfile.heightCm").optional({ checkFalsy: true }).isFloat({ min: 30, max: 260 }),
    body("medicalProfile.weightKg").optional({ checkFalsy: true }).isFloat({ min: 1, max: 350 }),
    body("medicalProfile.insuranceProvider").optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body("medicalProfile.insurancePolicyNumber").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body("medicalProfile.physicianName").optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body("medicalProfile.physicianPhone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
    body("medicalProfile.emergencyNotes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body("medicalProfile.preferredLanguage").optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body("medicalProfile.organDonor").optional().isBoolean(),
    body("medicalProfile.consentToShare").optional().isBoolean(),
    body("medicalProfile.address").optional({ checkFalsy: true }).trim().isLength({ max: 300 })
  ],
  validate,
  updateProfile
);

export default router;
