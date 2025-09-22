-- Check and fix the venue_stats view to remove SECURITY DEFINER
-- First, let's see the current view definition with security options
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE viewname = 'venue_stats';

-- Drop and recreate the view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.venue_stats;

-- Create the view with SECURITY INVOKER explicitly (this is the secure default)
CREATE VIEW public.venue_stats 
WITH (security_invoker=true) AS
SELECT 
    venue_id,
    avg(rating)::double precision AS avg_rating,
    count(*)::integer AS reviews_count
FROM public.reviews
GROUP BY venue_id;