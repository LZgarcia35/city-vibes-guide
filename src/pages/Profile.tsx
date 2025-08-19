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
import { Link, useNavigate } from "react-router-dom";
import { FileUpload, MediaPreview } from "@/components/FileUpload";
import { Palette, ArrowLeft } from "lucide-react";

// Types
type Profile = Tables<"profiles">;
type Venue = Tables<"venues">;
type Review = Tables<"reviews">;

const CATEGORIES = ["Bar", "Restaurante", "Boate"] as const;
const PRICE_RANGES = ["$", "$$", "$$$"] as const;
const BACKGROUND_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))", 
  "hsl(var(--accent))",
  "#1a1a1a",
  "#4f46e5",
  "#059669",
  "#dc2626",
  "#ea580c"
] as const;

type Preferences = {
  favorite_categories?: string[];
  price_range?: string | null;
  favorite_drinks?: string[];
};

type ProfileWithBackground = Profile & {
  background_url?: string;
  background_color?: string;
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileWithBackground | null>(null);
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
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");

  // Media states for preferences, venues, and reviews
  const [preferencesMedia, setPreferencesMedia] = useState<string[]>([]);
  const [venueMedia, setVenueMedia] = useState<Record<string, string[]>>({});
  const [reviewMedia, setReviewMedia] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
    setBio(profile.bio ?? "");
    setFavoriteCategories(prefs.favorite_categories ?? []);
    setPriceRange(prefs.price_range ?? "");
    setFavoriteDrinks((prefs.favorite_drinks ?? []).join(", "));
    setBackgroundUrl(profile.background_url ?? "");
    setBackgroundColor(profile.background_color ?? "");
  }, [profile, prefs]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      bio: bio || null,
      background_url: backgroundUrl || null,
      background_color: backgroundColor || null,
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

      <section 
        className="relative min-h-48 bg-cover bg-center"
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
          backgroundColor: backgroundColor || 'hsl(var(--muted))'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="container relative py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 text-white hover:bg-white/20 border border-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar do usuário" className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-lg" />
            ) : (
              <div className="h-16 w-16 rounded-full border-2 border-white bg-muted shadow-lg" aria-label="Avatar padrão" />
            )}
            <div className="text-white">
              <div className="font-semibold leading-tight text-lg drop-shadow-md">{displayName || "Seu nome"}</div>
              <div className="text-sm opacity-90">@{user.email?.split("@")[0]}</div>
              <Link to={`/user/${user.id}`} className="text-xs text-white underline underline-offset-2 opacity-80 hover:opacity-100">Ver perfil público</Link>
            </div>
          </div>
        </div>
      </section>
      
      <section className="container py-6">

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
                  <Label>Foto do perfil</Label>
                  <FileUpload
                    bucket="avatars"
                    accept="image/*"
                    onUpload={setAvatarUrl}
                    className="w-full"
                  />
                  {avatarUrl && (
                    <div className="mt-2">
                      <img src={avatarUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover border" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Fale um pouco sobre você" />
                </div>
                <div className="space-y-1">
                  <Label>Fundo do perfil</Label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setBackgroundColor(color);
                            setBackgroundUrl("");
                          }}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: color }}
                          aria-label={`Cor ${color}`}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBackgroundColor("");
                          setBackgroundUrl("");
                        }}
                      >
                        Limpar
                      </Button>
                    </div>
                    <FileUpload
                      bucket="profile-backgrounds"
                      accept="image/*"
                      onUpload={(url) => {
                        setBackgroundUrl(url);
                        setBackgroundColor("");
                      }}
                    >
                      <Button type="button" variant="outline" size="sm" className="w-full">
                        <Palette className="h-4 w-4 mr-2" />
                        Upload de imagem
                      </Button>
                    </FileUpload>
                  </div>
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

                <div className="space-y-1">
                  <Label>Fotos e Vídeos das Preferências</Label>
                  <FileUpload
                    onUpload={(url) => setPreferencesMedia([...preferencesMedia, url])}
                    bucket="review-media"
                    accept="image/*,video/*"
                  />
                  {preferencesMedia.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {preferencesMedia.map((url, index) => (
                        <MediaPreview
                          key={index}
                          url={url}
                          onRemove={() => {
                            setPreferencesMedia(preferencesMedia.filter((_, i) => i !== index));
                          }}
                        />
                      ))}
                    </div>
                  )}
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
              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                {venues.map((v) => (
                  <div key={String(v.id)} className="rounded-lg border p-4 bg-card/50">
                    <Link to={`/place/${v.id}`} className="block hover:bg-muted/30 -m-4 p-4 rounded-lg">
                      <div className="font-medium">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.category || "Local"}</div>
                    </Link>
                    
                    {/* Display existing venue photos */}
                    {v.photos && v.photos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {v.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`${v.name} - ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}

                    {/* Add new photos */}
                    <div className="mt-3">
                      <FileUpload
                        onUpload={(url) => {
                          const currentMedia = venueMedia[String(v.id)] || [];
                          setVenueMedia({
                            ...venueMedia,
                            [String(v.id)]: [...currentMedia, url]
                          });
                        }}
                        bucket="venue-photos"
                        accept="image/*,video/*"
                      />
                      {venueMedia[String(v.id)] && venueMedia[String(v.id)].length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {venueMedia[String(v.id)].map((url, index) => (
                            <MediaPreview
                              key={index}
                              url={url}
                              onRemove={() => {
                                const updatedMedia = venueMedia[String(v.id)].filter((_, i) => i !== index);
                                setVenueMedia({
                                  ...venueMedia,
                                  [String(v.id)]: updatedMedia
                                });
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                  <div key={String(r.id)} className="rounded-lg border p-4 bg-card/50">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{venuesById[String(r.venue_id)]?.name || "Local"}</div>
                      {typeof (r as any).rating === "number" && <RatingStars rating={(r as any).rating as number} />}
                    </div>
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}

                    {/* Display existing review media */}
                    {((r.photos && r.photos.length > 0) || (r.videos && r.videos.length > 0)) && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                        {r.photos?.map((photo, index) => (
                          <img
                            key={`photo-${index}`}
                            src={photo}
                            alt={`Review - ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                        ))}
                        {r.videos?.map((video, index) => (
                          <video
                            key={`video-${index}`}
                            src={video}
                            className="w-full h-20 object-cover rounded-lg border"
                            controls
                          />
                        ))}
                      </div>
                    )}

                    {/* Add new media to existing reviews */}
                    <div className="mt-3">
                      <FileUpload
                        onUpload={(url) => {
                          const currentMedia = reviewMedia[String(r.id)] || [];
                          setReviewMedia({
                            ...reviewMedia,
                            [String(r.id)]: [...currentMedia, url]
                          });
                        }}
                        bucket="review-media"
                        accept="image/*,video/*"
                      />
                      {reviewMedia[String(r.id)] && reviewMedia[String(r.id)].length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {reviewMedia[String(r.id)].map((url, index) => (
                            <MediaPreview
                              key={index}
                              url={url}
                              onRemove={() => {
                                const updatedMedia = reviewMedia[String(r.id)].filter((_, i) => i !== index);
                                setReviewMedia({
                                  ...reviewMedia,
                                  [String(r.id)]: updatedMedia
                                });
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
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
