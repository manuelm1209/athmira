create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  gender text,
  height_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bike_type text not null default 'road' check (bike_type in ('road', 'gravel', 'triathlon', 'mountain', 'hybrid')),
  brand text,
  model text,
  size text,
  saddle_height_mm numeric(7, 2),
  saddle_setback_mm numeric(7, 2),
  stem_length_mm numeric(7, 2),
  crank_length_mm numeric(7, 2),
  handlebar_width_mm numeric(7, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fit_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bike_id uuid references public.bikes(id) on delete set null,
  session_type text not null default 'bike_fit' check (session_type in ('bike_fit', 'aero_analysis')),
  device_type text not null check (device_type in ('web', 'ios', 'android')),
  camera_angle text not null default 'side' check (camera_angle in ('side', 'front', 'rear')),
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table public.fit_measurements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fit_sessions(id) on delete cascade,
  knee_angle_min numeric(6, 2),
  knee_angle_max numeric(6, 2),
  hip_angle_avg numeric(6, 2),
  torso_angle_avg numeric(6, 2),
  elbow_angle_avg numeric(6, 2),
  shoulder_angle_avg numeric(6, 2),
  confidence_score numeric(5, 4) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  created_at timestamptz not null default now()
);

create table public.aero_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fit_sessions(id) on delete cascade,
  estimated_frontal_area numeric(7, 4),
  torso_position_score numeric(5, 2),
  head_position_score numeric(5, 2),
  arm_compactness_score numeric(5, 2),
  stability_score numeric(5, 2),
  final_aero_score numeric(5, 2),
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fit_sessions(id) on delete cascade,
  priority text not null check (priority in ('low', 'medium', 'high')),
  category text not null check (
    category in ('saddle_height', 'saddle_position', 'reach', 'torso', 'arms', 'head', 'comfort', 'aero')
  ),
  message text not null,
  adjustment_mm numeric(7, 2),
  confidence_score numeric(5, 4) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1)),
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.fit_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('image', 'video', 'best_posture_snapshot')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index bikes_user_id_idx on public.bikes(user_id);
create index fit_sessions_user_id_idx on public.fit_sessions(user_id);
create index fit_sessions_bike_id_idx on public.fit_sessions(bike_id);
create index fit_measurements_session_id_idx on public.fit_measurements(session_id);
create index aero_scores_session_id_idx on public.aero_scores(session_id);
create index recommendations_session_id_idx on public.recommendations(session_id);
create index media_assets_user_id_idx on public.media_assets(user_id);
create index media_assets_session_id_idx on public.media_assets(session_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger bikes_set_updated_at
before update on public.bikes
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, preferred_language)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    case
      when new.raw_user_meta_data ->> 'preferred_language' in ('en', 'es')
        then new.raw_user_meta_data ->> 'preferred_language'
      else 'en'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.profiles.name, excluded.name),
        updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.bikes enable row level security;
alter table public.fit_sessions enable row level security;
alter table public.fit_measurements enable row level security;
alter table public.aero_scores enable row level security;
alter table public.recommendations enable row level security;
alter table public.media_assets enable row level security;

create policy "Users can read their profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users can insert their profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

create policy "Users can update their profile"
on public.profiles for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read their bikes"
on public.bikes for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their bikes"
on public.bikes for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their bikes"
on public.bikes for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their bikes"
on public.bikes for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can read their fit sessions"
on public.fit_sessions for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their fit sessions"
on public.fit_sessions for insert to authenticated
with check (
  auth.uid() = user_id
  and (
    bike_id is null
    or exists (
      select 1 from public.bikes
      where bikes.id = fit_sessions.bike_id
        and bikes.user_id = auth.uid()
    )
  )
);

create policy "Users can update their fit sessions"
on public.fit_sessions for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their fit sessions"
on public.fit_sessions for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can read their fit measurements"
on public.fit_measurements for select to authenticated
using (
  exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = fit_measurements.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can insert their fit measurements"
on public.fit_measurements for insert to authenticated
with check (
  exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = fit_measurements.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can read their aero scores"
on public.aero_scores for select to authenticated
using (
  exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = aero_scores.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can insert their aero scores"
on public.aero_scores for insert to authenticated
with check (
  exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = aero_scores.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can read their recommendations"
on public.recommendations for select to authenticated
using (
  exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = recommendations.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can insert their recommendations"
on public.recommendations for insert to authenticated
with check (
  exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = recommendations.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

create policy "Users can read their media assets"
on public.media_assets for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their media assets"
on public.media_assets for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.fit_sessions
    where fit_sessions.id = media_assets.session_id
      and fit_sessions.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fit-media',
  'fit-media',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can read their fit media"
on storage.objects for select to authenticated
using (
  bucket_id = 'fit-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can insert their fit media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'fit-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their fit media"
on storage.objects for update to authenticated
using (
  bucket_id = 'fit-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'fit-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their fit media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'fit-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
