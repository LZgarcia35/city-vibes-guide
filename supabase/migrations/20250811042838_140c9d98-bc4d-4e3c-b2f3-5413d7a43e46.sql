-- Harden function search_path
create or replace function public.update_updated_at_column()
set search_path = public
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;