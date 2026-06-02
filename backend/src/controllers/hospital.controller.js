import Hospital from "../models/Hospital.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calculateDistanceKm } from "../utils/distance.js";

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
  const { lat, lng, radius = 50 } = req.query;
  const hospitals = await Hospital.find({ isActive: true }).sort({ name: 1 });

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
  const hospital = await Hospital.create(req.body);
  res.status(201).json({ hospital });
});

export const updateHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!hospital) {
    res.status(404);
    throw new Error("Hospital not found.");
  }

  res.status(200).json({ hospital });
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
