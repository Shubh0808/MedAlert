import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Crosshair, HeartPulse, MapPinned } from "lucide-react";
import api from "../../api/client.js";
import MapView from "../../components/MapView.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import { formatDateTime } from "../../utils/format.js";

const SOSPage = () => {
  const queryClient = useQueryClient();
  const { position, loading, error, requestLocation } = useGeolocation({ watch: true });
  const { data } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/alerts")).data,
    refetchInterval: 15000
  });

  const alerts = data?.alerts || [];
  const activeAlert = alerts.find((alert) => alert.status === "active");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!position) {
        throw new Error("Current GPS location is required before triggering SOS.");
      }

      return (
        await api.post("/sos", {
          latitude: position.latitude,
          longitude: position.longitude,
          notes: "SOS triggered from MedAlert web app"
        })
      ).data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id) => (await api.patch(`/alerts/${id}/resolve`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const center = position
    ? [position.latitude, position.longitude]
    : activeAlert
      ? [activeAlert.latitude, activeAlert.longitude]
      : undefined;

  const markers = [
    position
      ? {
          id: "current-location",
          lat: position.latitude,
          lng: position.longitude,
          title: "Current location",
          description: `Accuracy ${Math.round(position.accuracy || 0)} meters`
        }
      : null,
    activeAlert
      ? {
          id: activeAlert._id,
          lat: activeAlert.latitude,
          lng: activeAlert.longitude,
          title: "Active SOS alert",
          description: formatDateTime(activeAlert.createdAt)
        }
      : null
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-700">SOS Emergency</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Emergency Alert Center</h1>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-soft hover:bg-slate-100"
        >
          <Crosshair className="h-4 w-4" aria-hidden="true" />
          Refresh location
        </button>
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-red-200 bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-red-50 text-red-700">
              <HeartPulse className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-950">One-click SOS</h2>
              <p className="text-sm text-slate-500">GPS location is attached to every alert.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !position}
            className="mt-6 flex h-40 w-full items-center justify-center rounded-lg bg-red-600 text-2xl font-black tracking-normal text-white shadow-soft transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {createMutation.isPending ? "SENDING SOS..." : "TRIGGER SOS"}
          </button>

          {loading ? <p className="mt-3 text-sm font-semibold text-slate-600">Reading GPS location...</p> : null}
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          {createMutation.error ? (
            <p className="mt-3 text-sm font-semibold text-red-600">{createMutation.error.message}</p>
          ) : null}
          {position ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Current coordinates</p>
              <p>{position.latitude}, {position.longitude}</p>
              <p>Accuracy {Math.round(position.accuracy || 0)} meters</p>
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Active Emergency Status</h2>
              <p className="text-sm text-slate-500">Location updates refresh while this page is open.</p>
            </div>
            {activeAlert ? <StatusBadge status={activeAlert.status} /> : null}
          </div>
          {activeAlert ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Alert created {formatDateTime(activeAlert.createdAt)}
              </p>
              <p className="mt-1 text-sm text-red-700">
                {activeAlert.notifiedContacts?.length || 0} emergency contacts queued.
              </p>
              <button
                type="button"
                onClick={() => resolveMutation.mutate(activeAlert._id)}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Mark resolved
              </button>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-700">No active emergency.</p>
            </div>
          )}
          <MapView center={center} markers={markers} />
        </div>
      </section>
    </div>
  );
};

export default SOSPage;
