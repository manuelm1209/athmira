alter table public.tire_pressure_settings
add column if not exists tire_setup text not null default 'inner_tube'
check (tire_setup in ('inner_tube', 'tubeless'));
