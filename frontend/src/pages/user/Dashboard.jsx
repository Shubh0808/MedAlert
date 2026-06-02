import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ContactRound, FileText, HeartPulse, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/client.js";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { formatDateTime, listText } from "../../utils/format.js";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/profile")).data
  });
  const { data: alertsData } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/alerts")).data
  });
  const { data: recordsData } = useQuery({
    queryKey: ["records"],
    queryFn: async () => (await api.get("/records")).data
  });

  const alerts = alertsData?.alerts || [];
  const activeAlert = alerts.find((alert) => alert.status === "active");
  const profile = profileData?.profile || user;
  const contacts = profileData?.contacts || [];
  const records = recordsData?.records || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Welcome back</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{profile?.fullName}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Blood group {profile?.medicalProfile?.bloodGroup || "not set"} · Allergies{" "}
            {listText(profile?.medicalProfile?.allergies)}
          </p>
        </div>
        <Link
          to="/app/sos"
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-red-700"
        >
          <HeartPulse className="h-5 w-5" aria-hidden="true" />
          Trigger SOS
        </Link>
      </div>

      {activeAlert ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Active emergency alert
              </p>
              <p className="mt-1 text-sm text-red-700">
                Created {formatDateTime(activeAlert.createdAt)} at {activeAlert.latitude},{" "}
                {activeAlert.longitude}
              </p>
            </div>
            <StatusBadge status={activeAlert.status} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Emergency Contacts" value={contacts.length} icon={ContactRound} tone="teal" />
        <StatCard label="SOS Alerts" value={alerts.length} icon={HeartPulse} tone="red" />
        <StatCard label="Medical Records" value={records.length} icon={FileText} tone="blue" />
        <StatCard label="Profile Status" value={profile?.medicalProfile?.bloodGroup ? "Ready" : "Review"} icon={MapPinned} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Recent Emergencies</h2>
            <Link to="/app/history" className="text-sm font-semibold text-teal-700">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {alerts.slice(0, 4).map((alert) => (
              <div key={alert._id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{formatDateTime(alert.createdAt)}</p>
                  <p className="text-xs text-slate-500">{alert.latitude}, {alert.longitude}</p>
                </div>
                <StatusBadge status={alert.status} />
              </div>
            ))}
            {!alerts.length ? <p className="text-sm text-slate-500">No SOS alerts recorded yet.</p> : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">Emergency Contacts</h2>
            <Link to="/app/contacts" className="text-sm font-semibold text-teal-700">
              Manage
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {contacts.slice(0, 4).map((contact) => (
              <div key={contact._id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.relation} · {contact.phone}</p>
                </div>
                {contact.isPrimary ? (
                  <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">
                    Primary
                  </span>
                ) : null}
              </div>
            ))}
            {!contacts.length ? <p className="text-sm text-slate-500">Add contacts before using SOS.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
