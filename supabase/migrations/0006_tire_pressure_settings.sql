create table public.tire_pressure_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bike_id uuid references public.bikes(id) on delete cascade,
  bike_type text not null check (bike_type in ('road', 'gravel', 'triathlon', 'mountain', 'hybrid')),
  tire_width_mm numeric(6, 2) not null check (tire_width_mm >= 18 and tire_width_mm <= 90),
  tire_width_unit text not null default 'mm' check (tire_width_unit in ('mm', 'in')),
  rider_weight_kg numeric(6, 2) not null check (rider_weight_kg >= 30 and rider_weight_kg <= 250),
  front_pressure_psi numeric(6, 2) not null,
  rear_pressure_psi numeric(6, 2) not null,
  surface_recommendations jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tire_pressure_settings_user_id_idx on public.tire_pressure_settings(user_id);
create index tire_pressure_settings_bike_id_idx on public.tire_pressure_settings(bike_id);
create index tire_pressure_settings_created_at_idx on public.tire_pressure_settings(created_at desc);

create trigger tire_pressure_settings_set_updated_at
before update on public.tire_pressure_settings
for each row execute function public.set_updated_at();

alter table public.tire_pressure_settings enable row level security;

create policy "Users can read their tire pressure settings"
on public.tire_pressure_settings for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their tire pressure settings"
on public.tire_pressure_settings for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    bike_id is null
    or exists (
      select 1 from public.bikes
      where bikes.id = tire_pressure_settings.bike_id
        and bikes.user_id = auth.uid()
    )
  )
);

create policy "Users can update their tire pressure settings"
on public.tire_pressure_settings for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    bike_id is null
    or exists (
      select 1 from public.bikes
      where bikes.id = tire_pressure_settings.bike_id
        and bikes.user_id = auth.uid()
    )
  )
);

create policy "Users can delete their tire pressure settings"
on public.tire_pressure_settings for delete to authenticated
using (auth.uid() = user_id);
