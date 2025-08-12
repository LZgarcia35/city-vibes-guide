import { useEffect, useMemo, useState } from "react";
import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Venue = Tables<"venues">;
type VenueStats = Tables<"venue_stats">;
type Review = Tables<"reviews">;

const Place = () => {
  const { id } = useParams();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<VenueStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);

    (async () => {
      const [vRes, sRes, rRes] = await Promise.all([
        supabase.from("venues").select("*").eq("id", id).maybeSingle(),
        supabase.from("venue_stats").select("*").eq("venue_id", id).maybeSingle(),
        supabase
          .from("reviews")
          .select("*")
          .eq("venue_id", id)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);
      if (!active) return;

      setVenue(vRes.data ?? null);
      setStats(sRes.data ?? null);
      setReviews(rRes.data ?? []);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const name = venue?.name ?? "Local";
  const price = venue?.price_range ?? "-";
  const avgRating = stats?.avg_rating ?? null;

  const doSignOut = async () => {
    await signOut();
    toast({ title: "Sessão encerrada", description: "Você saiu da conta." });
  };

  return (
    <main className="min-h-screen">
      <Seo title={`${name} | MyNight`} description={`Fotos e avaliações do ${name}.`} canonical={`/place/${id}`} />
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/feed">Voltar</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={doSignOut} aria-label="Sair">
              <LogOut className="h-4 w-4 mr-2" />Sair
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
                <RatingStars rating={avgRating ?? 0} />
                <span className="text-sm text-muted-foreground">{avgRating ? avgRating.toFixed(1) : "-"}</span>
              </div>
              <Badge variant="secondary">Preço: {price}</Badge>
              {venue?.address && <Badge variant="secondary">{venue.address}</Badge>}
            </div>
          </div>
          <Button asChild variant="hero"><Link to="/contribute">Contribuir</Link></Button>
        </div>

        {/* Simple placeholder gallery (optional) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-full h-36 md:h-48 rounded-lg border bg-muted" />
          ))}
        </div>

        <article className="space-y-2">
          <h2 className="text-lg font-semibold">Comentários</h2>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : reviews.length === 0 ? (
            <div className="text-sm text-muted-foreground">Ainda não há comentários.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((c) => (
                <div key={c.id} className="rounded-xl border p-4 bg-card/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Usuário</span>
                    <RatingStars rating={Number(c.rating) || 0} />
                  </div>
                  {c.comment && <p className="text-sm text-muted-foreground mt-1">{c.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
};

export default Place;
