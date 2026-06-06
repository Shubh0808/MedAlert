import { Router } from "express";
import { param } from "express-validator";
import { getPublicEmergencyCard } from "../controllers/profile.controller.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.get("/maps-config", (_req, res) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY || "";

  res.set("Cache-Control", "no-store");
  res.status(200).json({
    googleMapsApiKey,
    hasGoogleMapsApiKey: Boolean(googleMapsApiKey)
  });
});

router.get(
  "/emergency-card/:userId",
  [param("userId").isMongoId().withMessage("Invalid user id.")],
  validate,
  getPublicEmergencyCard
);

export default router;
