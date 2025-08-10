import { Star } from "lucide-react";

const RatingStars = ({ rating = 0 }: { rating: number }) => {
  const rounded = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            "h-4 w-4 " + (i < rounded ? "text-primary" : "text-muted-foreground/40")
          }
        />
      ))}
    </div>
  );
};

export default RatingStars;
