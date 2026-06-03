export const notifyEmergencyContacts = async ({ user, contacts, alert }) => {
  return contacts.map((contact) => ({
    contactId: contact._id,
    name: contact.name,
    phone: contact.phone,
    preference: contact.notificationPreference || "sms",
    channel: `${contact.notificationPreference || "sms"}-placeholder`,
    status: "queued",
    queuedAt: new Date(),
    message: `${user.fullName} triggered a ${alert.severity} SOS alert at ${alert.createdAt.toISOString()}. Location: ${alert.googleMapsUrl}`
  }));
};
