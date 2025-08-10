import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Check, RefreshCw, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contribute = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch (e) {
      toast({ title: "Câmera", description: "Não foi possível acessar a câmera." });
    }
  };

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setPhoto(canvas.toDataURL("image/jpeg"));
  };

  const resetPhoto = () => setPhoto(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Enviado", description: "Sua contribuição foi enviada (fluxo a implementar)." });
  };

  return (
    <main className="min-h-screen">
      <Seo title="Contribuir | MyNight" description="Publique fotos e avaliações dos locais." canonical="/contribute" />
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14">
          <Logo />
        </div>
      </header>

      <section className="container py-6">
        <form onSubmit={submit} className="space-y-6 max-w-2xl">
          <div>
            <Label className="mb-2 block">Câmera</Label>
            <div className="rounded-xl border overflow-hidden bg-card/50">
              {!photo ? (
                <div className="relative">
                  <video ref={videoRef} className="w-full aspect-video bg-muted/30" playsInline />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {!stream ? (
                      <Button type="button" variant="hero" onClick={startCamera}><Camera className="mr-2 h-4 w-4"/> Iniciar câmera</Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={capture}><Check className="mr-2 h-4 w-4"/> Capturar</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img src={photo} alt="Prévia da foto" className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-3 right-3">
                    <Button type="button" size="sm" variant="outline" onClick={resetPhoto}><RefreshCw className="mr-2 h-4 w-4"/>Refazer</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Avaliação</Label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Dar ${i + 1} estrelas`}
                  onClick={() => setRating(i + 1)}
                  className="p-1 rounded-md hover:bg-muted/30"
                >
                  <Star className={"h-6 w-6 " + (i < rating ? "text-primary" : "text-muted-foreground/40")} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário</Label>
            <Textarea id="comment" placeholder="Conte como está o local, fila, música, atendimento…" />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="hero">Publicar</Button>
            <Button type="button" variant="outline"><CameraOff className="mr-2 h-4 w-4"/>Ocultar mídia</Button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Contribute;
