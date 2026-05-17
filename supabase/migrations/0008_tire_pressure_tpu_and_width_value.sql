alter table public.tire_pressure_settings
drop constraint if exists tire_pressure_settings_tire_setup_check;

update public.tire_pressure_settings
set tire_setup = 'standard_tube'
where tire_setup = 'inner_tube';

alter table public.tire_pressure_settings
alter column tire_setup set default 'standard_tube';

alter table public.tire_pressure_settings
add constraint tire_pressure_settings_tire_setup_check
check (tire_setup in ('standard_tube', 'tpu_tube', 'tubeless'));

alter table public.tire_pressure_settings
add column if not exists tire_width_value numeric(7, 3);

update public.tire_pressure_settings
set tire_width_value = case
  when tire_width_unit = 'in' then round(tire_width_mm / 25.4, 3)
  else tire_width_mm
end
where tire_width_value is null;

alter table public.tire_pressure_settings
alter column tire_width_value set not null;

alter table public.tire_pressure_settings
drop constraint if exists tire_pressure_settings_tire_width_value_check;

alter table public.tire_pressure_settings
add constraint tire_pressure_settings_tire_width_value_check
check (tire_width_value > 0 and tire_width_value <= 120);
