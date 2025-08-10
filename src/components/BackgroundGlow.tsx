import { useEffect, useRef, useState } from "react";

const BackgroundGlow = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setPos({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const style = {
    background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, hsl(var(--brand)/0.16), transparent 60%)`,
  } as React.CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={style}
    />
  );
};

export default BackgroundGlow;
