import axios from "axios";
import mongoose from "mongoose";
import { regionalHospitals } from "../data/regionalHospitals.js";
import Hospital from "../models/Hospital.js";
import { calculateDistanceKm } from "../utils/distance.js";

const OVERPASS_URL = process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";
const MAX_EXTERNAL_RADIUS_KM = 100;
const EXTERNAL_LIMIT = 30;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toBoolean = (value) => value === true || value === "true";

export const buildHospitalFilter = ({
  q,
  service,
  has24x7Emergency,
  ambulanceAvailable,
  capacityStatus
}) => {
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

  return filter;
};

export const withDistance = (hospital, latitude, longitude) => ({
  ...hospital.toObject(),
  distanceKm: calculateDistanceKm(
    Number(latitude),
    Number(longitude),
    hospital.latitude,
    hospital.longitude
  ),
  source: "database"
});

const directionsUrl = (latitude, longitude) =>
  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

const compactAddress = (tags = {}) => {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:postcode"]
  ].filter(Boolean);

  return tags["addr:full"] || parts.join(", ") || "Address not listed in OpenStreetMap";
};

const phoneFromTags = (tags = {}) =>
  tags["contact:phone"] || tags.phone || tags["phone:emergency"] || tags["contact:mobile"] || "";

const servicesFromTags = (tags = {}) => {
  const services = new Set(["Medical care"]);
  const amenity = String(tags.amenity || tags.healthcare || "").toLowerCase();

  if (amenity.includes("hospital")) {
    services.add("Hospital");
    services.add("Emergency");
  }
  if (amenity.includes("clinic")) services.add("Clinic");
  if (amenity.includes("doctor")) services.add("Doctor");
  if (tags.emergency === "yes") services.add("Emergency");
  if (tags.healthcare_speciality) {
    String(tags.healthcare_speciality)
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => services.add(item));
  }

  return [...services];
};

