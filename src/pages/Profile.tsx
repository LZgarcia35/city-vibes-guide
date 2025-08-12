import { useEffect, useMemo, useState } from "react";
import Seo from "@/components/Seo";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import RatingStars from "@/components/RatingStars";
import { Link } from "react-router-dom";

// Types
type Profile = Tables<"profiles">;
type Venue = Tables<"venues">;
type Review = Tables<"reviews">;

const CATEGORIES = ["Bar", "Restaurante", "Boate"] as const;
const PRICE_RANGES = ["$", "$$", "$$$"] as const;

type Preferences = {
  favorite_categories?: string[];
  price_range?: string | null;
  favorite_drinks?: string[];
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [venuesById, setVenuesById] = useState<Record<string, Venue>>({});

  const prefs = useMemo<Preferences>(() => ({
    favorite_categories: (profile?.preferences as any)?.favorite_categories ?? [],
    price_range: (profile?.preferences as any)?.price_range ?? null,
    favorite_drinks: (profile?.preferences as any)?.favorite_drinks ?? [],
  }), [profile]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: p }, { data: myVenues }, { data: myReviews }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("venues").select("*").eq("created_by", user.id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setProfile(p ?? null);
      setVenues(myVenues ?? []);
      setReviews(myReviews ?? []);

      // fetch venue details for reviews
      const ids = Array.from(new Set((myReviews ?? []).map((r) => String(r.venue_id))));
      if (ids.length) {
        const { data: vds } = await supabase.from("venues").select("id,name,category").in("id", ids);
        const map: Record<string, Venue> = {};
        (vds ?? []).forEach((v) => { map[String(v.id)] = v as Venue; });
        setVenuesById(map);
      } else {
        setVenuesById({});
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string | "" | null>("");
  const [favoriteDrinks, setFavoriteDrinks] = useState<string>("");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setBio(profile.bio ?? "");
    setFavoriteCategories(prefs.favorite_categories ?? []);
    setPriceRange(prefs.price_range ?? "");
    setFavoriteDrinks((prefs.favorite_drinks ?? []).join(", "));
  }, [profile, prefs]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      bio: bio || null,
    } as any);
    if (error) return toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
    toast({ title: "Perfil atualizado" });
  };

  const savePreferences = async () => {
    if (!user) return;
    const prefObj: Preferences = {
      favorite_categories: favoriteCategories,
      price_range: priceRange || null,
      favorite_drinks: favoriteDrinks
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const { error } = await supabase.from("profiles").update({
      preferences: prefObj as any,
    }).eq("id", user.id);
    if (error) return toast({ title: "Erro ao salvar preferências", description: error.message, variant: "destructive" });
    toast({ title: "Preferências salvas" });
  };

  if (!user) return null;

  return (
    <main className="min-h-screen">
      <Seo title="Meu Perfil | MyNight" description="Configure seu perfil, preferências e veja suas contribuições." canonical="/profile" />
      <h1 className="sr-only">Meu Perfil — configurações, preferências e histórico</h1>

      <section className="container py-6">
        <div className="flex items-center gap-3 mb-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar do usuário" className="h-12 w-12 rounded-full border object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full border bg-muted" aria-label="Avatar padrão" />
          )}
          <div>
            <div className="font-semibold leading-tight">{displayName || "Seu nome"}</div>
            <div className="text-sm text-muted-foreground">@{user.email?.split("@")[0]}</div>
            <Link to={`/user/${user.id}`} className="text-xs text-primary underline underline-offset-2">Ver perfil público</Link>
          </div>
        </div>

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="preferencias">Preferências</TabsTrigger>
            <TabsTrigger value="contribuicoes">Contribuições</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="animate-enter">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="display_name">Nome de exibição</Label>
                  <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome público" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input id="avatar_url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Link da sua foto" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre você" />
                </div>
                <Button onClick={saveProfile} disabled={loading}>Salvar perfil</Button>
              </div>

              <aside className="space-y-2">
                <div className="text-sm text-muted-foreground">Suas informações públicas no app.</div>
                <ul className="text-sm list-disc pl-5">
                  <li>Nome e foto serão visíveis para todos.</li>
                  <li>Você pode editar a qualquer momento.</li>
                </ul>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="preferencias" className="animate-enter">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Categorias favoritas</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setFavoriteCategories((prev) =>
                            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                          )
                        }
                        className={`px-3 py-1 rounded-full border text-sm ${favoriteCategories.includes(c) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                        aria-pressed={favoriteCategories.includes(c)}
                        aria-label={`Categoria ${c}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Faixa de preço preferida</Label>
                  <div className="flex gap-2">
                    {PRICE_RANGES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriceRange(p === priceRange ? "" : p)}
                        className={`px-3 py-1 rounded-full border text-sm ${p === priceRange ? "bg-primary text-primary-foreground" : "bg-background"}`}
                        aria-pressed={p === priceRange}
                        aria-label={`Preço ${p}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="drinks">Bebidas favoritas</Label>
                  <Input id="drinks" value={favoriteDrinks} onChange={(e) => setFavoriteDrinks(e.target.value)} placeholder="Ex.: gin tônica, negroni" />
                  <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
                </div>

                <Button onClick={savePreferences} disabled={loading}>Salvar preferências</Button>
              </div>

              <aside className="space-y-2">
                <div className="text-sm text-muted-foreground">Suas preferências ajudam a personalizar recomendações.</div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="contribuicoes" className="animate-enter">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Locais adicionados por você ({venues.length})</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((v) => (
                  <Link key={String(v.id)} to={`/place/${v.id}`} className="rounded-lg border p-3 hover:bg-muted/30">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.category || "Local"}</div>
                  </Link>
                ))}
                {venues.length === 0 && <div className="text-sm text-muted-foreground">Você ainda não adicionou locais.</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="animate-enter">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Suas avaliações ({reviews.length})</div>
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
                {reviews.length === 0 && <div className="text-sm text-muted-foreground">Você ainda não avaliou locais.</div>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default ProfilePage;
