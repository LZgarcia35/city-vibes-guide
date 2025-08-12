import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RatingStars from "@/components/RatingStars";

// Types
type Profile = Tables<"profiles">;
type Venue = Tables<"venues">;
type Review = Tables<"reviews">;

type Preferences = {
  favorite_categories?: string[];
  price_range?: string | null;
  favorite_drinks?: string[];
};

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [venuesById, setVenuesById] = useState<Record<string, Venue>>({});

  const prefs = useMemo<Preferences>(() => ({
    favorite_categories: (profile?.preferences as any)?.favorite_categories ?? [],
    price_range: (profile?.preferences as any)?.price_range ?? null,
    favorite_drinks: (profile?.preferences as any)?.favorite_drinks ?? [],
  }), [profile]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: p }, { data: theirVenues }, { data: theirReviews }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("venues").select("*").eq("created_by", id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      ]);
      setProfile(p ?? null);
      setVenues(theirVenues ?? []);
      setReviews(theirReviews ?? []);

      const vIds = Array.from(new Set((theirReviews ?? []).map((r) => String(r.venue_id))));
      if (vIds.length) {
        const { data: vds } = await supabase.from("venues").select("id,name,category").in("id", vIds);
        const map: Record<string, Venue> = {};
        (vds ?? []).forEach((v) => { map[String(v.id)] = v as Venue; });
        setVenuesById(map);
      } else {
        setVenuesById({});
      }
    };
    load();
  }, [id]);

  const title = profile?.display_name ? `${profile.display_name} | Perfil no MyNight` : "Perfil | MyNight";
  const handleName = profile?.display_name || (profile as any)?.id?.slice?.(0, 6) || "Usuário";

  return (
    <main className="min-h-screen">
      <Seo title={title} description={`Veja contribuições, avaliações e preferências de ${handleName}.`} canonical={`/user/${id || ""}`} />
      <h1 className="sr-only">Perfil público — contribuições e reviews</h1>

      <section className="container py-6">
        <div className="flex items-center gap-3 mb-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={`Avatar de ${handleName}`} className="h-12 w-12 rounded-full border object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full border bg-muted" aria-label="Avatar padrão" />
          )}
          <div>
            <div className="font-semibold leading-tight">{profile?.display_name || handleName}</div>
            {profile?.bio && <div className="text-sm text-muted-foreground">{profile.bio}</div>}
          </div>
        </div>

        <Tabs defaultValue="contribuicoes" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="contribuicoes">Contribuições</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          </TabsList>

          <TabsContent value="contribuicoes" className="animate-enter">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Locais adicionados ({venues.length})</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((v) => (
                  <Link key={String(v.id)} to={`/place/${v.id}`} className="rounded-lg border p-3 hover:bg-muted/30">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.category || "Local"}</div>
                  </Link>
                ))}
                {venues.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma contribuição ainda.</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="animate-enter">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Avaliações ({reviews.length})</div>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={String(r.id)} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{venuesById[String(r.venue_id)]?.name || "Local"}</div>
                      {typeof (r as any).rating === "number" && <RatingStars rating={(r as any).rating as number} />}
                    </div>
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                  </div>
                ))}
                {reviews.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma avaliação ainda.</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preferencias" className="animate-enter">
            <div className="rounded-lg border p-4">
              <div className="font-medium">Preferências</div>
              <dl className="mt-2 grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Categorias favoritas</dt>
                  <dd>{(prefs.favorite_categories ?? []).join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Faixa de preço</dt>
                  <dd>{prefs.price_range || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bebidas favoritas</dt>
                  <dd>{(prefs.favorite_drinks ?? []).join(", ") || "—"}</dd>
                </div>
              </dl>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default UserProfilePage;
