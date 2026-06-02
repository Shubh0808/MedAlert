import { Router } from "express";
import {
  getAdminAlerts,
  getAdminRecords,
  getDashboard,
  getUsers
} from "../controllers/admin.controller.js";
import { adminOnly, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/alerts", getAdminAlerts);
router.get("/records", getAdminRecords);

export default router;
