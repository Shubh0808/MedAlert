import Hospital from "../models/Hospital.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calculateDistanceKm } from "../utils/distance.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const withDistance = (hospital, latitude, longitude) => ({
  ...hospital.toObject(),
  distanceKm: calculateDistanceKm(
    Number(latitude),
    Number(longitude),
    hospital.latitude,
    hospital.longitude
  )
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

  const filter = { isActive: true };

  if (q) {
    const pattern = new RegExp(escapeRegex(String(q)), "i");
    filter.$or = [{ name: pattern }, { address: pattern }, { services: pattern }];
  }

  if (service) {
    filter.services = new RegExp(escapeRegex(String(service)), "i");
  }

  if (has24x7Emergency !== undefined && has24x7Emergency !== "") {
    filter.has24x7Emergency = toBoolean(has24x7Emergency);
  }

  if (ambulanceAvailable !== undefined && ambulanceAvailable !== "") {
    filter.ambulanceAvailable = toBoolean(ambulanceAvailable);
  }

  if (capacityStatus) {
    filter.capacityStatus = capacityStatus;
  }

  const hospitals = await Hospital.find(filter).sort({ name: 1 });

  if (lat && lng) {
    const nearbyHospitals = hospitals
      .map((hospital) => withDistance(hospital, lat, lng))
      .filter((hospital) => hospital.distanceKm <= Number(radius))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({ hospitals: nearbyHospitals });
    return;
  }

  res.status(200).json({ hospitals });
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
