import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPinned, Navigation } from "lucide-react";
import api from "../../api/client.js";
import MapView from "../../components/MapView.jsx";
import { useGeolocation } from "../../hooks/useGeolocation.js";

const HospitalFinder = () => {
  const { position, loading, error, requestLocation } = useGeolocation({ watch: false });
  const { data, isLoading } = useQuery({
    queryKey: ["hospitals", position?.latitude, position?.longitude],
    queryFn: async () =>
      (
        await api.get("/hospitals", {
          params: position
            ? {
                lat: position.latitude,
                lng: position.longitude,
                radius: 100
              }
            : {}
        })
      ).data,
    enabled: true
  });

  const hospitals = data?.hospitals || [];
  const center = position ? [position.latitude, position.longitude] : undefined;
  const markers = [
    position
      ? {
          id: "me",
          lat: position.latitude,
          lng: position.longitude,
          title: "Your location",
          description: "Current GPS position"
        }
      : null,
    ...hospitals.map((hospital) => ({
      id: hospital._id,
      lat: hospital.latitude,
      lng: hospital.longitude,
      title: hospital.name,
      description: hospital.distanceKm ? `${hospital.distanceKm} km away` : hospital.address
    }))
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Nearby Hospital Finder</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Hospitals and Directions</h1>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Use my location
        </button>
      </div>

      {loading ? <p className="text-sm font-semibold text-slate-600">Reading location...</p> : null}
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <MapView center={center} markers={markers} className="min-h-[440px]" zoom={position ? 13 : 5} />
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <MapPinned className="h-5 w-5 text-teal-700" aria-hidden="true" />
            Available hospitals
          </h2>
          {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading hospitals...</p> : null}
          <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {hospitals.map((hospital) => (
              <article key={hospital._id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{hospital.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{hospital.address}</p>
                    <p className="mt-2 text-sm font-semibold text-teal-700">
                      {hospital.distanceKm ? `${hospital.distanceKm} km away` : "Distance available after location"}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                    title="Open directions"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hospital.services?.map((service) => (
                    <span key={service} className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {service}
                    </span>
                  ))}
                </div>
              </article>
            ))}
            {!hospitals.length && !isLoading ? (
              <p className="text-sm text-slate-500">No hospitals found. Ask an admin to seed hospital data.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HospitalFinder;
