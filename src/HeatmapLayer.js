import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const points = locations.map((loc) => [loc.latitude, loc.longitude, 500]); // lat, lng, intensity
      const heatLayer = L.heatLayer(points, { radius:50, blur: 100 }).addTo(map);

      return () => {
        map.removeLayer(heatLayer);
      };
    }
  }, [locations, map]);

  return null;
};

export default HeatmapLayer;
