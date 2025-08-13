import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload, MediaPreview } from "@/components/FileUpload";

const Contribute = () => {
  const [rating, setRating] = useState<number>(0);
  const [media, setMedia] = useState<string[]>([]);
  const { toast } = useToast();

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
            <Label className="mb-2 block">Fotos e Vídeos</Label>
            <FileUpload
              onUpload={(url) => setMedia([...media, url])}
              bucket="review-media"
              accept="image/*,video/*"
            />
            {media.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {media.map((url, index) => (
                  <MediaPreview
                    key={index}
                    url={url}
                    onRemove={() => {
                      setMedia(media.filter((_, i) => i !== index));
                    }}
                  />
                ))}
              </div>
            )}
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
          </div>
        </form>
      </section>
    </main>
  );
};

export default Contribute;
