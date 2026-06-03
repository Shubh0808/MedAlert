import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import emergencyRoutes from "./routes/emergency.routes.js";
import recordRoutes from "./routes/record.routes.js";
import hospitalRoutes from "./routes/hospital.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { sanitizeRequest } from "./middleware/sanitize.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false
  })
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    app: "MedAlert API",
    timestamp: new Date().toISOString()
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api", emergencyRoutes);
app.use("/api", recordRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
