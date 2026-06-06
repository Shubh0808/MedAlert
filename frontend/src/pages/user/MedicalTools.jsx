import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Droplets,
  FileText,
  HeartPulse,
  ListChecks,
  MessageSquareText,
  Pill,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Thermometer,
  Timer
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/client.js";
import { inputClasses } from "../../components/FormField.jsx";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import { listText, mapsSearchUrl } from "../../utils/format.js";

const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const RBC_DONOR_COMPATIBILITY = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};

const FIRST_AID_PROTOCOLS = {
  chestPain: {
    label: "Chest pain",
    action: "Call emergency services, keep the person resting, and do not let them drive.",
    steps: ["Stop activity and sit upright.", "Call emergency services if pain is severe, new, or spreading.", "Loosen tight clothing.", "Keep medications and medical history ready."]
  },
  stroke: {
    label: "Stroke signs",
    action: "Face, arm, or speech changes are time-sensitive. Call emergency services immediately.",
    steps: ["Check face drooping.", "Ask them to raise both arms.", "Listen for slurred or strange speech.", "Note the exact time symptoms started."]
  },
  bleeding: {
    label: "Severe bleeding",
    action: "Apply firm direct pressure and call emergency services.",
    steps: ["Press firmly with clean cloth or gauze.", "Keep pressure steady.", "Raise the injured area if possible.", "Do not remove soaked dressings; add more over them."]
  },
  burn: {
    label: "Burn",
    action: "Cool the burn and remove jewelry near the area.",
    steps: ["Cool under clean running water for 20 minutes.", "Remove tight items near the burn.", "Cover with a clean non-stick dressing.", "Seek urgent care for deep, chemical, electrical, or large burns."]
  },
  choking: {
    label: "Choking",
    action: "If the person cannot cough, speak, or breathe, call emergency services and begin choking first aid.",
    steps: ["Ask if they are choking.", "Encourage coughing if air is moving.", "Use local taught choking first-aid steps.", "Start CPR if they become unresponsive."]
  },
  seizure: {
    label: "Seizure",
    action: "Protect from injury and time the seizure.",
    steps: ["Move hard objects away.", "Do not restrain the person.", "Do not put anything in their mouth.", "Call emergency services if it lasts over 5 minutes or breathing is abnormal."]
  },
  fracture: {
    label: "Possible fracture",
    action: "Immobilize the area and avoid moving the person unnecessarily.",
    steps: ["Keep the injured area still.", "Apply a cold pack wrapped in cloth.", "Check circulation below the injury.", "Seek urgent care for deformity, open wound, or severe pain."]
  },
  poisoning: {
    label: "Poisoning",
    action: "Call poison control or emergency services with the product name ready.",
    steps: ["Move away from exposure.", "Do not induce vomiting unless told by professionals.", "Keep container or label available.", "Track time and amount exposed."]
  },
  heatIllness: {
    label: "Heat illness",
    action: "Move to a cool place and start active cooling.",
    steps: ["Move out of heat.", "Remove extra clothing.", "Use cool wet cloths or fan.", "Call emergency services for confusion, fainting, or very high temperature."]
  },
  fainting: {
    label: "Fainting",
    action: "Lay the person flat and check breathing.",
    steps: ["Lay them on their back.", "Raise legs if safe.", "Loosen tight clothing.", "Call emergency services if they do not recover quickly or have chest pain."]
  }
};

const VACCINE_ITEMS = [
  "COVID-19",
  "Influenza",
  "Tetanus",
  "Hepatitis B",
  "MMR",
  "Varicella",
  "HPV",
  "Pneumococcal"
];

const KIT_ITEMS = [
  "Prescription medicines",
  "Allergy medicines",
  "Inhaler or device",
  "Glucose source",
  "Bandage kit",
  "Thermometer",
  "Insurance card",
  "Emergency contact printout"
];

const FEATURE_NAMES = [
  "Emergency triage score",
  "Vitals safety scan",
  "Blood pressure category",
  "Oxygen saturation flag",
  "Fever checker",
  "Glucose flag",
  "Pulse and breathing check",
  "BMI calculator",
  "BSA calculator",
  "Hydration target",
  "Creatinine clearance estimate",
  "Medication schedule builder",
  "Allergy text check",
  "Blood compatibility check",
  "CPR metronome",
  "FAST stroke checklist",
  "First-aid protocol library",
  "Emergency message generator",
  "Ambulance call script",
  "ICE profile summary",
  "Document readiness checklist",
  "Vaccination checklist",
  "Symptom diary",
  "Pain trend tracker",
  "Travel medical kit",
  "Fall-risk screener"
];

