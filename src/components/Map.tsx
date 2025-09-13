import React, { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";

// Fortaleza coordinates
const FORTALEZA_CENTER = { lat: -3.7319, lng: -38.5267 };

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number;
  price_level?: number;
  types: string[];
  photo_reference?: string;
}

const Map = ({ height = "h-[60vh]" }: { height?: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: "AIzaSyBHLett8djBo62dDXj0EjCpF6B2BPng7R4", // Public key for testing
          version: "weekly",
          libraries: ["places"]
        });

        await loader.load();

        // Initialize Google Map centered on Fortaleza
        mapRef.current = new google.maps.Map(mapContainer.current!, {
          center: FORTALEZA_CENTER,
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Load places from Google Places API
        await loadPlaces();

      } catch (error) {
        console.error("Error initializing map:", error);
        // Fallback to showing venues from database
        await loadVenuesFromDB();
      }
    };

    const loadPlaces = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-places', {
          body: { 
            lat: FORTALEZA_CENTER.lat, 
            lng: FORTALEZA_CENTER.lng,
            radius: 10000,
            type: 'restaurant|bar|night_club'
          }
        });

        if (error) throw error;

        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Add markers for each place
        data.places.forEach((place: Place) => {
          addGooglePlaceMarker(place);
        });

      } catch (error) {
        console.error("Error loading places:", error);
        // Fallback to database venues
        await loadVenuesFromDB();
      }
    };

    const loadVenuesFromDB = async () => {
      try {
        const { data: venues } = await supabase
          .from("venues")
          .select("id,name,lat,lng,address,price_range");

        const { data: stats } = await supabase
          .from("venue_stats")
          .select("venue_id,avg_rating,reviews_count");

        const statsMap = new globalThis.Map();
        (stats || []).forEach((s: any) => {
          if (s && s.venue_id) statsMap.set(String(s.venue_id), s);
        });

        // Clear old markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        (venues || []).forEach((v: any) => {
          if (!v || typeof v.lng !== "number" || typeof v.lat !== "number") return;
          const stat = statsMap.get(String(v.id));
          addVenueMarker(v, stat || null);
        });
      } catch (error) {
        console.error("Error loading venues from database:", error);
      }
    };

    const addGooglePlaceMarker = (place: Place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapRef.current!,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#FF6B6B",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="min-width: 220px; max-width: 260px; font-size: 14px;">
            <h3 style="font-weight: 600; margin: 0;">${place.name}</h3>
            <div style="margin-top: 4px; font-size: 12px; color: #666;">
              ${place.rating ? `${place.rating.toFixed(1)} ⭐` : 'Sem avaliação'}
              ${place.price_level ? ` • ${'$'.repeat(place.price_level)}` : ''}
            </div>
            ${place.address ? `<div style="margin-top: 4px; font-size: 12px;">${place.address}</div>` : ''}
            <div style="margin-top: 8px; font-size: 11px; color: #888;">
              ${place.types.filter(type => !['establishment', 'point_of_interest'].includes(type)).slice(0, 3).join(', ')}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current!, marker);
      });

      markersRef.current.push(marker);
    };

    const addVenueMarker = (venue: any, stat: any) => {
      const marker = new google.maps.Marker({
        position: { lat: venue.lat, lng: venue.lng },
        map: mapRef.current!,
        title: venue.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#8B5CF6",
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        }
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="min-width: 220px; max-width: 260px; font-size: 14px;">
            <h3 style="font-weight: 600; margin: 0;">${venue.name}</h3>
            <div style="margin-top: 4px; font-size: 12px; color: #666;">
              ${stat?.avg_rating ? `${stat.avg_rating.toFixed(1)} ⭐` : 'Sem avaliação'}
              • ${stat?.reviews_count || 0} avaliações
            </div>
            ${venue.address ? `<div style="margin-top: 4px; font-size: 12px;">${venue.address}</div>` : ''}
            <div style="margin-top: 12px;">
              <a href="/place/${venue.id}" style="color: #8B5CF6; text-decoration: underline;">Ver detalhes</a>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current!, marker);
      });

      markersRef.current.push(marker);
    };

    initializeMap();

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
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
