import { Router } from "express";
import { body, param } from "express-validator";
import {
  deleteRecord,
  getRecords,
  uploadRecord
} from "../controllers/record.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

const router = Router();

router.use(protect);

router.post(
  "/upload",
  upload.single("file"),
  [
    body("title").trim().isLength({ min: 2, max: 120 }).withMessage("Record title is required."),
    body("category")
      .optional({ checkFalsy: true })
      .isIn(["prescription", "lab_report", "insurance", "imaging", "other"])
  ],
  validate,
  uploadRecord
);

router.get("/records", getRecords);
router.delete(
  "/records/:id",
  [param("id").isMongoId().withMessage("Invalid record id.")],
  validate,
  deleteRecord
);

export default router;