const toneClasses = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-red-200 bg-red-50 text-red-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  slate: "border-slate-200 bg-slate-50 text-slate-700"
};

const emptyChecklist = (items) =>
  items.reduce((accumulator, item) => {
    accumulator[item] = false;
    return accumulator;
  }, {});

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const round = (value, places = 1) => {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(places);
};

const setField = (setter, field) => (event) => {
  const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  setter((current) => ({ ...current, [field]: value }));
};

const ToolCard = ({ icon: Icon, title, action, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {action}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const ResultPill = ({ tone = "slate", children }) => (
  <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${toneClasses[tone]}`}>
    {children}
  </span>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-xs font-bold uppercase tracking-normal text-slate-500">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const CheckRow = ({ checked, label, onChange }) => (
  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" checked={checked} onChange={onChange} />
    {label}
  </label>
);

const getBmiCategory = (bmi) => {
  if (!bmi) return { label: "Enter height and weight", tone: "slate" };
  if (bmi < 18.5) return { label: "Underweight", tone: "amber" };
  if (bmi < 25) return { label: "Healthy weight", tone: "emerald" };
  if (bmi < 30) return { label: "Overweight", tone: "amber" };
  return { label: "Obesity range", tone: "red" };
};

const getBpCategory = (systolic, diastolic) => {
  if (systolic > 180 || diastolic > 120) {
    return { label: "Hypertensive crisis range", tone: "red", action: "Recheck once, then seek urgent help if still high." };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { label: "High blood pressure stage 2", tone: "red", action: "Discuss with a clinician soon." };
  }
  if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
    return { label: "High blood pressure stage 1", tone: "amber", action: "Track readings and review risk factors." };
  }
  if (systolic >= 120 && systolic <= 129 && diastolic < 80) {
    return { label: "Elevated", tone: "amber", action: "Lifestyle review and repeat checks." };
  }
  if (systolic > 0 && diastolic > 0) {
    return { label: "Normal range", tone: "emerald", action: "Keep monitoring routinely." };
  }
  return { label: "Enter blood pressure", tone: "slate", action: "Waiting for values." };
};

const getVitalsScan = (vitals) => {
  const systolic = numberValue(vitals.systolic);
  const diastolic = numberValue(vitals.diastolic);
  const pulse = numberValue(vitals.pulse);
  const respiration = numberValue(vitals.respiration);
  const temperature = numberValue(vitals.temperature);
  const spo2 = numberValue(vitals.spo2);
  const glucose = numberValue(vitals.glucose);
  const warnings = [];

  if (systolic > 180 || diastolic > 120) warnings.push("Blood pressure crisis range");
  if (spo2 && spo2 < 90) warnings.push("Oxygen saturation below 90%");
  if (temperature >= 39.5 || temperature < 35) warnings.push("Temperature danger range");
  if (glucose && (glucose < 54 || glucose > 300)) warnings.push("Glucose danger range");
  if (pulse && (pulse < 45 || pulse > 130)) warnings.push("Pulse danger range");
  if (respiration && (respiration < 8 || respiration > 30)) warnings.push("Breathing rate danger range");

  if (warnings.length) {
    return { tone: "red", label: "Urgent review", warnings };
  }

  const caution = [];
  if (systolic >= 140 || diastolic >= 90) caution.push("High blood pressure");
  if (spo2 && spo2 < 94) caution.push("Low oxygen saturation");
  if (temperature >= 38) caution.push("Fever");
  if (glucose && (glucose < 70 || glucose > 250)) caution.push("Glucose outside usual range");
  if (pulse && (pulse < 50 || pulse > 120)) caution.push("Pulse outside usual range");

  if (caution.length) {
    return { tone: "amber", label: "Needs monitoring", warnings: caution };
  }

  return { tone: "emerald", label: "No urgent flags", warnings: ["Values entered do not trigger emergency flags."] };
};

const addHoursToTime = (time, hoursToAdd) => {
  const [hours = 0, minutes = 0] = String(time || "08:00").split(":").map(Number);
  const totalMinutes = (hours * 60 + minutes + Math.round(hoursToAdd * 60)) % 1440;
  const safeTotal = totalMinutes < 0 ? totalMinutes + 1440 : totalMinutes;
  const nextHours = Math.floor(safeTotal / 60);
  const nextMinutes = safeTotal % 60;

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
};

const MedicalTools = () => {
  const { position, requestLocation } = useGeolocation({ watch: false });
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/profile")).data
  });
  const { data: recordSummary } = useQuery({
    queryKey: ["records-summary"],
    queryFn: async () => (await api.get("/records/summary")).data
  });

  const profile = profileData?.profile;
  const medicalProfile = profile?.medicalProfile || {};
  const contacts = profileData?.contacts || [];
  const allergies = medicalProfile.allergies || [];
  const medications = medicalProfile.currentMedications || [];

  const [body, setBody] = useState({
    heightCm: "",
    weightKg: "",
    age: "",
    sex: "male",
    creatinine: "1",
    activity: "light"
  });
  const [bodyInitialized, setBodyInitialized] = useState(false);
  const [vitals, setVitals] = useState({
    systolic: "120",
    diastolic: "80",
    pulse: "78",
    respiration: "16",
    temperature: "37",
    spo2: "98",
    glucose: "105",
    pain: "2"
  });
  const [triage, setTriage] = useState({
    chestPain: false,
    troubleBreathing: false,
    strokeSigns: false,
    unconscious: false,
    severeBleeding: false,
    severeAllergy: false,
    fever: false,
    dehydration: false,
    severePain: false,
    vomiting: false
  });
  const [selectedProtocol, setSelectedProtocol] = useState("chestPain");
  const [fast, setFast] = useState({ face: false, arm: false, speech: false });
  const [metronome, setMetronome] = useState({ running: false, beats: 0 });
  const [medPlan, setMedPlan] = useState({ name: "", dose: "", timesPerDay: "2", startTime: "08:00" });
  const [medicineCheck, setMedicineCheck] = useState("");
  const [blood, setBlood] = useState({ donor: "O-", recipient: "O+" });
  const [vaccines, setVaccines] = useState(() => emptyChecklist(VACCINE_ITEMS));
  const [kit, setKit] = useState(() => emptyChecklist(KIT_ITEMS));
  const [symptomEntry, setSymptomEntry] = useState({ symptom: "", severity: "3", notes: "" });
  const [symptomLog, setSymptomLog] = useState([]);
  const [painLog, setPainLog] = useState([]);
  const [fallRisk, setFallRisk] = useState({
    falls: false,
    dizziness: false,
    mobility: false,
    vision: false,
    sedatingMeds: false
  });
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (!profile || bodyInitialized) return;

    setBody((current) => ({
      ...current,
      heightCm: medicalProfile.heightCm || current.heightCm,
      weightKg: medicalProfile.weightKg || current.weightKg,
      age: medicalProfile.age || current.age,
      sex: medicalProfile.gender === "female" ? "female" : "male"
    }));
    setBlood((current) => ({
      ...current,
      recipient: medicalProfile.bloodGroup || current.recipient
    }));
    setBodyInitialized(true);
  }, [bodyInitialized, medicalProfile, profile]);

  useEffect(() => {
    if (!metronome.running) return undefined;

    const interval = window.setInterval(() => {
      setMetronome((current) => ({ ...current, beats: current.beats + 1 }));
    }, Math.round(60000 / 110));

    return () => window.clearInterval(interval);
  }, [metronome.running]);

  const bodyResults = useMemo(() => {
    const height = numberValue(body.heightCm);
    const weight = numberValue(body.weightKg);
    const age = numberValue(body.age);
    const creatinine = numberValue(body.creatinine);
    const heightMeters = height / 100;
    const bmi = heightMeters && weight ? weight / (heightMeters * heightMeters) : 0;
    const bsa = height && weight ? Math.sqrt((height * weight) / 3600) : 0;
    const activityBoost = body.activity === "active" ? 700 : body.activity === "moderate" ? 350 : 0;
    const hydrationMl = weight ? weight * 35 + activityBoost : 0;
    const crcl =
      age && weight && creatinine
        ? (((140 - age) * weight) / (72 * creatinine)) * (body.sex === "female" ? 0.85 : 1)
        : 0;
    const healthyLow = heightMeters ? 18.5 * heightMeters * heightMeters : 0;
    const healthyHigh = heightMeters ? 24.9 * heightMeters * heightMeters : 0;

    return { bmi, bsa, hydrationMl, crcl, healthyLow, healthyHigh, bmiCategory: getBmiCategory(bmi) };
  }, [body]);

  const vitalsScan = useMemo(() => getVitalsScan(vitals), [vitals]);
  const bpCategory = useMemo(
    () => getBpCategory(numberValue(vitals.systolic), numberValue(vitals.diastolic)),
    [vitals.diastolic, vitals.systolic]
  );

  const triageResult = useMemo(() => {
    const emergencyKeys = ["chestPain", "troubleBreathing", "strokeSigns", "unconscious", "severeBleeding", "severeAllergy"];
    const emergencyHit = emergencyKeys.some((key) => triage[key]);
    const score = Object.values(triage).filter(Boolean).length;

    if (emergencyHit) {
      return { score, tone: "red", label: "Emergency priority", action: "Call emergency services now." };
    }
    if (score >= 3) {
      return { score, tone: "amber", label: "Urgent same-day review", action: "Use SOS or contact a doctor if symptoms worsen." };
    }
    if (score > 0) {
      return { score, tone: "blue", label: "Monitor closely", action: "Record symptoms and seek care if they persist." };
    }
    return { score, tone: "emerald", label: "No danger signs selected", action: "Keep profile and contacts ready." };
  }, [triage]);

  const scheduleTimes = useMemo(() => {
    const timesPerDay = Math.max(1, Math.min(6, numberValue(medPlan.timesPerDay)));
    const interval = 24 / timesPerDay;

    return Array.from({ length: timesPerDay }, (_item, index) => addHoursToTime(medPlan.startTime, interval * index));
  }, [medPlan.startTime, medPlan.timesPerDay]);

  const allergyMatches = useMemo(() => {
    const planned = medicineCheck.trim().toLowerCase();
    if (!planned) return [];

    return allergies.filter((allergy) => {
      const normalized = String(allergy).toLowerCase();
      return normalized && (planned.includes(normalized) || normalized.includes(planned));
    });
  }, [allergies, medicineCheck]);

  const bloodCompatible = RBC_DONOR_COMPATIBILITY[blood.donor]?.includes(blood.recipient) || false;
  const canReceiveFrom = BLOOD_GROUPS.filter((group) => RBC_DONOR_COMPATIBILITY[group]?.includes(blood.recipient));

  const fastPositive = fast.face || fast.arm || fast.speech;
  const vaccineProgress = Object.values(vaccines).filter(Boolean).length;
  const kitProgress = Object.values(kit).filter(Boolean).length;

  const documentChecks = [
    { label: "Name and phone", ready: Boolean(profile?.fullName && profile?.phone) },
    { label: "Blood group", ready: Boolean(medicalProfile.bloodGroup) },
    { label: "Allergies and diseases", ready: Boolean(allergies.length || medicalProfile.existingDiseases?.length) },
    { label: "Current medicines", ready: Boolean(medications.length) },
    { label: "Doctor details", ready: Boolean(medicalProfile.physicianName || medicalProfile.physicianPhone) },
    { label: "Insurance details", ready: Boolean(medicalProfile.insuranceProvider || medicalProfile.insurancePolicyNumber) },
    { label: "Emergency contacts", ready: contacts.length > 0 },
    { label: "Uploaded records", ready: (recordSummary?.totalRecords || 0) > 0 }
  ];
  const documentReady = documentChecks.filter((item) => item.ready).length;

  const fallRiskScore =
    Object.values(fallRisk).filter(Boolean).length + (numberValue(body.age) >= 65 ? 1 : 0);
  const fallRiskResult =
    fallRiskScore >= 3
      ? { tone: "red", label: "High fall-risk flags" }
      : fallRiskScore >= 1
        ? { tone: "amber", label: "Some fall-risk flags" }
        : { tone: "emerald", label: "No fall-risk flags selected" };

  const emergencyMessage = useMemo(() => {
    const coordinates = position ? `${position.latitude}, ${position.longitude}` : "Location not attached";
    const mapLink = position ? mapsSearchUrl(position.latitude, position.longitude) : "";

    return [
      `MedAlert SOS: ${profile?.fullName || "User"} may need medical help.`,
      `Blood group: ${medicalProfile.bloodGroup || "not recorded"}.`,
      `Allergies: ${listText(allergies)}.`,
      `Medications: ${listText(medications)}.`,
      `Location: ${coordinates}. ${mapLink}`
    ].join(" ");
  }, [allergies, medicalProfile.bloodGroup, medications, position, profile?.fullName]);

  const addSymptom = () => {
    if (!symptomEntry.symptom.trim()) return;

    setSymptomLog((current) => [
      {
        ...symptomEntry,
        id: crypto.randomUUID(),
        createdAt: new Date().toLocaleString()
      },
      ...current
    ]);
    setSymptomEntry({ symptom: "", severity: "3", notes: "" });
  };

  const addPainReading = () => {
    setPainLog((current) => [
      {
        id: crypto.randomUUID(),
        value: numberValue(vitals.pain),
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      },
      ...current.slice(0, 7)
    ]);
  };

  const copyEmergencyMessage = async () => {
    await navigator.clipboard.writeText(emergencyMessage);
    setCopyMessage("Emergency message copied.");
  };

  const copyCallScript = async () => {
    const script = [
      `Patient: ${profile?.fullName || "not recorded"}`,
      `Phone: ${profile?.phone || "not recorded"}`,
      `Blood group: ${medicalProfile.bloodGroup || "not recorded"}`,
      `Allergies: ${listText(allergies)}`,
      `Medicines: ${listText(medications)}`,
      `Doctor: ${medicalProfile.physicianName || "not recorded"} ${medicalProfile.physicianPhone || ""}`,
      `Address: ${medicalProfile.address || "not recorded"}`
    ].join("\n");

    await navigator.clipboard.writeText(script);
    setCopyMessage("Call script copied.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Medical Tools</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Smart Medical Utility Center</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Decision support only. For severe symptoms, use SOS or call local emergency services.
          </p>
        </div>
        <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-bold text-teal-800">
          {FEATURE_NAMES.length} working tools
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {FEATURE_NAMES.map((feature) => (
            <span key={feature} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">
              {feature}
            </span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ToolCard icon={ShieldAlert} title="Emergency Triage">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["chestPain", "Chest pain"],
              ["troubleBreathing", "Trouble breathing"],
              ["strokeSigns", "Stroke signs"],
              ["unconscious", "Unconscious or confused"],
              ["severeBleeding", "Severe bleeding"],
              ["severeAllergy", "Severe allergy"],
              ["fever", "Fever"],
              ["dehydration", "Dehydration"],
              ["severePain", "Severe pain"],
              ["vomiting", "Repeated vomiting"]
            ].map(([key, label]) => (
              <CheckRow
                key={key}
                label={label}
                checked={triage[key]}
                onChange={(event) => setTriage((current) => ({ ...current, [key]: event.target.checked }))}
              />
            ))}
          </div>
          <div className={`mt-4 rounded-lg border p-4 ${toneClasses[triageResult.tone]}`}>
            <p className="font-bold">{triageResult.label}</p>
            <p className="mt-1 text-sm">{triageResult.action}</p>
            <p className="mt-2 text-xs font-bold">Selected flags: {triageResult.score}</p>
          </div>
        </ToolCard>

        <ToolCard icon={Activity} title="Vitals Safety Scan">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Systolic">
              <input className={inputClasses} type="number" value={vitals.systolic} onChange={setField(setVitals, "systolic")} />
            </Field>
            <Field label="Diastolic">
              <input className={inputClasses} type="number" value={vitals.diastolic} onChange={setField(setVitals, "diastolic")} />
            </Field>
            <Field label="Pulse">
              <input className={inputClasses} type="number" value={vitals.pulse} onChange={setField(setVitals, "pulse")} />
            </Field>
            <Field label="Resp/min">
              <input className={inputClasses} type="number" value={vitals.respiration} onChange={setField(setVitals, "respiration")} />
            </Field>
            <Field label="Temp C">
              <input className={inputClasses} type="number" step="0.1" value={vitals.temperature} onChange={setField(setVitals, "temperature")} />
            </Field>
            <Field label="SpO2 %">
              <input className={inputClasses} type="number" value={vitals.spo2} onChange={setField(setVitals, "spo2")} />
            </Field>
            <Field label="Glucose mg/dL">
              <input className={inputClasses} type="number" value={vitals.glucose} onChange={setField(setVitals, "glucose")} />
            </Field>
            <Field label="Pain 0-10">
              <input className={inputClasses} type="number" min="0" max="10" value={vitals.pain} onChange={setField(setVitals, "pain")} />
            </Field>
          </div>
          <div className={`mt-4 rounded-lg border p-4 ${toneClasses[vitalsScan.tone]}`}>
            <p className="font-bold">{vitalsScan.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {vitalsScan.warnings.map((warning) => (
                <span key={warning} className="rounded-md bg-white/70 px-2 py-1 text-xs font-bold">
                  {warning}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ResultPill tone={bpCategory.tone}>{bpCategory.label}</ResultPill>
            <ResultPill tone={numberValue(vitals.spo2) < 94 ? "amber" : "emerald"}>SpO2 {vitals.spo2 || 0}%</ResultPill>
            <ResultPill tone={numberValue(vitals.temperature) >= 38 ? "amber" : "emerald"}>Temp {vitals.temperature || 0} C</ResultPill>
            <ResultPill tone={numberValue(vitals.glucose) < 70 || numberValue(vitals.glucose) > 250 ? "amber" : "emerald"}>
              Glucose {vitals.glucose || 0} mg/dL
            </ResultPill>
          </div>
        </ToolCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ToolCard icon={Calculator} title="Body Calculators">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Height cm">
              <input className={inputClasses} type="number" value={body.heightCm} onChange={setField(setBody, "heightCm")} />
            </Field>
            <Field label="Weight kg">
              <input className={inputClasses} type="number" value={body.weightKg} onChange={setField(setBody, "weightKg")} />
            </Field>
            <Field label="Age">
              <input className={inputClasses} type="number" value={body.age} onChange={setField(setBody, "age")} />
            </Field>
            <Field label="Sex">
              <select className={inputClasses} value={body.sex} onChange={setField(setBody, "sex")}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Creatinine mg/dL">
              <input className={inputClasses} type="number" step="0.1" value={body.creatinine} onChange={setField(setBody, "creatinine")} />
            </Field>
            <Field label="Activity">
              <select className={inputClasses} value={body.activity} onChange={setField(setBody, "activity")}>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 grid gap-2">
            <ResultPill tone={bodyResults.bmiCategory.tone}>BMI {round(bodyResults.bmi)} - {bodyResults.bmiCategory.label}</ResultPill>
            <ResultPill tone="blue">BSA {round(bodyResults.bsa, 2)} m2</ResultPill>
            <ResultPill tone="teal">Water target {Math.round(bodyResults.hydrationMl || 0)} mL/day</ResultPill>
            <ResultPill tone={bodyResults.crcl && bodyResults.crcl < 60 ? "amber" : "emerald"}>CrCl estimate {round(bodyResults.crcl)} mL/min</ResultPill>
            <p className="text-xs font-semibold text-slate-500">
              Healthy BMI weight band: {round(bodyResults.healthyLow)}-{round(bodyResults.healthyHigh)} kg.
            </p>
          </div>
        </ToolCard>

        <ToolCard icon={Pill} title="Medication Planner">
          <div className="grid gap-3">
            <Field label="Medicine">
              <input className={inputClasses} value={medPlan.name} onChange={setField(setMedPlan, "name")} placeholder="Medicine name" />
            </Field>
            <Field label="Dose">
              <input className={inputClasses} value={medPlan.dose} onChange={setField(setMedPlan, "dose")} placeholder="500 mg" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Times/day">
                <input className={inputClasses} type="number" min="1" max="6" value={medPlan.timesPerDay} onChange={setField(setMedPlan, "timesPerDay")} />
              </Field>
              <Field label="First dose">
                <input className={inputClasses} type="time" value={medPlan.startTime} onChange={setField(setMedPlan, "startTime")} />
              </Field>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {scheduleTimes.map((time) => (
              <span key={time} className="rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                {time}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Allergy text check">
              <input className={inputClasses} value={medicineCheck} onChange={(event) => setMedicineCheck(event.target.value)} placeholder="Type planned medicine" />
            </Field>
            <p className={`mt-2 rounded-md border px-3 py-2 text-sm font-bold ${toneClasses[allergyMatches.length ? "red" : "emerald"]}`}>
              {allergyMatches.length ? `Matches recorded allergy: ${allergyMatches.join(", ")}` : "No exact allergy text match found."}
            </p>
          </div>
        </ToolCard>

        <ToolCard icon={Droplets} title="Blood Compatibility">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Donor group">
              <select className={inputClasses} value={blood.donor} onChange={setField(setBlood, "donor")}>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </Field>
            <Field label="Recipient group">
              <select className={inputClasses} value={blood.recipient} onChange={setField(setBlood, "recipient")}>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className={`mt-4 rounded-lg border p-4 ${toneClasses[bloodCompatible ? "emerald" : "red"]}`}>
            <p className="font-bold">{bloodCompatible ? "Compatible for red-cell donation" : "Not compatible for red-cell donation"}</p>
            <p className="mt-2 text-sm">Recipient {blood.recipient} can receive from: {canReceiveFrom.join(", ")}</p>
          </div>
        </ToolCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ToolCard
          icon={Timer}
          title="CPR And FAST Tools"
          action={
            <button
              type="button"
              onClick={() => setMetronome((current) => ({ ...current, running: !current.running }))}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              {metronome.running ? "Pause" : "Start 110 BPM"}
            </button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-950">Compression pace</p>
              <div className="mt-3 flex items-center gap-4">
                <div className={`h-16 w-16 rounded-full ${metronome.beats % 2 ? "bg-red-600" : "bg-red-100"}`} />
                <div>
                  <p className="text-3xl font-black text-slate-950">{metronome.beats}</p>
                  <p className="text-xs font-semibold text-slate-500">Target 100-120/min</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold text-slate-950">FAST stroke screen</p>
              <div className="mt-3 space-y-2">
                <CheckRow label="Face drooping" checked={fast.face} onChange={(event) => setFast((current) => ({ ...current, face: event.target.checked }))} />
                <CheckRow label="Arm weakness" checked={fast.arm} onChange={(event) => setFast((current) => ({ ...current, arm: event.target.checked }))} />
                <CheckRow label="Speech difficulty" checked={fast.speech} onChange={(event) => setFast((current) => ({ ...current, speech: event.target.checked }))} />
              </div>
              <p className={`mt-3 rounded-md border px-3 py-2 text-sm font-bold ${toneClasses[fastPositive ? "red" : "emerald"]}`}>
                {fastPositive ? "Call emergency services immediately." : "No FAST sign selected."}
              </p>
            </div>
          </div>
        </ToolCard>

        <ToolCard icon={ListChecks} title="First-Aid Protocol Library">
          <Field label="Situation">
            <select className={inputClasses} value={selectedProtocol} onChange={(event) => setSelectedProtocol(event.target.value)}>
              {Object.entries(FIRST_AID_PROTOCOLS).map(([key, protocol]) => (
                <option key={key} value={key}>{protocol.label}</option>
              ))}
            </select>
          </Field>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <p className="font-bold">{FIRST_AID_PROTOCOLS[selectedProtocol].action}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm font-semibold">
              {FIRST_AID_PROTOCOLS[selectedProtocol].steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </ToolCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ToolCard
          icon={MessageSquareText}
          title="Emergency Message"
          action={
            <button
              type="button"
              onClick={requestLocation}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Attach GPS
            </button>
          }
        >
          <textarea className={`${inputClasses} min-h-32`} value={emergencyMessage} readOnly />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copyEmergencyMessage}
              className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy message
            </button>
            {copyMessage ? <span className="text-sm font-bold text-emerald-700">{copyMessage}</span> : null}
          </div>
        </ToolCard>

        <ToolCard icon={Stethoscope} title="Ambulance Call Script">
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-bold">Patient:</span> {profile?.fullName || "not recorded"}</p>
            <p><span className="font-bold">Phone:</span> {profile?.phone || "not recorded"}</p>
            <p><span className="font-bold">Blood:</span> {medicalProfile.bloodGroup || "not recorded"}</p>
            <p><span className="font-bold">Allergies:</span> {listText(allergies)}</p>
            <p><span className="font-bold">Medicines:</span> {listText(medications)}</p>
            <p><span className="font-bold">Doctor:</span> {medicalProfile.physicianName || "not recorded"} {medicalProfile.physicianPhone || ""}</p>
            <p><span className="font-bold">Address:</span> {medicalProfile.address || "not recorded"}</p>
          </div>
          <button
            type="button"
            onClick={copyCallScript}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy script
          </button>
        </ToolCard>

        <ToolCard icon={FileText} title="ICE And Document Readiness">
          <div className="mb-3 flex items-center justify-between gap-3">
            <ResultPill tone={documentReady >= 6 ? "emerald" : "amber"}>{documentReady}/{documentChecks.length} ready</ResultPill>
            <ResultPill tone="blue">{recordSummary?.totalRecords || 0} records</ResultPill>
          </div>
          <div className="space-y-2">
            {documentChecks.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                {item.ready ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </ToolCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ToolCard icon={CalendarDays} title="Vaccination Checklist">
          <div className="mb-3">
            <ResultPill tone={vaccineProgress >= 6 ? "emerald" : "amber"}>{vaccineProgress}/{VACCINE_ITEMS.length} tracked</ResultPill>
          </div>
          <div className="grid gap-2">
            {VACCINE_ITEMS.map((item) => (
              <CheckRow
                key={item}
                label={item}
                checked={vaccines[item]}
                onChange={(event) => setVaccines((current) => ({ ...current, [item]: event.target.checked }))}
              />
            ))}
          </div>
        </ToolCard>

        <ToolCard icon={ClipboardCheck} title="Travel And ER Kit">
          <div className="mb-3">
            <ResultPill tone={kitProgress >= 6 ? "emerald" : "amber"}>{kitProgress}/{KIT_ITEMS.length} packed</ResultPill>
          </div>
          <div className="grid gap-2">
            {KIT_ITEMS.map((item) => (
              <CheckRow
                key={item}
                label={item}
                checked={kit[item]}
                onChange={(event) => setKit((current) => ({ ...current, [item]: event.target.checked }))}
              />
            ))}
          </div>
        </ToolCard>

        <ToolCard icon={ShieldCheck} title="Fall-Risk Screener">
          <div className="grid gap-2">
            {[
              ["falls", "Fall in last 12 months"],
              ["dizziness", "Dizziness or fainting"],
              ["mobility", "Walking or balance difficulty"],
              ["vision", "Vision concern"],
              ["sedatingMeds", "Sedating medicine"]
            ].map(([key, label]) => (
              <CheckRow
                key={key}
                label={label}
                checked={fallRisk[key]}
                onChange={(event) => setFallRisk((current) => ({ ...current, [key]: event.target.checked }))}
              />
            ))}
          </div>
          <div className={`mt-4 rounded-lg border p-4 ${toneClasses[fallRiskResult.tone]}`}>
            <p className="font-bold">{fallRiskResult.label}</p>
            <p className="mt-1 text-sm">Score {fallRiskScore}. Age 65+ adds one flag.</p>
          </div>
        </ToolCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ToolCard icon={Thermometer} title="Symptom Diary">
          <div className="grid gap-3 sm:grid-cols-[1fr_0.35fr]">
            <Field label="Symptom">
              <input className={inputClasses} value={symptomEntry.symptom} onChange={setField(setSymptomEntry, "symptom")} placeholder="Fever, cough, dizziness" />
            </Field>
            <Field label="Severity">
              <input className={inputClasses} type="number" min="0" max="10" value={symptomEntry.severity} onChange={setField(setSymptomEntry, "severity")} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea className={`${inputClasses} min-h-20`} value={symptomEntry.notes} onChange={setField(setSymptomEntry, "notes")} />
          </Field>
          <button
            type="button"
            onClick={addSymptom}
            className="mt-3 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800"
          >
            Add entry
          </button>
          <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
            {symptomLog.map((entry) => (
              <article key={entry.id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-bold text-slate-950">{entry.symptom} - severity {entry.severity}/10</p>
                <p className="text-xs font-semibold text-slate-500">{entry.createdAt}</p>
                {entry.notes ? <p className="mt-1 text-sm text-slate-600">{entry.notes}</p> : null}
              </article>
            ))}
            {!symptomLog.length ? <p className="text-sm text-slate-500">No symptom entries yet.</p> : null}
          </div>
        </ToolCard>

        <ToolCard icon={HeartPulse} title="Pain Trend Tracker">
          <div className="grid gap-3 sm:grid-cols-[0.4fr_1fr]">
            <Field label="Pain score">
              <input className={inputClasses} type="number" min="0" max="10" value={vitals.pain} onChange={setField(setVitals, "pain")} />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addPainReading}
                className="rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-800"
              >
                Log pain
              </button>
            </div>
          </div>
          <div className="mt-5 flex h-28 items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {painLog.length ? (
              painLog
                .slice()
                .reverse()
                .map((entry) => (
                  <div key={entry.id} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <div
                      className="w-full rounded-t bg-red-500"
                      style={{ height: `${Math.max(8, entry.value * 8)}px` }}
                      title={`${entry.value}/10`}
                    />
                    <span className="text-[10px] font-bold text-slate-500">{entry.value}</span>
                  </div>
                ))
            ) : (
              <p className="self-center text-sm text-slate-500">Pain readings will appear here.</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {painLog.slice(0, 5).map((entry) => (
              <ResultPill key={entry.id} tone={entry.value >= 7 ? "red" : entry.value >= 4 ? "amber" : "emerald"}>
                {entry.createdAt}: {entry.value}/10
              </ResultPill>
            ))}
          </div>
        </ToolCard>
      </div>
    </div>
  );
};

export default MedicalTools;
