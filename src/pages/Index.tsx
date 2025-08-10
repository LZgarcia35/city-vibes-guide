import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import BackgroundGlow from "@/components/BackgroundGlow";
import Logo from "@/components/Logo";

const Index = () => {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Seo
        title="MyNight — Vida noturna em tempo real"
        description="Descubra bares e festas em tempo real. Veja fotos, vídeos e avaliações da comunidade."
        canonical="/"
      />
      <BackgroundGlow />
      <section className="w-full max-w-md mx-auto text-center p-6 animate-enter">
        <Logo className="justify-center mb-6" />
        <h1 className="sr-only">MyNight — rede social da vida noturna</h1>
        <p className="text-base text-muted-foreground mb-8">
          Veja como está a noite agora — lista e mapa com fotos e avaliações em tempo real.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild variant="hero" size="lg" className="w-full sm:w-auto">
            <Link to="/login" aria-label="Ir para Login">Login</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link to="/signup" aria-label="Ir para Inscrever-se">Inscrever-se</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Index;
