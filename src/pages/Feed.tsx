import Seo from "@/components/Seo";
import Logo from "@/components/Logo";
import Map from "@/components/Map";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import nightlife1 from "@/assets/nightlife-1.jpg";
import nightlife2 from "@/assets/nightlife-2.jpg";
import nightlife3 from "@/assets/nightlife-3.jpg";
import { MapPin, List, Navigation, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
const venues = [
  { id: "1", name: "Bar Neon", rating: 4.6, price: "$$$", image: nightlife1 },
  { id: "2", name: "Rooftop 22", rating: 4.3, price: "$$", image: nightlife2 },
  { id: "3", name: "Subsolo Club", rating: 4.8, price: "$$$", image: nightlife3 },
];

const Feed = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const doSignOut = async () => { await signOut(); toast({ title: "Sessão encerrada", description: "Você saiu da conta." }); };
  return (
    <main className="min-h-screen">
      <Seo title="Feed | MyNight" description="Explore bares e festas em tempo real." canonical="/feed" />
      <h1 className="sr-only">Feed — locais e festas em tempo real</h1>
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/80 border-b">
        <div className="container flex items-center justify-between h-14">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/contribute" aria-label="Contribuir"><Navigation className="h-4 w-4" />Contribuir</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={doSignOut} aria-label="Sair">
              <LogOut className="h-4 w-4 mr-2"/>Sair
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-4">
        <Tabs defaultValue="lista" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="lista" className="gap-2"><List className="h-4 w-4"/>Lista</TabsTrigger>
            <TabsTrigger value="mapa" className="gap-2"><MapPin className="h-4 w-4"/>Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="animate-enter">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((v) => (
                <Link key={v.id} to={`/place/${v.id}`} className="group rounded-xl overflow-hidden border bg-card hover:shadow-[0_0_30px_hsl(var(--brand)/0.12)] transition-shadow">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={v.image} alt={`Foto do ${v.name}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold tracking-tight">{v.name}</h3>
                      <span className="text-xs text-muted-foreground">{v.price}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <RatingStars rating={v.rating} />
                      <span className="text-xs text-muted-foreground">{v.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mapa" className="animate-enter">
            <Map height="h-[70vh]" />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
};

export default Feed;
