export const formatDateTime = (value) => {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
};

export const formatDate = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
};

export const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};

export const listText = (items = []) => {
  if (!items?.length) return "None recorded";
  return items.join(", ");
};

export const categoryLabel = (value = "") =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const csvEscape = (value) => {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const downloadCsv = (filename, columns, rows) => {
  const csv = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const mapsSearchUrl = (latitude, longitude) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

export const mapsDirectionsUrl = (latitude, longitude) =>
  `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
