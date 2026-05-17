alter table public.tire_pressure_settings
add column if not exists tire_setup text not null default 'standard_tube'
check (tire_setup in ('standard_tube', 'tubeless'));
