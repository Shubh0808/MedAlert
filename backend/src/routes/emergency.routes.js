import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  cancelAlert,
  createSOS,
  getActiveAlert,
  getAlertById,
  getAlerts,
  resolveAlert,
  updateAlertLocation
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
    body("severity").optional({ checkFalsy: true }).isIn(["critical", "high", "medium"]),
    body("accuracyMeters").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("accuracy").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  createSOS
);

router.get(
  "/alerts",
  [
    query("status").optional({ checkFalsy: true }).isIn(["active", "resolved", "cancelled"]),
    query("severity").optional({ checkFalsy: true }).isIn(["critical", "high", "medium"]),
    query("q").optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    query("from").optional({ checkFalsy: true }).isISO8601(),
    query("to").optional({ checkFalsy: true }).isISO8601()
  ],
  validate,
  getAlerts
);
router.get("/alerts/active/current", getActiveAlert);
router.get(
  "/alerts/:id",
  [param("id").isMongoId().withMessage("Invalid alert id.")],
  validate,
  getAlertById
);
router.patch(
  "/alerts/:id/resolve",
  [
    param("id").isMongoId().withMessage("Invalid alert id."),
    body("resolutionNotes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  resolveAlert
);
router.patch(
  "/alerts/:id/cancel",
  [
    param("id").isMongoId().withMessage("Invalid alert id."),
    body("resolutionNotes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  cancelAlert
);
router.patch(
  "/alerts/:id/location",
  [
    param("id").isMongoId().withMessage("Invalid alert id."),
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Valid latitude is required."),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Valid longitude is required."),
    body("accuracyMeters").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("accuracy").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  updateAlertLocation
);

export default router;
