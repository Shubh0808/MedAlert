import { Router } from "express";
import {
  adminCancelAlert,
  adminResolveAlert,
  getAdminAlerts,
  getAdminRecords,
  getDashboard,
  getUsers,
  updateUserStatus
} from "../controllers/admin.controller.js";
import { body, param } from "express-validator";
import { adminOnly, protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/alerts", getAdminAlerts);
router.get("/records", getAdminRecords);
router.patch(
  "/users/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid user id."),
    body("isActive").isBoolean().withMessage("Active status is required.")
  ],
  validate,
  updateUserStatus
);
router.patch(
  "/alerts/:id/resolve",
  [
    param("id").isMongoId().withMessage("Invalid alert id."),
    body("resolutionNotes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  adminResolveAlert
);
router.patch(
  "/alerts/:id/cancel",
  [
    param("id").isMongoId().withMessage("Invalid alert id."),
    body("resolutionNotes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
    body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 })
  ],
  validate,
  adminCancelAlert
);

export default router;
