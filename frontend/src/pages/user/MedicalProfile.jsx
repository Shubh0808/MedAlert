import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-teal-700">Medical Profile</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Health Information</h1>
      </div>

      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft" onSubmit={handleSubmit(onSubmit)}>
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
          <FormField label="Allergies">
            <input className={inputClasses} placeholder="Penicillin, peanuts" {...register("allergies")} />
          </FormField>
          <FormField label="Existing diseases">
            <input className={inputClasses} placeholder="Asthma, diabetes" {...register("existingDiseases")} />
          </FormField>
          <FormField label="Current medications">
            <input className={inputClasses} placeholder="Metformin, inhaler" {...register("currentMedications")} />
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Address">
              <textarea className={`${inputClasses} min-h-24`} {...register("address")} />
            </FormField>
          </div>
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
