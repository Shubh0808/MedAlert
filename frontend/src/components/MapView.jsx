import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client.js";
import { mapsDirectionsUrl, mapsSearchUrl } from "../utils/format.js";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js";

let googleMapsLoader;

const toFiniteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toLatLng = (value) => {
  if (Array.isArray(value)) {
    const lat = toFiniteNumber(value[0]);
    const lng = toFiniteNumber(value[1]);
    return lat === null || lng === null ? DEFAULT_CENTER : { lat, lng };
  }

  if (value && typeof value === "object") {
    const lat = toFiniteNumber(value.lat ?? value.latitude);
    const lng = toFiniteNumber(value.lng ?? value.longitude);
    return lat === null || lng === null ? DEFAULT_CENTER : { lat, lng };
  }

  return DEFAULT_CENTER;
};

const normalizeMarker = (marker) => {
  const lat = toFiniteNumber(marker?.lat ?? marker?.latitude);
  const lng = toFiniteNumber(marker?.lng ?? marker?.longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return {
    ...marker,
    lat,
    lng,
    title: marker.title || "Location",
    description: marker.description || "",
    directionsUrl: marker.directionsUrl || mapsDirectionsUrl(lat, lng)
  };
};

const getMarkerTone = (marker) => {
  const id = String(marker.id || "").toLowerCase();
  const title = String(marker.title || "").toLowerCase();

  if (marker.kind) return marker.kind;
  if (id.includes("me") || id.includes("current") || title.includes("your location")) return "user";
  if (title.includes("sos") || title.includes("alert") || title.includes("emergency")) return "alert";
  return "hospital";
};

const markerIcon = (maps, marker) => {
  const tone = getMarkerTone(marker);
  const colors = {
    user: "#2563eb",
    alert: "#dc2626",
    hospital: "#0f766e"
  };

  return {
    path: maps.SymbolPath.CIRCLE,
    scale: tone === "alert" ? 10 : 8,
    fillColor: colors[tone] || colors.hospital,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3
  };
};

const buildInfoWindow = (marker) => {
  const content = document.createElement("div");
  content.className = "max-w-xs space-y-2 pr-2";

  const title = document.createElement("p");
  title.className = "font-semibold text-slate-950";
  title.textContent = marker.title;
  content.appendChild(title);

  if (marker.description) {
    const description = document.createElement("p");
    description.className = "text-xs leading-5 text-slate-600";
    description.textContent = marker.description;
    content.appendChild(description);
  }

  const coordinates = document.createElement("p");
  coordinates.className = "text-[11px] font-semibold text-slate-500";
  coordinates.textContent = `${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`;
  content.appendChild(coordinates);

  const link = document.createElement("a");
  link.className = "inline-flex rounded-md bg-teal-700 px-2.5 py-1.5 text-xs font-bold text-white";
  link.href = marker.directionsUrl || mapsSearchUrl(marker.lat, marker.lng);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Open directions";
  content.appendChild(link);

  return content;
};

const loadGoogleMaps = (apiKey) => {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(window.google.maps), { once: true });
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
    document.head.appendChild(script);
  });

  return googleMapsLoader;
};

const useGoogleMapsApiKey = () => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [apiKey, setApiKey] = useState(envKey);
  const [status, setStatus] = useState(envKey ? "ready" : "loading");

  useEffect(() => {
    if (envKey) {
      setStatus("ready");
      return undefined;
    }

    let isMounted = true;

    api
      .get("/public/maps-config")
      .then((response) => {
        if (!isMounted) return;
        const backendKey = response.data?.googleMapsApiKey || "";
        setApiKey(backendKey);
        setStatus(backendKey ? "ready" : "missing");
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [envKey]);

  return { apiKey, status };
};

const MapView = ({ center, markers = [], zoom = 14, className = "" }) => {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markerRefs = useRef([]);
  const { apiKey, status } = useGoogleMapsApiKey();
  const [isReady, setIsReady] = useState(Boolean(window.google?.maps));
  const [loadError, setLoadError] = useState("");

  const safeCenter = useMemo(() => toLatLng(center), [center]);
  const normalizedMarkers = useMemo(() => markers.map(normalizeMarker).filter(Boolean), [markers]);

  useEffect(() => {
    if (!apiKey || !mapElementRef.current) {
      return undefined;
    }

    let isMounted = true;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!isMounted || !mapElementRef.current) return;

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapElementRef.current, {
            center: safeCenter,
            zoom,
            fullscreenControl: true,
            mapTypeControl: false,
            streetViewControl: false
          });
        }

        setIsReady(true);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error.message || "Google Maps could not load.");
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, safeCenter, zoom]);

  useEffect(() => {
    if (!isReady || !mapRef.current || !window.google?.maps) {
      return undefined;
    }

    const maps = window.google.maps;
    const map = mapRef.current;
    const createdMarkers = [];

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    map.setCenter(safeCenter);
    map.setZoom(zoom);

    if (!infoWindowRef.current) {
      infoWindowRef.current = new maps.InfoWindow();
    }

    const bounds = new maps.LatLngBounds();

    normalizedMarkers.forEach((marker) => {
      const mapMarker = new maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map,
        title: marker.title,
        icon: markerIcon(maps, marker)
      });

      mapMarker.addListener("click", () => {
        infoWindowRef.current.setContent(buildInfoWindow(marker));
        infoWindowRef.current.open({ anchor: mapMarker, map });
      });

      bounds.extend(mapMarker.getPosition());
      createdMarkers.push(mapMarker);
    });

    markerRefs.current = createdMarkers;

    if (!center && normalizedMarkers.length > 1) {
      map.fitBounds(bounds, 80);
    } else if (!center && normalizedMarkers.length === 1) {
      map.setCenter({ lat: normalizedMarkers[0].lat, lng: normalizedMarkers[0].lng });
      map.setZoom(zoom);
    }

    return () => {
      createdMarkers.forEach((marker) => marker.setMap(null));
    };
  }, [center, isReady, normalizedMarkers, safeCenter, zoom]);

  const fallbackMessage =
    status === "loading"
      ? "Loading Google Maps..."
      : status === "missing"
        ? "Add GOOGLE_MAPS_API_KEY in backend/.env to enable Google Maps."
        : loadError || "Google Maps is temporarily unavailable.";

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-slate-100 ${className}`}>
      <div ref={mapElementRef} className={`google-map-canvas h-full min-h-[320px] ${isReady ? "" : "hidden"}`} />
      {!isReady ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-5 text-center">
          <p className="text-sm font-bold text-slate-700">{fallbackMessage}</p>
          {normalizedMarkers.length ? (
            <div className="flex max-w-lg flex-wrap justify-center gap-2">
              {normalizedMarkers.slice(0, 4).map((marker) => (
                <a
                  key={marker.id || `${marker.lat}-${marker.lng}`}
                  href={marker.directionsUrl || mapsSearchUrl(marker.lat, marker.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-teal-700 hover:bg-slate-50"
                >
                  {marker.title}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default MapView;
