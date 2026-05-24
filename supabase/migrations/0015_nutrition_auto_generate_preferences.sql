-- Stores per-user defaults for the nutrition auto-generate flow:
-- the ingredients the athlete actually has on hand and the maximum
-- number of bottles their bike can carry.
create table public.nutrition_auto_generate_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  restrict_to_available_products boolean not null default false,
  allowed_product_ids uuid[] not null default '{}'::uuid[],
  max_bottles integer check (max_bottles is null or (max_bottles >= 1 and max_bottles <= 10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger nutrition_auto_generate_preferences_set_updated_at
before update on public.nutrition_auto_generate_preferences
for each row execute function public.set_updated_at();

alter table public.nutrition_auto_generate_preferences enable row level security;

grant select, insert, update, delete on public.nutrition_auto_generate_preferences to authenticated;

create policy "Users can read their auto-generate preferences"
on public.nutrition_auto_generate_preferences for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their auto-generate preferences"
on public.nutrition_auto_generate_preferences for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their auto-generate preferences"
on public.nutrition_auto_generate_preferences for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their auto-generate preferences"
on public.nutrition_auto_generate_preferences for delete to authenticated
using (auth.uid() = user_id);

comment on table public.nutrition_auto_generate_preferences is
  'Per-user defaults applied to the nutrition auto-generate flow: the ingredients the user actually has available and the maximum number of bottles they can carry on the bike.';
