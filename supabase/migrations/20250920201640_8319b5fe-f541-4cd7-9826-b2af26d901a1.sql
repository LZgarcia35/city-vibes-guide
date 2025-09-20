-- Drop the existing view and recreate it without SECURITY DEFINER
DROP VIEW IF EXISTS public.venue_stats;

-- Recreate the view without SECURITY DEFINER (using SECURITY INVOKER by default)
CREATE VIEW public.venue_stats AS
SELECT 
    venue_id,
    (avg(rating))::double precision AS avg_rating,
    (count(*))::integer AS reviews_count
FROM reviews
GROUP BY venue_id;