import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVkZWNydXplcyIsImEiOiJjbWU2bHR1NmowcmNhMmxuZHQ5ZW1jZHBhIn0.fjXFTjYOlsTz_P1G6UsJEQ";

const Map = ({ height = "h-[60vh]" }: { height?: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-43.1964, -22.9083], // Default: Rio de Janeiro
      zoom: 10,
      pitch: 45,
      bearing: -10,
      cooperativeGestures: true,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    // Disable scroll zoom for smoother page scroll
    mapRef.current.scrollZoom.disable();

    // Subtle fog/atmosphere
    mapRef.current.on("style.load", () => {
      mapRef.current?.setFog({
        color: "rgb(255,255,255)",
        "high-color": "rgb(200,200,225)",
        "horizon-blend": 0.2,
      });
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div
      className={`${height} w-full rounded-lg border bg-card/50 backdrop-blur-sm relative`}
      aria-label="Mapa interativo"
    >
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/10 rounded-lg" />
    </div>
  );
};

export default Map;
