const contactSummary = (contacts) =>
  contacts.length
    ? contacts.map((contact) => `${contact.name}: ${contact.phone}`).join("; ")
    : "No emergency contacts saved";

export const buildEmergencyMessage = ({ user, alert, nearestHospital, contacts = [] }) => {
  const contactText = contactSummary(contacts);
  const hospitalText = nearestHospital
    ? `Nearest hospital: ${nearestHospital.name} (${nearestHospital.distanceKm} km). ${nearestHospital.phone || nearestHospital.emergencyPhone || "Phone not listed"}.`
    : "Nearest hospital could not be identified automatically.";

  return [
    `MedAlert SOS: ${user.fullName} triggered a ${alert.severity} emergency alert.`,
    `Location: ${alert.googleMapsUrl}`,
    hospitalText,
    `Emergency contacts: ${contactText}`
  ].join(" ");
};

export const notifyEmergencyContacts = async ({ user, contacts, alert, nearestHospital }) => {
  const message = buildEmergencyMessage({ user, alert, nearestHospital, contacts });

  return contacts.map((contact) => ({
    contactId: contact._id,
    name: contact.name,
    phone: contact.phone,
    preference: contact.notificationPreference || "sms",
    channel: `${contact.notificationPreference || "sms"}-placeholder`,
    status: "queued",
    queuedAt: new Date(),
    message
  }));
};

export const notifyNearestHospital = async ({ user, contacts, alert, nearestHospital }) => {
  if (!nearestHospital) {
    return {
      status: "unavailable",
      message: "No nearby hospital was found for this SOS location."
    };
  }

  const phone = nearestHospital.emergencyPhone || nearestHospital.phone || "";

  return {
    name: nearestHospital.name,
    phone,
    status: phone ? "queued" : "unavailable",
    channel: phone ? "sms-placeholder" : "manual-call-required",
    queuedAt: phone ? new Date() : undefined,
    message: buildEmergencyMessage({ user, alert, nearestHospital, contacts })
  };
};
