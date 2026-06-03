const requiredProfileChecks = [
  ["Blood group", (user) => Boolean(user.medicalProfile?.bloodGroup)],
  ["Age", (user) => Boolean(user.medicalProfile?.age)],
  ["Phone", (user) => Boolean(user.phone)],
  ["Address", (user) => Boolean(user.medicalProfile?.address)],
  ["Allergies reviewed", (user) => Array.isArray(user.medicalProfile?.allergies)],
  ["Emergency notes", (user) => Boolean(user.medicalProfile?.emergencyNotes)]
];

export const getProfileCompleteness = (user, contacts = []) => {
  const checks = [
    ...requiredProfileChecks,
    ["Primary contact", () => contacts.some((contact) => contact.isPrimary)],
    ["Two contacts", () => contacts.length >= 2],
    ["Doctor contact", () => Boolean(user.medicalProfile?.physicianName || user.medicalProfile?.physicianPhone)],
    ["Insurance", () => Boolean(user.medicalProfile?.insuranceProvider || user.medicalProfile?.insurancePolicyNumber)]
  ];

  const completed = checks.filter(([, passes]) => passes(user)).length;

  return {
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
    missing: checks
      .filter(([, passes]) => !passes(user))
      .map(([label]) => label)
  };
};

export const buildEmergencyCard = (user, contacts = []) => {
  const primaryContact = contacts.find((contact) => contact.isPrimary) || contacts[0] || null;

  return {
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    medicalProfile: {
      age: user.medicalProfile?.age,
      gender: user.medicalProfile?.gender,
      bloodGroup: user.medicalProfile?.bloodGroup,
      allergies: user.medicalProfile?.allergies || [],
      existingDiseases: user.medicalProfile?.existingDiseases || [],
      currentMedications: user.medicalProfile?.currentMedications || [],
      emergencyNotes: user.medicalProfile?.emergencyNotes || "",
      physicianName: user.medicalProfile?.physicianName || "",
      physicianPhone: user.medicalProfile?.physicianPhone || "",
      organDonor: Boolean(user.medicalProfile?.organDonor),
      preferredLanguage: user.medicalProfile?.preferredLanguage || ""
    },
    primaryContact: primaryContact
      ? {
          name: primaryContact.name,
          relation: primaryContact.relation,
          phone: primaryContact.phone,
          notificationPreference: primaryContact.notificationPreference
        }
      : null
  };
};
