import { useQuery } from "@tanstack/react-query";
import { MapPinned } from "lucide-react";
import api from "../../api/client.js";
import EmptyState from "../../components/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/format.js";

const EmergencyHistory = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/alerts")).data
  });

  const alerts = data?.alerts || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-teal-700">Emergency History</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Previous SOS Alerts</h1>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        {isLoading ? <p className="text-sm text-slate-500">Loading history...</p> : null}
        {!isLoading && !alerts.length ? (
          <EmptyState title="No emergency history" message="Triggered SOS alerts will appear here with status and location." />
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-normal text-slate-500">
                <th className="px-3 py-3">Date and Time</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Location</th>
                <th className="px-3 py-3">Notifications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={alert._id}>
                  <td className="px-3 py-4 font-semibold text-slate-900">{formatDateTime(alert.createdAt)}</td>
                  <td className="px-3 py-4"><StatusBadge status={alert.status} /></td>
                  <td className="px-3 py-4 text-slate-600">
                    <a
                      className="inline-flex items-center gap-2 font-semibold text-teal-700"
                      href={`https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPinned className="h-4 w-4" aria-hidden="true" />
                      {alert.latitude}, {alert.longitude}
                    </a>
                  </td>
                  <td className="px-3 py-4 text-slate-600">{alert.notifiedContacts?.length || 0}</td>
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
