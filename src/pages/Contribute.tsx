import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Star, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload, MediaPreview } from "@/components/FileUpload";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Venue = Tables<"venues">;

const CATEGORIES = ["Bar", "Restaurante", "Boate", "Café", "Pub"];
const PRICE_RANGES = ["$", "$$", "$$$"];

const Contribute = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // States for new venue
  const [venueName, setVenueName] = useState("");
  const [venueCategory, setVenueCategory] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venuePriceRange, setVenuePriceRange] = useState("");
  const [venueDescription, setVenueDescription] = useState("");
  const [venuePhotos, setVenuePhotos] = useState<string[]>([]);
  
  // States for review
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [reviewMedia, setReviewMedia] = useState<string[]>([]);
  
  // Other states
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    const { data } = await supabase
      .from("venues")
      .select("*")
      .order("name");
    setVenues(data || []);
  };

  const submitNewVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: venue, error } = await supabase
        .from("venues")
        .insert({
          name: venueName,
          category: venueCategory,
          address: venueAddress,
          price_range: venuePriceRange,
          description: venueDescription,
          photos: venuePhotos,
          created_by: user.id,
          lat: -23.5505, // Default São Paulo coordinates
          lng: -46.6333
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Local adicionado!", description: "Seu local foi cadastrado com sucesso." });
      
      // Reset form
      setVenueName("");
      setVenueCategory("");
      setVenueAddress("");
      setVenuePriceRange("");
      setVenueDescription("");
      setVenuePhotos([]);
      
      await loadVenues();
    } catch (error: any) {
      toast({ 
        title: "Erro ao adicionar local", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVenue || rating === 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .insert({
          venue_id: selectedVenue,
          user_id: user.id,
          rating,
          comment: comment || null,
          photos: reviewMedia.filter(url => url.includes('image')),
          videos: reviewMedia.filter(url => url.includes('video'))
        });

      if (error) throw error;

      toast({ title: "Review enviada!", description: "Sua avaliação foi publicada." });
      
      // Reset form
      setSelectedVenue("");
      setRating(0);
      setComment("");
      setReviewMedia([]);
      
    } catch (error: any) {
      toast({ 
        title: "Erro ao enviar review", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Login necessário</h1>
          <p className="text-muted-foreground mb-4">Você precisa estar logado para contribuir.</p>
          <Button asChild>
            <Link to="/login">Fazer Login</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Seo title="Contribuir | MyNight" description="Adicione novos locais ou avalie os existentes." canonical="/contribute" />
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Logo />
          </div>
        </div>
      </header>

      <section className="container py-6">
        <h1 className="text-2xl font-semibold mb-6">Contribuir</h1>
        
        <Tabs defaultValue="review" className="w-full max-w-2xl">
          <TabsList className="mb-6">
            <TabsTrigger value="review">Avaliar Local</TabsTrigger>
            <TabsTrigger value="venue">Novo Local</TabsTrigger>
          </TabsList>

          <TabsContent value="review">
            <form onSubmit={submitReview} className="space-y-6">
              <h2 className="text-lg font-medium">Avaliar um Local</h2>
              
              <div className="space-y-2">
                <Label>Escolha o local</Label>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um local para avaliar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name} - {venue.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  placeholder="Conte como está o local, fila, música, atendimento…" 
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

              <Button 
                type="submit" 
                disabled={loading || !selectedVenue || rating === 0}
                className="w-full"
              >
                {loading ? "Enviando..." : "Publicar Review"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="venue">
            <form onSubmit={submitNewVenue} className="space-y-6">
              <h2 className="text-lg font-medium">Adicionar Novo Local</h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="venue-name">Nome do Local *</Label>
                  <Input 
                    id="venue-name"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Ex: Bar do João"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select value={venueCategory} onValueChange={setVenueCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-address">Endereço</Label>
                <Input 
                  id="venue-address"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div className="space-y-2">
                <Label>Faixa de Preço</Label>
                <Select value={venuePriceRange} onValueChange={setVenuePriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a faixa de preço" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((price) => (
                      <SelectItem key={price} value={price}>
                        {price} - {price === "$" ? "Econômico" : price === "$$" ? "Moderado" : "Caro"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue-description">Descrição</Label>
                <Textarea 
                  id="venue-description"
                  value={venueDescription}
                  onChange={(e) => setVenueDescription(e.target.value)}
                  placeholder="Descreva o local, ambiente, especialidades..."
                />
              </div>

              <div>
                <Label className="mb-2 block">Fotos do Local</Label>
                <FileUpload
                  onUpload={(url) => setVenuePhotos([...venuePhotos, url])}
                  bucket="venue-photos"
                  accept="image/*"
                />
                {venuePhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {venuePhotos.map((url, index) => (
                      <MediaPreview
                        key={index}
                        url={url}
                        onRemove={() => {
                          setVenuePhotos(venuePhotos.filter((_, i) => i !== index));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                disabled={loading || !venueName || !venueCategory}
                className="w-full"
              >
                {loading ? "Adicionando..." : "Adicionar Local"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Contribute;
