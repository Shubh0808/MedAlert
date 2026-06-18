import { Router } from "express";
import { body } from "express-validator";
import { askHealthAssistant } from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(protect);

router.post(
  "/health-assistant",
  [
    body("symptoms")
      .trim()
      .isLength({ min: 3, max: 1500 })
      .withMessage("Describe symptoms in 3 to 1500 characters."),
    body("latitude").optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
    body("longitude").optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 })
  ],
  validate,
  askHealthAssistant
);

export default router;
