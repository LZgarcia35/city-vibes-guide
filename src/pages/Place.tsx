import { useEffect, useMemo, useState } from "react";
import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Star, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FileUpload, MediaPreview } from "@/components/FileUpload";

type Venue = Tables<"venues">;
type VenueStats = Tables<"venue_stats">;
type Review = Tables<"reviews">;
type Profile = Tables<"profiles">;

const Place = () => {
  const { id } = useParams();
  const { signOut, user } = useAuth();
  const { toast } = useToast();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [stats, setStats] = useState<VenueStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  
  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewMedia, setReviewMedia] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

      // Load user profiles for reviews
      const userIds = Array.from(new Set((rRes.data ?? []).map(r => r.user_id)));
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);
        
        const profilesMap: Record<string, Profile> = {};
        (profilesData ?? []).forEach(p => {
          profilesMap[p.id] = p;
        });
        setProfiles(profilesMap);
      }
      
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

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || rating === 0) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          venue_id: id,
          user_id: user.id,
          rating,
          comment: comment || null,
          photos: reviewMedia.filter(url => url.includes('image')),
          videos: reviewMedia.filter(url => url.includes('video'))
        });

      if (error) throw error;

      toast({ title: "Review enviada!", description: "Sua avaliação foi publicada." });
      
      // Reset form and hide it
      setRating(0);
      setComment("");
      setReviewMedia([]);
      setShowReviewForm(false);
      
      // Reload reviews
      const { data: updatedReviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("venue_id", id)
        .order("created_at", { ascending: false })
        .limit(25);
      setReviews(updatedReviews ?? []);
      
    } catch (error: any) {
      toast({ 
        title: "Erro ao enviar review", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Seo title={`${name} | MyNight`} description={`Fotos e avaliações do ${name}.`} canonical={`/place/${id}`} />
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Logo />
          </div>
          <div className="flex items-center gap-2">
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
            {venue?.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{venue.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/contribute">Contribuir</Link>
            </Button>
            {user && (
              <Button 
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant={showReviewForm ? "outline" : "default"}
              >
                {showReviewForm ? "Cancelar" : "Avaliar"}
              </Button>
            )}
          </div>
        </div>

        {/* Show venue photos */}
        {venue?.photos && venue.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {venue.photos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`${name} - ${index + 1}`}
                className="w-full h-36 md:h-48 rounded-lg border object-cover"
              />
            ))}
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && user && (
          <div className="border rounded-lg p-6 bg-card">
            <form onSubmit={submitReview} className="space-y-4">
              <h3 className="text-lg font-medium">Escreva sua avaliação</h3>
              
              <div className="space-y-2">
                <Label>Avaliação *</Label>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Dar ${i + 1} estrelas`}
                      onClick={() => setRating(i + 1)}
                      className="p-1 rounded-md hover:bg-muted/30"
                    >
                      <Star 
                        className={`h-6 w-6 ${i < rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-comment">Comentário</Label>
                <Textarea 
                  id="review-comment" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi sua experiência neste local..." 
                />
              </div>

              <div>
                <Label className="mb-2 block">Fotos e Vídeos</Label>
                <FileUpload
                  onUpload={(url) => setReviewMedia([...reviewMedia, url])}
                  bucket="review-media"
                  accept="image/*,video/*"
                />
                {reviewMedia.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {reviewMedia.map((url, index) => (
                      <MediaPreview
                        key={index}
                        url={url}
                        onRemove={() => {
                          setReviewMedia(reviewMedia.filter((_, i) => i !== index));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={submitting || rating === 0}
                >
                  {submitting ? "Enviando..." : "Publicar Avaliação"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <article className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Avaliações {reviews.length > 0 && `(${reviews.length})`}
            </h2>
          </div>
          
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ainda não há avaliações para este local.</p>
              {user && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowReviewForm(true)}
                >
                  Seja o primeiro a avaliar
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const profile = profiles[review.user_id];
                const allMedia = [...(review.photos || []), ...(review.videos || [])];
                
                return (
                  <div key={review.id} className="rounded-xl border p-4 bg-card/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted" />
                        )}
                        <span className="font-medium">
                          {profile?.display_name || "Usuário"}
                        </span>
                      </div>
                      <RatingStars rating={Number(review.rating) || 0} />
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                    )}
                    
                    {allMedia.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {allMedia.map((media, index) => (
                          <img
                            key={index}
                            src={media}
                            alt={`Review media ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
};

export default Place;
