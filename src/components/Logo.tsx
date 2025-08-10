import { Moon } from "lucide-react";

const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label="MyNight logo">
      <Moon className="h-6 w-6 text-primary" aria-hidden="true" />
      <span className="text-lg font-semibold bg-gradient-to-r from-[hsl(var(--brand))] to-[hsl(var(--brand-2))] bg-clip-text text-transparent tracking-tight">
        MyNight
      </span>
    </div>
  );
};

export default Logo;
