-- Create venues table
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  lat double precision not null,
  lng double precision not null,
  address text,
  price_range text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.venues enable row level security;
alter table public.reviews enable row level security;

-- Basic policies
create policy if not exists "Venues are viewable by everyone"
  on public.venues for select using (true);

create policy if not exists "Users can insert their own venues"
  on public.venues for insert with check (auth.uid() = created_by);

create policy if not exists "Users can update their own venues"
  on public.venues for update using (auth.uid() = created_by);

create policy if not exists "Users can delete their own venues"
  on public.venues for delete using (auth.uid() = created_by);

create policy if not exists "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy if not exists "Users can create their own reviews"
  on public.reviews for insert with check (auth.uid() = user_id);

create policy if not exists "Users can update their own reviews"
  on public.reviews for update using (auth.uid() = user_id);

create policy if not exists "Users can delete their own reviews"
  on public.reviews for delete using (auth.uid() = user_id);

-- Timestamp trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers
create trigger set_venues_updated_at
before update on public.venues
for each row execute function public.update_updated_at_column();

create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.update_updated_at_column();

-- Aggregation view for venue ratings
create or replace view public.venue_stats as
select 
  venue_id,
  avg(rating)::float as avg_rating,
  count(*)::int as reviews_count
from public.reviews
group by venue_id;

-- Helpful indexes for simple geo queries
create index if not exists idx_venues_lat_lng on public.venues(lat, lng);
