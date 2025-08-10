import { MapPin } from "lucide-react";

const MapPlaceholder = ({ height = "h-[60vh]" }: { height?: string }) => {
  return (
    <div className={`${height} w-full rounded-lg border bg-card/50 backdrop-blur-sm flex items-center justify-center`}
      aria-label="Mapa em breve">
      <div className="text-center space-y-2 animate-fade-in">
        <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Mapa interativo será habilitado com o token público do Mapbox.</p>
        <p className="text-xs text-muted-foreground/70">Vá em Configurações depois para conectar seu token.</p>
      </div>
    </div>
  );
};

export default MapPlaceholder;
