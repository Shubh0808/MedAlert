import { useQuery } from "@tanstack/react-query";
import { Download, MapPinned, Search } from "lucide-react";
import { useState } from "react";
import api from "../../api/client.js";
import EmptyState from "../../components/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { downloadCsv, formatDateTime, mapsSearchUrl } from "../../utils/format.js";

const EmergencyHistory = () => {
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["alerts", status, severity, search],
    queryFn: async () =>
      (
        await api.get("/alerts", {
          params: {
            ...(status ? { status } : {}),
            ...(severity ? { severity } : {}),
            ...(search ? { q: search } : {})
          }
        })
      ).data
  });

  const alerts = data?.alerts || [];

  const exportHistory = () => {
    downloadCsv(
      "medalert-emergency-history.csv",
      ["Date and Time", "Status", "Severity", "Latitude", "Longitude", "Notifications", "Notes"],
      alerts.map((alert) => [
        formatDateTime(alert.createdAt),
        alert.status,
        alert.severity,
        alert.latitude,
        alert.longitude,
        alert.notifiedContacts?.length || 0,
        alert.notes || alert.resolutionNotes || ""
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Emergency History</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Previous SOS Alerts</h1>
        </div>
        <button
          type="button"
          onClick={exportHistory}
          disabled={!alerts.length}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-soft hover:bg-slate-100 disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </button>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className="w-full rounded-md border border-slate-300 px-9 py-2 text-sm"
              placeholder="Search notes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={severity} onChange={(event) => setSeverity(event.target.value)}>
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading history...</p> : null}
        {!isLoading && !alerts.length ? (
          <div className="mt-4">
            <EmptyState title="No emergency history" message="Triggered SOS alerts will appear here with status and location." />
          </div>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                <th className="px-3 py-3">Date and Time</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Severity</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Notifications</th>
                <th className="px-3 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={alert._id}>
                  <td className="px-3 py-4 font-semibold text-slate-900">{formatDateTime(alert.createdAt)}</td>
                  <td className="px-3 py-4"><StatusBadge status={alert.status} /></td>
                  <td className="px-3 py-4 capitalize text-slate-600">{alert.severity || "critical"}</td>
                  <td className="px-3 py-4 text-slate-600">
                    <a
                      className="inline-flex items-center gap-2 font-semibold text-teal-700"
                      href={alert.googleMapsUrl || mapsSearchUrl(alert.latitude, alert.longitude)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPinned className="h-4 w-4" aria-hidden="true" />
                      {alert.latitude}, {alert.longitude}
                    </a>
                  </td>
                  <td className="px-3 py-4 text-slate-600">{alert.notifiedContacts?.length || 0}</td>
                  <td className="max-w-xs px-3 py-4 text-slate-600">{alert.notes || alert.resolutionNotes || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default EmergencyHistory;
