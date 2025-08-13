-- Create storage buckets for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('profile-backgrounds', 'profile-backgrounds', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('venue-photos', 'venue-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('review-media', 'review-media', true, 20971520, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for profile backgrounds
CREATE POLICY "Profile backgrounds are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-backgrounds');

CREATE POLICY "Users can upload their own profile background" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile background" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile background" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for venue photos
CREATE POLICY "Venue photos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'venue-photos');

CREATE POLICY "Users can upload venue photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'venue-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own venue photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'venue-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own venue photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'venue-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for review media
CREATE POLICY "Review media is publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-media');

CREATE POLICY "Users can upload review media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own review media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own review media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add background_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN background_url TEXT,
ADD COLUMN background_color TEXT;

-- Create followers table for social features
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS on followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Followers policies
CREATE POLICY "Followers are viewable by everyone" 
ON public.followers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can follow others" 
ON public.followers 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
ON public.followers 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Add media arrays to venues and reviews
ALTER TABLE public.venues 
ADD COLUMN photos TEXT[],
ADD COLUMN videos TEXT[];

ALTER TABLE public.reviews 
ADD COLUMN photos TEXT[],
ADD COLUMN videos TEXT[];

-- Seed more venues in Fortaleza
INSERT INTO public.venues (name, category, address, lat, lng, description, price_range) VALUES
('Mucuripe Grill', 'Restaurante', 'Av. Desembargador Moreira, 2020 - Meireles, Fortaleza - CE', -3.7327, -38.4969, 'Restaurante especializado em frutos do mar com vista para o mar', '$$$'),
('Órbita Bar', 'Bar', 'Rua dos Tabajaras, 397 - Praia de Iracema, Fortaleza - CE', -3.7188, -38.5133, 'Bar moderno com música eletrônica e drinks autorais', '$$'),
('Estoril', 'Bar', 'Rua dos Tabajaras, 325 - Praia de Iracema, Fortaleza - CE', -3.7186, -38.5130, 'Bar tradicional da noite fortalezense desde 1974', '$$'),
('Santa Grelha', 'Restaurante', 'Av. Desembargador Moreira, 2338 - Meireles, Fortaleza - CE', -3.7334, -38.4961, 'Churrascaria premium com cortes especiais', '$$$'),
('Boteco Praia', 'Bar', 'Av. Beira Mar, 3980 - Mucuripe, Fortaleza - CE', -3.7280, -38.4790, 'Boteco pé na areia com petiscos e cerveja gelada', '$'),
('Coco Bambu', 'Restaurante', 'Av. Eng. Santana Jr, 3207 - Cocó, Fortaleza - CE', -3.7547, -38.4734, 'Rede famosa especializada em frutos do mar', '$$$'),
('Pirata Bar', 'Bar', 'Rua dos Tabajaras, 325 - Praia de Iracema, Fortaleza - CE', -3.7185, -38.5129, 'Bar temático com decoração de piratas e música ao vivo', '$$'),
('Cabaña Del Primo', 'Restaurante', 'Av. Beira Mar, 4260 - Mucuripe, Fortaleza - CE', -3.7290, -38.4780, 'Restaurante peruano com vista para o mar', '$$'),
('Moleskine Gastrobar', 'Bar', 'Rua Ana Bilhar, 1178 - Meireles, Fortaleza - CE', -3.7398, -38.4985, 'Gastrobar sofisticado com drinks especiais', '$$$'),
('Chico do Caranguejo', 'Restaurante', 'Av. Beira Mar, 4034 - Mucuripe, Fortaleza - CE', -3.7275, -38.4795, 'Especialista em caranguejo e frutos do mar', '$$'),
('London Pub', 'Bar', 'Rua Dragão do Mar, 80 - Praia de Iracema, Fortaleza - CE', -3.7201, -38.5145, 'Pub inglês com cervejas importadas e música rock', '$$'),
('Varanda Tropical', 'Restaurante', 'Av. Beira Mar, 3821 - Meireles, Fortaleza - CE', -3.7265, -38.4820, 'Culinária regional nordestina em ambiente tropical', '$$'),
('Hapiness', 'Boate', 'Rua Ildefonso Albano, 1030 - Meireles, Fortaleza - CE', -3.7420, -38.4910, 'Casa noturna com pista de dança e DJs renomados', '$$$'),
('Villa Azul', 'Bar', 'Av. Monsenhor Tabosa, 1001 - Praia de Iracema, Fortaleza - CE', -3.7210, -38.5160, 'Bar com vista panorâmica e ambiente descontraído', '$$'),
('Mercado dos Pinhões', 'Restaurante', 'Rua dos Pinhões, 10 - Meireles, Fortaleza - CE', -3.7380, -38.4950, 'Mercado gastronômico com diversas opções culinárias', '$$');