import { Router } from "express";
import { body, param } from "express-validator";
import {
  createContact,
  deleteContact,
  getContacts,
  updateContact
} from "../controllers/contact.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(protect);

const contactValidation = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Contact name is required."),
  body("relation").trim().isLength({ min: 2, max: 50 }).withMessage("Relation is required."),
  body("phone").trim().isLength({ min: 6, max: 20 }).withMessage("Valid phone number is required."),
  body("email").optional({ checkFalsy: true }).isEmail().normalizeEmail(),
  body("priority").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }),
  body("notificationPreference").optional({ checkFalsy: true }).isIn(["sms", "call", "whatsapp", "all"]),
  body("notes").optional({ checkFalsy: true }).trim().isLength({ max: 300 }),
  body("isPrimary").optional().isBoolean()
];

router.get("/", getContacts);
router.post("/", contactValidation, validate, createContact);
router.put(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid contact id."), ...contactValidation],
  validate,
  updateContact
);
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid contact id.")],
  validate,
  deleteContact
);

export default router;
