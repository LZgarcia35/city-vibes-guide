import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RatingStars from "@/components/RatingStars";
import { FollowButton } from "@/components/FollowButton";

// Types
type Profile = Tables<"profiles">;
type Venue = Tables<"venues">;
type Review = Tables<"reviews">;

type Preferences = {
  favorite_categories?: string[];
  price_range?: string | null;
  favorite_drinks?: string[];
};

type ProfileWithBackground = Profile & {
  background_url?: string;
  background_color?: string;
};

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileWithBackground | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
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
      const [
        { data: p }, 
        { data: theirVenues }, 
        { data: theirReviews },
        { data: followers },
        { data: following }
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("venues").select("*").eq("created_by", id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("followers").select("id").eq("following_id", id),
        supabase.from("followers").select("id").eq("follower_id", id),
      ]);
      setProfile(p ?? null);
      setVenues(theirVenues ?? []);
      setReviews(theirReviews ?? []);
      setFollowersCount(followers?.length ?? 0);
      setFollowingCount(following?.length ?? 0);

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

      <section 
        className="relative min-h-48 bg-cover bg-center"
        style={{
          backgroundImage: profile?.background_url ? `url(${profile.background_url})` : 'none',
          backgroundColor: profile?.background_color || 'hsl(var(--muted))'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="container relative py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={`Avatar de ${handleName}`} className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-lg" />
              ) : (
                <div className="h-16 w-16 rounded-full border-2 border-white bg-muted shadow-lg" aria-label="Avatar padrão" />
              )}
              <div className="text-white">
                <div className="font-semibold leading-tight text-lg drop-shadow-md">{profile?.display_name || handleName}</div>
                {profile?.bio && <div className="text-sm opacity-90">{profile.bio}</div>}
                <div className="flex gap-4 text-xs mt-1 opacity-80">
                  <span>{followersCount} seguidores</span>
                  <span>{followingCount} seguindo</span>
                </div>
              </div>
            </div>
            <FollowButton userId={id!} />
          </div>
        </div>
      </section>
      
      <section className="container py-6">

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
