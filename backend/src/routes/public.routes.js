import { Router } from "express";
import { param } from "express-validator";
import { getPublicEmergencyCard } from "../controllers/profile.controller.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.get(
  "/emergency-card/:userId",
  [param("userId").isMongoId().withMessage("Invalid user id.")],
  validate,
  getPublicEmergencyCard
);

export default router;
