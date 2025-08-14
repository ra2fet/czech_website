import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';



// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface Location {
  id: number;
  name: string;
  address: string;
  position: [number, number];
}

interface InteractiveMapProps {
  locations: Location[];
  activeLocation: Location | null;
}

const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    console.log('Setting map view:', { center, zoom });
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const InteractiveMap = ({ locations, activeLocation }: InteractiveMapProps) => {
  const [isClient, setIsClient] = useState(false);
  const defaultCenter: [number, number] = [51.505, -0.09]; // London
  const defaultZoom = 2;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Validate center
  const center =
    activeLocation?.position &&
    !isNaN(activeLocation.position[0]) &&
    !isNaN(activeLocation.position[1])
      ? activeLocation.position
      : defaultCenter;
  const zoom = activeLocation ? 13 : defaultZoom;

  console.log('Map center:', center);
  console.log('Locations:', locations);
  console.log('Active location:', activeLocation);

  if (!isClient) return null;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <ChangeView center={center} zoom={zoom} />
     <TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  maxZoom={19}
  minZoom={2}
/>
      {locations
        .filter(
          (location) =>
            location.position &&
            !isNaN(location.position[0]) &&
            !isNaN(location.position[1])
        )
        .map((location) => (
          <Marker key={location.id} position={location.position}>
            <Popup>
              <b>{location.name}</b>
              <br />
              {location.address}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};