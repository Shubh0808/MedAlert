import { Router } from "express";
import { body, param } from "express-validator";
import {
  createSOS,
  getAlertById,
  getAlerts,
  resolveAlert
} from "../controllers/emergency.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(protect);

router.post(
  "/sos",
  [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required."),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required."),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  createSOS
);

router.get("/alerts", getAlerts);
router.get(
  "/alerts/:id",
  [param("id").isMongoId().withMessage("Invalid alert id.")],
  validate,
  getAlertById
);
router.patch(
  "/alerts/:id/resolve",
  [param("id").isMongoId().withMessage("Invalid alert id.")],
  validate,
  resolveAlert
);

export default router;
