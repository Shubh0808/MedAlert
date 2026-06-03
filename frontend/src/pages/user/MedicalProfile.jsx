import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "../../api/client.js";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";

const csv = (items = []) => items.join(", ");

const MedicalProfile = () => {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/profile")).data
  });
  const {
    register,
    reset,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm();

  useEffect(() => {
    const profile = data?.profile;
    if (!profile) return;

    reset({
      fullName: profile.fullName,
      phone: profile.phone,
      age: profile.medicalProfile?.age || "",
      gender: profile.medicalProfile?.gender || "",
      bloodGroup: profile.medicalProfile?.bloodGroup || "",
      allergies: csv(profile.medicalProfile?.allergies),
      existingDiseases: csv(profile.medicalProfile?.existingDiseases),
      currentMedications: csv(profile.medicalProfile?.currentMedications),
      heightCm: profile.medicalProfile?.heightCm || "",
      weightKg: profile.medicalProfile?.weightKg || "",
      insuranceProvider: profile.medicalProfile?.insuranceProvider || "",
      insurancePolicyNumber: profile.medicalProfile?.insurancePolicyNumber || "",
      physicianName: profile.medicalProfile?.physicianName || "",
      physicianPhone: profile.medicalProfile?.physicianPhone || "",
      emergencyNotes: profile.medicalProfile?.emergencyNotes || "",
      preferredLanguage: profile.medicalProfile?.preferredLanguage || "",
      organDonor: Boolean(profile.medicalProfile?.organDonor),
      consentToShare: profile.medicalProfile?.consentToShare !== false,
      address: profile.medicalProfile?.address || ""
    });
  }, [data, reset]);

  const onSubmit = async (values) => {
    setMessage("");
    setError("");
    try {
      const payload = {
        fullName: values.fullName,
        phone: values.phone,
        medicalProfile: {
          age: values.age ? Number(values.age) : undefined,
          gender: values.gender,
          bloodGroup: values.bloodGroup,
          allergies: values.allergies,
          existingDiseases: values.existingDiseases,
          currentMedications: values.currentMedications,
          heightCm: values.heightCm ? Number(values.heightCm) : undefined,
          weightKg: values.weightKg ? Number(values.weightKg) : undefined,
          insuranceProvider: values.insuranceProvider,
          insurancePolicyNumber: values.insurancePolicyNumber,
          physicianName: values.physicianName,
          physicianPhone: values.physicianPhone,
          emergencyNotes: values.emergencyNotes,
          preferredLanguage: values.preferredLanguage,
          organDonor: Boolean(values.organDonor),
          consentToShare: Boolean(values.consentToShare),
          address: values.address
        }
      };
      const { data: updated } = await api.put("/profile", payload);
      setUser(updated.profile);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setMessage("Medical profile updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading profile...</p>;
  }

  const readiness = data?.profileCompleteness;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Medical Profile</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Health Information</h1>
        </div>
        {readiness ? (
          <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
            Profile readiness {readiness.percent}%
          </div>
        ) : null}
      </div>

      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit(onSubmit)}>
        {readiness?.missing?.length ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="flex items-center gap-2 font-bold">
              <CircleAlert className="h-4 w-4" aria-hidden="true" />
              Complete these details for a stronger emergency card
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {readiness.missing.map((item) => (
                <span key={item} className="rounded-md bg-white px-2 py-1 text-xs font-bold">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="mr-2 inline h-4 w-4" aria-hidden="true" />
            Emergency profile is ready.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Full name">
            <input className={inputClasses} required {...register("fullName")} />
          </FormField>
          <FormField label="Phone number">
            <input className={inputClasses} {...register("phone")} />
          </FormField>
          <FormField label="Age">
            <input className={inputClasses} type="number" min="0" max="120" {...register("age")} />
          </FormField>
          <FormField label="Gender">
            <select className={inputClasses} {...register("gender")}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </FormField>
          <FormField label="Blood group">
            <select className={inputClasses} {...register("bloodGroup")}>
              <option value="">Select blood group</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Preferred language">
            <input className={inputClasses} placeholder="English, Hindi, Tamil" {...register("preferredLanguage")} />
          </FormField>
          <FormField label="Height (cm)">
            <input className={inputClasses} type="number" min="30" max="260" {...register("heightCm")} />
          </FormField>
          <FormField label="Weight (kg)">
            <input className={inputClasses} type="number" min="1" max="350" {...register("weightKg")} />
          </FormField>
          <FormField label="Allergies">
            <input className={inputClasses} placeholder="Penicillin, peanuts" {...register("allergies")} />
          </FormField>
          <FormField label="Existing diseases">
            <input className={inputClasses} placeholder="Asthma, diabetes" {...register("existingDiseases")} />
          </FormField>
          <FormField label="Current medications">
            <input className={inputClasses} placeholder="Metformin, inhaler" {...register("currentMedications")} />
          </FormField>
          <FormField label="Doctor name">
            <input className={inputClasses} placeholder="Dr. Sharma" {...register("physicianName")} />
          </FormField>
          <FormField label="Doctor phone">
            <input className={inputClasses} placeholder="+91 ..." {...register("physicianPhone")} />
          </FormField>
          <FormField label="Insurance provider">
            <input className={inputClasses} placeholder="Provider name" {...register("insuranceProvider")} />
          </FormField>
          <FormField label="Policy number">
            <input className={inputClasses} placeholder="Policy / member ID" {...register("insurancePolicyNumber")} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Address">
              <textarea className={`${inputClasses} min-h-24`} {...register("address")} />
            </FormField>
          </div>
          <div className="md:col-span-2">
            <FormField label="Emergency notes">
              <textarea
                className={`${inputClasses} min-h-24`}
                placeholder="Seizure protocol, implants, communication needs, or anything a responder should know."
                {...register("emergencyNotes")}
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" {...register("organDonor")} />
            Organ donor
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" {...register("consentToShare")} />
            Allow public QR emergency card
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Saving..." : "Save profile"}
          </button>
          {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        </div>
      </form>
    </div>
  );
};

export default MedicalProfile;
