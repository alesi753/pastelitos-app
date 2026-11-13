import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import type { AddressLocation } from './AddressAutocomplete';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  location: AddressLocation;
  onChange: (location: AddressLocation) => void;
  height?: number;
}

function MapClickHandler({ onChange }: Pick<LocationPickerProps, 'onChange'>) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export default function LocationPicker({ location, onChange, height = 280 }: LocationPickerProps) {
  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={17}
      scrollWheelZoom
      style={{ height, width: '100%', borderRadius: '6px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onChange={onChange} />
      <CircleMarker
        center={[location.latitude, location.longitude]}
        radius={9}
        pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc3545', fillOpacity: 1 }}
      />
    </MapContainer>
  );
}
