create table public.footer_settings (
  id text primary key default 'primary' check (id = 'primary'),
  instagram_url text check (instagram_url is null or instagram_url ~* '^https://'),
  strava_url text check (strava_url is null or strava_url ~* '^https://'),
  x_url text check (x_url is null or x_url ~* '^https://'),
  facebook_url text check (facebook_url is null or facebook_url ~* '^https://'),
  linkedin_url text check (linkedin_url is null or linkedin_url ~* '^https://'),
  youtube_url text check (youtube_url is null or youtube_url ~* '^https://'),
  tiktok_url text check (tiktok_url is null or tiktok_url ~* '^https://'),
  app_store_url text check (app_store_url is null or app_store_url ~* '^https://'),
  google_play_url text check (google_play_url is null or google_play_url ~* '^https://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.footer_settings is
  'Public brand footer links. Readable by app visitors and editable only by platform admins.';

create trigger footer_settings_set_updated_at
before update on public.footer_settings
for each row execute function public.set_updated_at();

alter table public.footer_settings enable row level security;

grant select on public.footer_settings to anon, authenticated;
grant insert, update on public.footer_settings to authenticated;

create policy "Public can read footer settings"
on public.footer_settings for select to anon, authenticated
using (true);

create policy "Admins can insert footer settings"
on public.footer_settings for insert to authenticated
with check (
  id = 'primary'
  and exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
);

create policy "Admins can update footer settings"
on public.footer_settings for update to authenticated
using (
  exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
)
with check (
  id = 'primary'
  and exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
);

insert into public.footer_settings (id)
values ('primary')
on conflict (id) do nothing;
