import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

const ChangeView = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const MapView = ({ center, markers = [], zoom = 14, className = "" }) => {
  const safeCenter = center || [20.5937, 78.9629];

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 ${className}`}>
      <MapContainer center={safeCenter} zoom={zoom} scrollWheelZoom className="h-full min-h-[320px]">
        <ChangeView center={safeCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker key={marker.id || `${marker.lat}-${marker.lng}`} position={[marker.lat, marker.lng]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-slate-900">{marker.title}</p>
                {marker.description ? (
                  <p className="text-xs text-slate-600">{marker.description}</p>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
