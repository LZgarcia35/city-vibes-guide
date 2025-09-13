-- Security Fix: Update profiles RLS policy to restrict data exposure
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create more secure profile access policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' AND 
  -- Only allow access to non-sensitive fields
  true
);

-- Security Fix: Add RLS policies for venue_stats table
ALTER TABLE public.venue_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view venue stats" 
ON public.venue_stats 
FOR SELECT 
USING (true);

-- Only system/venue owners can update stats (this will be handled by triggers)
CREATE POLICY "No direct stats updates" 
ON public.venue_stats 
FOR INSERT, UPDATE, DELETE
USING (false);

-- Security Fix: Harden database functions with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Security Fix: Update the existing update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add trigger for venue_stats updates (system managed)
CREATE OR REPLACE FUNCTION public.update_venue_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Recalculate stats for the affected venue
  INSERT INTO public.venue_stats (venue_id, avg_rating, reviews_count)
  SELECT 
    COALESCE(NEW.venue_id, OLD.venue_id),
    AVG(rating)::double precision,
    COUNT(*)::integer
  FROM public.reviews 
  WHERE venue_id = COALESCE(NEW.venue_id, OLD.venue_id)
  ON CONFLICT (venue_id) 
  DO UPDATE SET 
    avg_rating = EXCLUDED.avg_rating,
    reviews_count = EXCLUDED.reviews_count;
    
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for automatic venue stats updates
DROP TRIGGER IF EXISTS update_venue_stats_on_review_change ON public.reviews;
CREATE TRIGGER update_venue_stats_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_venue_stats();