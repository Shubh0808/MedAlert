import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Building2,
  FileText,
  Plus,
  Siren,
  Trash2,
  Users
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import api from "../../api/client.js";
import FormField, { inputClasses } from "../../components/FormField.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatBytes, formatDateTime } from "../../utils/format.js";

const tabs = ["overview", "users", "emergencies", "records", "hospitals"];

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      latitude: "",
      longitude: "",
      services: "Emergency, ICU, Ambulance"
    }
  });

  const dashboard = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => (await api.get("/admin/dashboard")).data
  });
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get("/admin/users")).data
  });
  const alerts = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => (await api.get("/admin/alerts")).data,
    refetchInterval: 20000
  });
  const records = useQuery({
    queryKey: ["admin-records"],
    queryFn: async () => (await api.get("/admin/records")).data
  });
  const hospitals = useQuery({
    queryKey: ["admin-hospitals"],
    queryFn: async () => (await api.get("/hospitals")).data
  });

  const createHospital = useMutation({
    mutationFn: async (values) =>
      (
        await api.post("/hospitals", {
          ...values,
          latitude: Number(values.latitude),
          longitude: Number(values.longitude),
          services: values.services.split(",").map((item) => item.trim()).filter(Boolean)
        })
      ).data,
    onSuccess: async () => {
      reset();
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["admin-hospitals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
    onError: (err) => setError(err.message)
  });

  const deleteHospital = useMutation({
    mutationFn: async (id) => (await api.delete(`/hospitals/${id}`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-hospitals"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    }
  });

  const stats = dashboard.data?.stats || {};
  const userRows = users.data?.users || [];
  const alertRows = alerts.data?.alerts || [];
  const recordRows = records.data?.records || [];
  const hospitalRows = hospitals.data?.hospitals || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-300">Admin Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold text-white">Operations Monitor</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "rounded-md px-3 py-2 text-sm font-bold capitalize",
                activeTab === tab
                  ? "bg-white text-slate-950"
                  : "bg-white/10 text-slate-200 hover:bg-white/15"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={stats.totalUsers ?? 0} icon={Users} tone="blue" />
            <StatCard label="Active Emergencies" value={stats.activeEmergencies ?? 0} icon={Siren} tone="red" />
            <StatCard label="Records Uploaded" value={stats.totalRecordsUploaded ?? 0} icon={FileText} tone="teal" />
            <StatCard label="Registered Hospitals" value={stats.registeredHospitals ?? 0} icon={Building2} tone="amber" />
          </div>

          <section className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-soft">
            <h2 className="text-lg font-bold">Recent Emergency Requests</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard.data?.recentEmergencies || []).map((alert) => (
                    <tr key={alert._id}>
                      <td className="px-3 py-4 font-semibold">{alert.user?.fullName || "Unknown"}</td>
                      <td className="px-3 py-4 text-slate-600">{formatDateTime(alert.createdAt)}</td>
                      <td className="px-3 py-4"><StatusBadge status={alert.status} /></td>
                      <td className="px-3 py-4 text-slate-600">{alert.latitude}, {alert.longitude}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "users" ? (
        <DataTable
          title="User Management"
          columns={["Name", "Email", "Role", "Blood Group", "Joined"]}
          rows={userRows.map((user) => [
            user.fullName,
            user.email,
            user.role,
            user.medicalProfile?.bloodGroup || "Not set",
            formatDateTime(user.createdAt)
          ])}
        />
      ) : null}

      {activeTab === "emergencies" ? (
        <section className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-soft">
          <h2 className="text-lg font-bold">Emergency Monitoring</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Coordinates</th>
                  <th className="px-3 py-3">Contacts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alertRows.map((alert) => (
                  <tr key={alert._id}>
                    <td className="px-3 py-4 font-semibold">{alert.user?.fullName || "Unknown"}</td>
                    <td className="px-3 py-4 text-slate-600">{formatDateTime(alert.createdAt)}</td>
                    <td className="px-3 py-4"><StatusBadge status={alert.status} /></td>
                    <td className="px-3 py-4 text-slate-600">{alert.latitude}, {alert.longitude}</td>
                    <td className="px-3 py-4 text-slate-600">{alert.notifiedContacts?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "records" ? (
        <DataTable
          title="Uploaded Medical Records"
          columns={["Title", "User", "Category", "Size", "Uploaded"]}
          rows={recordRows.map((record) => [
            record.title,
            record.user?.fullName || "Unknown",
            record.category?.replace("_", " "),
            formatBytes(record.size),
            formatDateTime(record.createdAt)
          ])}
        />
      ) : null}

      {activeTab === "hospitals" ? (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-soft">
            <h2 className="text-lg font-bold">Add Hospital</h2>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit((values) => createHospital.mutate(values))}>
              <FormField label="Hospital name">
                <input className={inputClasses} required {...register("name")} />
              </FormField>
              <FormField label="Phone">
                <input className={inputClasses} {...register("phone")} />
              </FormField>
              <FormField label="Address">
                <textarea className={`${inputClasses} min-h-20`} required {...register("address")} />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Latitude">
                  <input className={inputClasses} required type="number" step="any" {...register("latitude")} />
                </FormField>
                <FormField label="Longitude">
                  <input className={inputClasses} required type="number" step="any" {...register("longitude")} />
                </FormField>
              </div>
              <FormField label="Services">
                <input className={inputClasses} {...register("services")} />
              </FormField>
              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={createHospital.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {createHospital.isPending ? "Saving..." : "Add hospital"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-soft">
            <h2 className="text-lg font-bold">Hospital Listings</h2>
            <div className="mt-4 space-y-3">
              {hospitalRows.map((hospital) => (
                <div key={hospital._id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{hospital.name}</p>
                      <p className="text-sm text-slate-500">{hospital.address}</p>
                      <p className="mt-1 text-xs text-slate-500">{hospital.latitude}, {hospital.longitude}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteHospital.mutate(hospital._id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                      title="Deactivate hospital"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
};

const DataTable = ({ title, columns, rows }) => (
  <section className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-soft">
    <h2 className="text-lg font-bold">{title}</h2>
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr className="text-left text-xs font-bold uppercase tracking-normal text-slate-500">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-3 py-4 text-slate-700 first:font-semibold first:text-slate-950">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default AdminDashboard;
