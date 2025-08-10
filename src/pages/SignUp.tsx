import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundGlow from "@/components/BackgroundGlow";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const { toast } = useToast();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Cadastro", description: "Fluxo de inscrição a implementar." });
  };

  return (
    <main className="min-h-screen flex items-center justify-center">
      <Seo title="Inscrever-se | MyNight" description="Crie sua conta para participar da comunidade." canonical="/signup" />
      <BackgroundGlow />
      <section className="w-full max-w-md p-6">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={onSubmit} className="space-y-4 bg-card/40 backdrop-blur-sm border rounded-xl p-6 animate-enter">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Seu nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="voce@exemplo.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" variant="hero" className="w-full">Criar conta</Button>
          <p className="text-sm text-muted-foreground text-center">
            Já tem conta? <Link to="/login" className="underline">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default SignUp;
