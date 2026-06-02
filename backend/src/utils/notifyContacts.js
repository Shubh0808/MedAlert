export const notifyEmergencyContacts = async ({ user, contacts, alert }) => {
  return contacts.map((contact) => ({
    contactId: contact._id,
    name: contact.name,
    phone: contact.phone,
    channel: "sms-placeholder",
    status: "queued",
    message: `${user.fullName} triggered an SOS alert at ${alert.createdAt.toISOString()}`
  }));
};
