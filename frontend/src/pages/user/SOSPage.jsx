import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Crosshair,
  HeartPulse,
  MapPinned,
  RefreshCcw,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import api from "../../api/client.js";
import MapView from "../../components/MapView.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import { formatDateTime, mapsDirectionsUrl, mapsSearchUrl } from "../../utils/format.js";

const SOSPage = () => {
  const queryClient = useQueryClient();
  const { position, loading, error, requestLocation } = useGeolocation({ watch: true });
  const [severity, setSeverity] = useState("critical");
  const [notes, setNotes] = useState("SOS triggered from MedAlert web app");
  const [message, setMessage] = useState("");

  const { data } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => (await api.get("/alerts")).data,
    refetchInterval: 15000
  });
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await api.get("/profile")).data
  });
  const { data: nearbyHospitalData, isLoading: hospitalsLoading } = useQuery({
    queryKey: ["sos-nearest-hospitals", position?.latitude, position?.longitude],
    queryFn: async () =>
      (
        await api.get("/hospitals", {
          params: {
            lat: position.latitude,
            lng: position.longitude,
            radius: 50
          }
        })
      ).data,
    enabled: Boolean(position)
  });

  const alerts = data?.alerts || [];
  const activeAlert = alerts.find((alert) => alert.status === "active");
  const contacts = profileData?.contacts || [];
  const readiness = profileData?.profileCompleteness;
  const nearestHospital = activeAlert?.nearestHospital || nearbyHospitalData?.hospitals?.[0];

  const emergencyMessage = useMemo(() => {
    const coordinates = activeAlert
      ? `${activeAlert.latitude}, ${activeAlert.longitude}`
      : position
        ? `${position.latitude}, ${position.longitude}`
        : "Location pending";
    const link = activeAlert
      ? activeAlert.googleMapsUrl || mapsSearchUrl(activeAlert.latitude, activeAlert.longitude)
      : position
        ? mapsSearchUrl(position.latitude, position.longitude)
        : "";

    const hospitalText = nearestHospital
      ? `Nearest hospital: ${nearestHospital.name} (${nearestHospital.distanceKm} km). Phone: ${nearestHospital.emergencyPhone || nearestHospital.phone || "not listed"}.`
      : "Nearest hospital not identified yet.";
    const contactsText = contacts.length
      ? `Emergency contacts: ${contacts.map((contact) => `${contact.name} ${contact.phone}`).join("; ")}.`
      : "No emergency contacts saved.";

    return `MedAlert SOS: ${profileData?.profile?.fullName || "User"} needs help. Severity: ${activeAlert?.severity || severity}. Location: ${coordinates}. ${link} ${hospitalText} ${contactsText}`;
  }, [activeAlert, contacts, nearestHospital, position, profileData?.profile?.fullName, severity]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!position) {
        throw new Error("Current GPS location is required before triggering SOS.");
      }

      return (
        await api.post("/sos", {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy,
          severity,
          notes
        })
      ).data;
    },
    onSuccess: async () => {
      setMessage("SOS alert created. Emergency contacts and nearest hospital notification queued.");
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id) =>
      (await api.patch(`/alerts/${id}/resolve`, { resolutionNotes: "Resolved from SOS center" })).data,
    onSuccess: async () => {
      setMessage("Emergency marked as resolved.");
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) =>
      (await api.patch(`/alerts/${id}/cancel`, { resolutionNotes: "Cancelled from SOS center" })).data,
    onSuccess: async () => {
      setMessage("Emergency alert cancelled.");
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (id) => {
      if (!position) {
        throw new Error("Current GPS location is required.");
      }

      return (
        await api.patch(`/alerts/${id}/location`, {
          latitude: position.latitude,
          longitude: position.longitude,
          accuracyMeters: position.accuracy,
          notes
        })
      ).data;
    },
    onSuccess: async () => {
      setMessage("Active alert location updated.");
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    }
  });

  const copyEmergencyMessage = async () => {
    await navigator.clipboard.writeText(emergencyMessage);
    setMessage("Emergency message copied.");
  };

  const smsUrl = (phone) => `sms:${phone}?&body=${encodeURIComponent(emergencyMessage)}`;

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
              <p className="text-sm text-slate-500">GPS location and severity are attached to every alert.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Severity</span>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" value={severity} onChange={(event) => setSeverity(event.target.value)}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
              </select>
            </label>
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-950">Contact readiness</p>
              <p className="text-slate-600">{contacts.length} contacts - profile {readiness?.percent ?? 0}% ready</p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">Responder notes</span>
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
            />
          </label>

          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !position || Boolean(activeAlert)}
            className="mt-6 flex h-40 w-full items-center justify-center rounded-lg bg-red-600 text-2xl font-black tracking-normal text-white shadow-soft transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
          >
            {createMutation.isPending ? "SENDING SOS..." : activeAlert ? "SOS ACTIVE" : "TRIGGER SOS"}
          </button>

          {loading ? <p className="mt-3 text-sm font-semibold text-slate-600">Reading GPS location...</p> : null}
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
          {createMutation.error || updateLocationMutation.error ? (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {createMutation.error?.message || updateLocationMutation.error?.message}
            </p>
          ) : null}
          {message ? <p className="mt-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
          {position ? (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Current coordinates</p>
              <p>{position.latitude}, {position.longitude}</p>
              <p>Accuracy {Math.round(position.accuracy || 0)} meters</p>
            </div>
          ) : null}
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-950">Nearest hospital</p>
            {hospitalsLoading ? <p className="mt-1">Finding nearest hospital...</p> : null}
            {nearestHospital ? (
              <div className="mt-1 space-y-1">
                <p>{nearestHospital.name}</p>
                <p>{nearestHospital.distanceKm} km away</p>
                <p>{nearestHospital.emergencyPhone || nearestHospital.phone || "Phone not listed"}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(nearestHospital.emergencyPhone || nearestHospital.phone) ? (
                    <a
                      href={smsUrl(nearestHospital.emergencyPhone || nearestHospital.phone)}
                      className="rounded-md bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Text hospital
                    </a>
                  ) : null}
                  <a
                    href={
                      nearestHospital.directionsUrl ||
                      mapsDirectionsUrl(nearestHospital.latitude, nearestHospital.longitude)
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Directions
                  </a>
                </div>
              </div>
            ) : !hospitalsLoading ? (
              <p className="mt-1">No nearby hospital found yet.</p>
            ) : null}
          </div>
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
                Severity {activeAlert.severity}. {activeAlert.notifiedContacts?.length || 0} emergency contacts queued.
              </p>
              {activeAlert.nearestHospital ? (
                <p className="mt-1 text-sm text-red-700">
                  Nearest hospital: {activeAlert.nearestHospital.name} ({activeAlert.nearestHospital.distanceKm} km).
                  Hospital alert {activeAlert.hospitalNotification?.status || "queued"}.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateLocationMutation.mutate(activeAlert._id)}
                  disabled={!position || updateLocationMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Update location
                </button>
                <button
                  type="button"
                  onClick={copyEmergencyMessage}
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copy message
                </button>
                {contacts.slice(0, 3).map((contact) => (
                  <a
                    key={contact._id}
                    href={smsUrl(contact.phone)}
                    className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                  >
                    Text {contact.name}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={() => resolveMutation.mutate(activeAlert._id)}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Mark resolved
                </button>
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(activeAlert._id)}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-700">No active emergency.</p>
            </div>
          )}
          <MapView center={center} markers={markers} />
          {activeAlert ? (
            <a
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-700"
              href={activeAlert.googleMapsUrl || mapsSearchUrl(activeAlert.latitude, activeAlert.longitude)}
              target="_blank"
              rel="noreferrer"
            >
              <MapPinned className="h-4 w-4" aria-hidden="true" />
              Open emergency location
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default SOSPage;
