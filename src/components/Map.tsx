import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVkZWNydXplcyIsImEiOiJjbWU2bHR1NmowcmNhMmxuZHQ5ZW1jZHBhIn0.fjXFTjYOlsTz_P1G6UsJEQ";

type Venue = Tables<"venues">;
type VenueStats = Tables<"venue_stats">;

const Map = ({ height = "h-[60vh]" }: { height?: string }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

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

    // Geolocate control
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
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

    // Load venues and add markers when map is ready
    const loadVenues = async () => {
      const [{ data: venues }, { data: stats }] = await Promise.all([
        supabase
          .from("venues")
          .select("id,name,lat,lng,address,price_range") as unknown as Promise<{ data: Venue[] | null }>,
        supabase
          .from("venue_stats")
          .select("venue_id,avg_rating,reviews_count") as unknown as Promise<{ data: VenueStats[] | null }>,
      ]);

      const statsMap = new globalThis.Map<string, VenueStats>();
      (stats || []).forEach((s) => {
        if (s && s.venue_id) statsMap.set(String(s.venue_id), s);
      });

      // Clear old markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      (venues || []).forEach((v) => {
        if (!v || typeof v.lng !== "number" || typeof v.lat !== "number") return;
        const stat = statsMap.get(String(v.id));
        addMarker(v, stat || null);
      });
    };

    const addMarker = (v: Venue, stat: VenueStats | null) => {
      const el = document.createElement("button");
      el.className = "w-3 h-3 rounded-full bg-primary border";
      el.setAttribute("aria-label", v.name ?? "Local");

      const popup = new mapboxgl.Popup({ offset: 12 });
      const popupEl = document.createElement("div");
      popupEl.className = "min-w-[220px] max-w-[260px] text-sm";

      const title = document.createElement("h3");
      title.className = "font-semibold";
      title.textContent = v.name ?? "Local";
      popupEl.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "mt-1 text-xs text-muted-foreground";
      const ratingText = stat?.avg_rating != null ? stat.avg_rating.toFixed(1) : "-";
      const countText = stat?.reviews_count != null ? stat.reviews_count : 0;
      meta.textContent = `${ratingText} • ${countText} avaliações`;
      popupEl.appendChild(meta);

      if (v.address) {
        const adr = document.createElement("div");
        adr.className = "mt-1 text-xs";
        adr.textContent = v.address as string;
        popupEl.appendChild(adr);
      }

      const actions = document.createElement("div");
      actions.className = "mt-3 flex gap-2";
      const details = document.createElement("a");
      details.href = `/place/${v.id}`;
      details.className = "text-primary underline underline-offset-2";
      details.textContent = "Ver detalhes";
      actions.appendChild(details);
      popupEl.appendChild(actions);

      const commentsWrap = document.createElement("div");
      commentsWrap.className = "mt-2 border-t pt-2";
      const commentsTitle = document.createElement("div");
      commentsTitle.className = "text-xs font-medium";
      commentsTitle.textContent = "Últimos comentários";
      const commentsList = document.createElement("div");
      commentsList.className = "mt-1 space-y-1 text-xs";
      commentsWrap.appendChild(commentsTitle);
      commentsWrap.appendChild(commentsList);
      popupEl.appendChild(commentsWrap);

      popup.setDOMContent(popupEl);

      popup.on("open", async () => {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("comment,rating,created_at")
          .eq("venue_id", v.id)
          .order("created_at", { ascending: false })
          .limit(2);

        commentsList.textContent = "";
        if (!reviews || reviews.length === 0) {
          const none = document.createElement("div");
          none.className = "text-muted-foreground";
          none.textContent = "Sem comentários ainda.";
          commentsList.appendChild(none);
          return;
        }

        reviews.forEach((r) => {
          const item = document.createElement("div");
          const rating = typeof (r as any).rating === "number" ? `${(r as any).rating}/5` : "";
          const text = (r as any).comment ?? "";
          item.textContent = `${rating}${rating ? " — " : ""}${text}`;
          commentsList.appendChild(item);
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([v.lng as number, v.lat as number])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    };

    mapRef.current.on("load", () => {
      loadVenues();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
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
