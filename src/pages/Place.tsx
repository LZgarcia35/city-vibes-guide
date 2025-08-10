import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import RatingStars from "@/components/RatingStars";
import nightlife1 from "@/assets/nightlife-1.jpg";
import nightlife2 from "@/assets/nightlife-2.jpg";
import nightlife3 from "@/assets/nightlife-3.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
const gallery = [nightlife1, nightlife2, nightlife3, nightlife2, nightlife1, nightlife3];

const Place = () => {
  const { id } = useParams();
  const name = id === "2" ? "Rooftop 22" : id === "3" ? "Subsolo Club" : "Bar Neon";
  const { signOut } = useAuth();
  const { toast } = useToast();
  const doSignOut = async () => { await signOut(); toast({ title: "Sessão encerrada", description: "Você saiu da conta." }); };

  return (
    <main className="min-h-screen">
      <Seo title={`${name} | MyNight`} description={`Fotos, vídeos e avaliações do ${name}.`} canonical={`/place/${id}`} />
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/feed">Voltar</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={doSignOut} aria-label="Sair">
              <LogOut className="h-4 w-4 mr-2"/>Sair
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <RatingStars rating={4.6} />
                <span className="text-sm text-muted-foreground">4.6</span>
              </div>
              <Badge variant="secondary">Preço: $$$</Badge>
              <Badge variant="secondary">Benefícios: Drinks 2x1</Badge>
            </div>
          </div>
          <Button asChild variant="hero"><Link to="/contribute">Contribuir</Link></Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {gallery.map((src, i) => (
            <img key={i} src={src} alt={`Imagem ${i+1} do ${name}`} className="w-full h-36 md:h-48 object-cover rounded-lg border" loading="lazy" />
          ))}
        </div>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold">Comentários</h2>
          <div className="space-y-4">
            {[
              { user: "Ana", text: "Clima ótimo e música excelente." },
              { user: "Carlos", text: "Preço um pouco alto, mas vale a experiência." },
              { user: "Marina", text: "Fila grande, porém atendimento rápido." },
            ].map((c, idx) => (
              <div key={idx} className="rounded-xl border p-4 bg-card/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.user}</span>
                  <RatingStars rating={idx % 2 === 0 ? 5 : 4} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.text}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
};

export default Place;
