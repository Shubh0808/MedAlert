import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  createHospital,
  deleteHospital,
  getHospitalServices,
  getHospitals,
  updateHospital
} from "../controllers/hospital.controller.js";
import { adminOnly, protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.get(
  "/",
  [
    query("lat").optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
    query("lng").optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }),
    query("radius").optional({ checkFalsy: true }).isFloat({ min: 1, max: 500 }),
    query("q").optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    query("service").optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    query("has24x7Emergency").optional({ checkFalsy: true }).isBoolean(),
    query("ambulanceAvailable").optional({ checkFalsy: true }).isBoolean(),
    query("capacityStatus").optional({ checkFalsy: true }).isIn(["available", "limited", "full", "unknown"])
  ],
  validate,
  getHospitals
);

router.get("/services/list", getHospitalServices);

const hospitalValidation = [
  body("name").trim().isLength({ min: 2, max: 120 }),
  body("address").trim().isLength({ min: 5, max: 250 }),
  body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("emergencyPhone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  body("latitude").isFloat({ min: -90, max: 90 }),
  body("longitude").isFloat({ min: -180, max: 180 }),
  body("services")
    .optional()
    .custom((value) => Array.isArray(value) || typeof value === "string")
    .withMessage("Services must be a list or comma-separated text."),
  body("has24x7Emergency").optional().isBoolean(),
  body("ambulanceAvailable").optional().isBoolean(),
  body("capacityStatus").optional({ checkFalsy: true }).isIn(["available", "limited", "full", "unknown"]),
  body("website").optional({ checkFalsy: true }).isURL(),
  body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body("isActive").optional().isBoolean()
];

router.post("/", protect, adminOnly, hospitalValidation, validate, createHospital);
router.put(
  "/:id",
  protect,
  adminOnly,
  [param("id").isMongoId().withMessage("Invalid hospital id."), ...hospitalValidation],
  validate,
  updateHospital
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  [param("id").isMongoId().withMessage("Invalid hospital id.")],
  validate,
  deleteHospital
);

export default router;
