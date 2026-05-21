alter table public.profiles
add column if not exists newsletter_opt_in boolean not null default false;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name, preferred_language, newsletter_opt_in)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    case
      when new.raw_user_meta_data ->> 'preferred_language' in ('en', 'es')
        then new.raw_user_meta_data ->> 'preferred_language'
      else 'en'
    end,
    coalesce(new.raw_user_meta_data ->> 'newsletter_opt_in' = 'true', false)
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(public.profiles.name, excluded.name),
        newsletter_opt_in = public.profiles.newsletter_opt_in or excluded.newsletter_opt_in,
        updated_at = now();

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public;
revoke all on function app_private.handle_new_user() from anon;
revoke all on function app_private.handle_new_user() from authenticated;
