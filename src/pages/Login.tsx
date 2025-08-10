import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundGlow from "@/components/BackgroundGlow";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { toast } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Login", description: "Fluxo de autenticação a implementar." });
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <Seo title="Login | MyNight" description="Entre para ver o feed em tempo real." canonical="/login" />
      <BackgroundGlow />
      <section className="w-full max-w-md p-6">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={onSubmit} className="space-y-4 bg-card/40 backdrop-blur-sm border rounded-xl p-6 animate-enter">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="voce@exemplo.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" variant="hero" className="w-full">Entrar</Button>
          <p className="text-sm text-muted-foreground text-center">
            Novo por aqui? <Link to="/signup" className="underline">Inscrever-se</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Login;
