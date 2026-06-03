import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPinned, Navigation, Phone, Search } from "lucide-react";
import { useState } from "react";
import api from "../../api/client.js";
import MapView from "../../components/MapView.jsx";
import { inputClasses } from "../../components/FormField.jsx";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import { mapsDirectionsUrl } from "../../utils/format.js";

const HospitalFinder = () => {
  const { position, loading, error, requestLocation } = useGeolocation({ watch: false });
  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState(100);
  const [service, setService] = useState("");
  const [capacityStatus, setCapacityStatus] = useState("");
  const [only24x7, setOnly24x7] = useState(false);
  const [onlyAmbulance, setOnlyAmbulance] = useState(false);

  const servicesQuery = useQuery({
    queryKey: ["hospital-services"],
    queryFn: async () => (await api.get("/hospitals/services/list")).data
  });
  const { data, isLoading } = useQuery({
    queryKey: [
      "hospitals",
      position?.latitude,
      position?.longitude,
      search,
      radius,
      service,
      capacityStatus,
      only24x7,
      onlyAmbulance
    ],
    queryFn: async () =>
      (
        await api.get("/hospitals", {
          params: {
            ...(position
              ? {
                  lat: position.latitude,
                  lng: position.longitude,
                  radius
                }
              : {}),
            ...(search ? { q: search } : {}),
            ...(service ? { service } : {}),
            ...(capacityStatus ? { capacityStatus } : {}),
            ...(only24x7 ? { has24x7Emergency: true } : {}),
            ...(onlyAmbulance ? { ambulanceAvailable: true } : {})
          }
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

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              className={`${inputClasses} pl-9`}
              placeholder="Search hospital, area, or service"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select className={inputClasses} value={service} onChange={(event) => setService(event.target.value)}>
            <option value="">All services</option>
            {(servicesQuery.data?.services || []).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select className={inputClasses} value={capacityStatus} onChange={(event) => setCapacityStatus(event.target.value)}>
            <option value="">Any capacity</option>
            <option value="available">Available</option>
            <option value="limited">Limited</option>
            <option value="full">Full</option>
            <option value="unknown">Unknown</option>
          </select>
          <select className={inputClasses} value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
            <option value={250}>250 km</option>
            <option value={500}>500 km</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" checked={only24x7} onChange={(event) => setOnly24x7(event.target.checked)} />
            24x7 emergency
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" checked={onlyAmbulance} onChange={(event) => setOnlyAmbulance(event.target.checked)} />
            Ambulance available
          </label>
          <span>{hospitals.length} hospitals shown</span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <MapView center={center} markers={markers} className="min-h-[440px]" zoom={position ? 13 : 5} />
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <MapPinned className="h-5 w-5 text-teal-700" aria-hidden="true" />
            Available hospitals
          </h2>
          {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading hospitals...</p> : null}
          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {hospitals.map((hospital) => (
              <article key={hospital._id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{hospital.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{hospital.address}</p>
                    <p className="mt-2 text-sm font-semibold text-teal-700">
                      {hospital.distanceKm ? `${hospital.distanceKm} km away` : "Distance available after location"}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-normal text-slate-500">
                      Capacity: {hospital.capacityStatus || "unknown"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {(hospital.emergencyPhone || hospital.phone) ? (
                      <a
                        href={`tel:${hospital.emergencyPhone || hospital.phone}`}
                        className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                        title="Call hospital"
                      >
                        <Phone className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    <a
                      href={mapsDirectionsUrl(hospital.latitude, hospital.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                      title="Open directions"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hospital.has24x7Emergency ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                      24x7
                    </span>
                  ) : null}
                  {hospital.ambulanceAvailable ? (
                    <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                      Ambulance
                    </span>
                  ) : null}
                  {hospital.services?.map((item) => (
                    <span key={item} className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {item}
                    </span>
                  ))}
                </div>
                {hospital.notes ? <p className="mt-3 text-sm text-slate-600">{hospital.notes}</p> : null}
              </article>
            ))}
            {!hospitals.length && !isLoading ? (
              <p className="text-sm text-slate-500">No hospitals match these filters.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HospitalFinder;
