import Hospital from "../models/Hospital.js";
import {
  buildHospitalFilter,
  findHospitalsNear
} from "../services/hospitalLookup.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const toBoolean = (value) => value === true || value === "true";

const normalizeHospitalPayload = (body) => ({
  ...body,
  latitude: Number(body.latitude),
  longitude: Number(body.longitude),
  services: Array.isArray(body.services)
    ? body.services.map((service) => String(service).trim()).filter(Boolean)
    : String(body.services || "")
        .split(",")
        .map((service) => service.trim())
        .filter(Boolean),
  has24x7Emergency:
    body.has24x7Emergency === undefined ? undefined : toBoolean(body.has24x7Emergency),
  ambulanceAvailable:
    body.ambulanceAvailable === undefined ? undefined : toBoolean(body.ambulanceAvailable),
  lastVerifiedAt: body.lastVerifiedAt || new Date()
});

export const getHospitals = asyncHandler(async (req, res) => {
  const {
    lat,
    lng,
    radius = 50,
    q,
    service,
    has24x7Emergency,
    ambulanceAvailable,
    capacityStatus
  } = req.query;

  const filters = { q, service, has24x7Emergency, ambulanceAvailable, capacityStatus };
  const filter = buildHospitalFilter(filters);

  if (lat && lng) {
    const nearbyHospitals = await findHospitalsNear({
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      filters,
      includeExternal: true
    });

    res.status(200).json({
      hospitals: nearbyHospitals,
      sources: {
        database: nearbyHospitals.filter((hospital) => hospital.source === "database").length,
        openstreetmap: nearbyHospitals.filter((hospital) => hospital.source === "openstreetmap").length,
        regionalFallback: nearbyHospitals.filter((hospital) => hospital.source === "regional-fallback").length
      }
    });
    return;
  }

  const hospitals = await Hospital.find(filter).sort({ name: 1 });
  res.status(200).json({ hospitals: hospitals.map((hospital) => ({ ...hospital.toObject(), source: "database" })) });
});

export const createHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.create(normalizeHospitalPayload(req.body));
  res.status(201).json({ hospital });
});

export const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, normalizeHospitalPayload(req.body), {
    new: true,
    runValidators: true
  });

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found.");
  }

  res.status(200).json({ hospital });
});

export const getHospitalServices = asyncHandler(async (_req, res) => {
  const hospitals = await Hospital.find({ isActive: true }).select("services");
  const services = [...new Set(hospitals.flatMap((hospital) => hospital.services || []))].sort();
  res.status(200).json({ services });
});

export const deleteHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found.");
  }

  res.status(200).json({ message: "Hospital removed from active listings." });
});