const normalizeExternalHospital = (element, latitude, longitude) => {
  const tags = element.tags || {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;

  if (lat === undefined || lng === undefined) {
    return null;
  }

  const name =
    tags.name ||
    tags["official_name"] ||
    tags["operator"] ||
    (String(tags.amenity || tags.healthcare || "").includes("clinic")
      ? "Nearby clinic"
      : "Nearby hospital");
  const phone = phoneFromTags(tags);
  const has24x7Emergency = tags.opening_hours === "24/7" || tags.emergency === "yes";

  return {
    _id: `osm-${element.type}-${element.id}`,
    name,
    phone,
    emergencyPhone: tags["phone:emergency"] || phone,
    address: compactAddress(tags),
    latitude: Number(lat),
    longitude: Number(lng),
    services: servicesFromTags(tags),
    has24x7Emergency,
    ambulanceAvailable: tags.ambulance === "yes" || tags["emergency_service"] === "ambulance",
    capacityStatus: "unknown",
    website: tags.website || tags["contact:website"] || "",
    notes: "Live result from OpenStreetMap. Call ahead when possible.",
    source: "openstreetmap",
    osmType: element.type,
    osmId: element.id,
    distanceKm: calculateDistanceKm(Number(latitude), Number(longitude), Number(lat), Number(lng)),
    directionsUrl: directionsUrl(Number(lat), Number(lng))
  };
};

const externalMatchesFilters = (hospital, filters = {}) => {
  const { q, service, has24x7Emergency, ambulanceAvailable, capacityStatus } = filters;

  if (q) {
    const pattern = new RegExp(escapeRegex(String(q)), "i");
    const haystack = [hospital.name, hospital.address, ...(hospital.services || [])].join(" ");
    if (!pattern.test(haystack)) return false;
  }

  if (service) {
    const pattern = new RegExp(escapeRegex(String(service)), "i");
    if (!(hospital.services || []).some((item) => pattern.test(item))) return false;
  }

  if (has24x7Emergency !== undefined && has24x7Emergency !== "") {
    if (hospital.has24x7Emergency !== toBoolean(has24x7Emergency)) return false;
  }

  if (ambulanceAvailable !== undefined && ambulanceAvailable !== "") {
    if (hospital.ambulanceAvailable !== toBoolean(ambulanceAvailable)) return false;
  }

  if (capacityStatus && hospital.capacityStatus !== capacityStatus) {
    return false;
  }

  return true;
};

const regionalFallbackHospitals = ({ latitude, longitude, radiusKm, filters }) =>
  regionalHospitals
    .map((hospital) => ({
      ...hospital,
      distanceKm: calculateDistanceKm(
        Number(latitude),
        Number(longitude),
        hospital.latitude,
        hospital.longitude
      ),
      source: "regional-fallback",
      directionsUrl: directionsUrl(hospital.latitude, hospital.longitude)
    }))
    .filter((hospital) => hospital.distanceKm <= Number(radiusKm))
    .filter((hospital) => externalMatchesFilters(hospital, filters));

const dedupeHospitals = (hospitals) => {
  const seen = new Set();

  return hospitals.filter((hospital) => {
    const key = `${String(hospital.name).toLowerCase()}-${hospital.latitude.toFixed(4)}-${hospital.longitude.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const fetchOpenStreetMapHospitals = async ({
  latitude,
  longitude,
  radiusKm = 25,
  filters = {}
}) => {
  const safeRadiusKm = Math.min(Math.max(Number(radiusKm) || 25, 1), MAX_EXTERNAL_RADIUS_KM);
  const radiusMeters = Math.round(safeRadiusKm * 1000);
  const lat = Number(latitude);
  const lng = Number(longitude);

  const query = `
    [out:json][timeout:12];
    (
      node["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusMeters},${lat},${lng});
      relation["amenity"~"^(hospital|clinic|doctors)$"](around:${radiusMeters},${lat},${lng});
      node["healthcare"~"^(hospital|clinic|doctor)$"](around:${radiusMeters},${lat},${lng});
      way["healthcare"~"^(hospital|clinic|doctor)$"](around:${radiusMeters},${lat},${lng});
      relation["healthcare"~"^(hospital|clinic|doctor)$"](around:${radiusMeters},${lat},${lng});
    );
    out tags center ${EXTERNAL_LIMIT};
  `;

  try {
    const { data } = await axios.post(OVERPASS_URL, new URLSearchParams({ data: query }), {
      timeout: 8000,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MedAlert/1.0 nearby-hospital-finder"
      }
    });

    return dedupeHospitals(
      (data.elements || [])
        .map((element) => normalizeExternalHospital(element, lat, lng))
        .filter(Boolean)
        .filter((hospital) => hospital.distanceKm <= safeRadiusKm)
        .filter((hospital) => externalMatchesFilters(hospital, filters))
        .sort((a, b) => a.distanceKm - b.distanceKm)
    ).slice(0, EXTERNAL_LIMIT);
  } catch (_error) {
    return [];
  }
};

export const findHospitalsNear = async ({
  latitude,
  longitude,
  radiusKm = 50,
  filters = {},
  includeExternal = true
}) => {
  const localFilter = buildHospitalFilter(filters);
  const localHospitals =
    mongoose.connection.readyState === 1 ? await Hospital.find(localFilter).sort({ name: 1 }) : [];
  const nearbyLocal = localHospitals
    .map((hospital) => withDistance(hospital, latitude, longitude))
    .filter((hospital) => hospital.distanceKm <= Number(radiusKm))
    .map((hospital) => ({
      ...hospital,
      directionsUrl: directionsUrl(hospital.latitude, hospital.longitude)
    }));

  const externalHospitals =
    includeExternal && latitude !== undefined && longitude !== undefined
      ? await fetchOpenStreetMapHospitals({ latitude, longitude, radiusKm, filters })
      : [];
  const fallbackHospitals =
    latitude !== undefined && longitude !== undefined
      ? regionalFallbackHospitals({ latitude, longitude, radiusKm, filters })
      : [];

  return dedupeHospitals([...nearbyLocal, ...externalHospitals, ...fallbackHospitals]).sort(
    (a, b) => a.distanceKm - b.distanceKm
  );
};

export const findNearestHospital = async ({ latitude, longitude, radiusKm = 50 }) => {
  const hospitals = await findHospitalsNear({
    latitude,
    longitude,
    radiusKm,
    filters: {},
    includeExternal: true
  });

  return hospitals[0] || null;
};
