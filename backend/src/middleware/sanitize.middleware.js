const dangerousMongoKey = (key) => key.startsWith("$") || key.includes(".");
const sensitiveField = (key) => key.toLowerCase().includes("password");

const stripXssContent = (value) =>
  value
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "");

const sanitizeValue = (value, key = "") => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }

  if (value && typeof value === "object") {
    for (const childKey of Object.keys(value)) {
      if (dangerousMongoKey(childKey)) {
        delete value[childKey];
      } else {
        value[childKey] = sanitizeValue(value[childKey], childKey);
      }
    }
    return value;
  }

  if (typeof value === "string" && !sensitiveField(key)) {
    return stripXssContent(value);
  }

  return value;
};

export const sanitizeRequest = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === "object") {
    sanitizeValue(req.query);
  }

  if (req.params && typeof req.params === "object") {
    sanitizeValue(req.params);
  }

  next();
};
