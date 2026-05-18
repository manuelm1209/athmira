create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  activity_type text not null check (
    activity_type in ('cycling', 'running', 'triathlon', 'gravel', 'mountain_biking', 'indoor_cycling', 'hiking', 'other')
  ),
  duration_minutes integer not null check (duration_minutes > 0),
  intensity text not null default 'moderate' check (intensity in ('easy', 'moderate', 'hard', 'race_effort')),
  body_weight_kg numeric(6, 2) check (body_weight_kg is null or (body_weight_kg > 0 and body_weight_kg <= 300)),
  target_carbs_per_hour numeric(7, 2) check (target_carbs_per_hour is null or target_carbs_per_hour >= 0),
  target_fluids_ml_per_hour numeric(8, 2) check (target_fluids_ml_per_hour is null or target_fluids_ml_per_hour >= 0),
  target_sodium_mg_per_hour numeric(8, 2) check (target_sodium_mg_per_hour is null or target_sodium_mg_per_hour >= 0),
  estimated_calories_burned numeric(9, 2) check (estimated_calories_burned is null or estimated_calories_burned >= 0),
  total_planned_carbs numeric(9, 2) not null default 0 check (total_planned_carbs >= 0),
  total_planned_fluids_ml numeric(9, 2) not null default 0 check (total_planned_fluids_ml >= 0),
  total_planned_sodium_mg numeric(9, 2) not null default 0 check (total_planned_sodium_mg >= 0),
  total_planned_calories numeric(9, 2) not null default 0 check (total_planned_calories >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (
    category in ('bottle_ingredient', 'gel', 'bar', 'solid_food', 'drink', 'powder', 'fruit', 'candy', 'sandwich', 'custom')
  ),
  product_scope text not null check (product_scope in ('global', 'user')),
  user_id uuid references auth.users(id) on delete cascade,
  default_serving_size numeric(9, 2),
  default_serving_unit text,
  carbs_per_serving numeric(9, 2) not null default 0 check (carbs_per_serving >= 0),
  calories_per_serving numeric(9, 2) not null default 0 check (calories_per_serving >= 0),
  sodium_mg_per_serving numeric(9, 2) not null default 0 check (sodium_mg_per_serving >= 0),
  liquid_volume_ml_per_serving numeric(9, 2) not null default 0 check (liquid_volume_ml_per_serving >= 0),
  weight_g_per_serving numeric(9, 2) not null default 0 check (weight_g_per_serving >= 0),
  icon_key text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_products_scope_owner_check check (
    (product_scope = 'global' and user_id is null)
    or (product_scope = 'user' and user_id is not null)
  ),
  constraint nutrition_products_serving_size_check check (
    default_serving_size is null or default_serving_size > 0
  )
);

create table public.nutrition_plan_bottles (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  bottle_size_ml numeric(8, 2) not null check (bottle_size_ml > 0),
  bottle_size_label text,
  display_order integer not null default 0,
  total_used_volume_ml numeric(9, 2) not null default 0 check (total_used_volume_ml >= 0),
  remaining_water_ml numeric(9, 2) not null default 0 check (remaining_water_ml >= 0),
  total_carbs numeric(9, 2) not null default 0 check (total_carbs >= 0),
  total_sodium_mg numeric(9, 2) not null default 0 check (total_sodium_mg >= 0),
  total_calories numeric(9, 2) not null default 0 check (total_calories >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.nutrition_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  bottle_id uuid references public.nutrition_plan_bottles(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.nutrition_products(id),
  quantity numeric(9, 2) not null check (quantity > 0),
  unit text,
  serving_multiplier numeric(9, 4) not null default 1 check (serving_multiplier > 0),
  location text not null check (location in ('bottle', 'carried', 'before', 'during', 'after')),
  timing_type text check (timing_type is null or timing_type in ('start', 'every_30', 'every_45', 'hourly', 'custom')),
  timing_minute integer check (timing_minute is null or timing_minute >= 0),
  calculated_carbs numeric(9, 2) not null default 0 check (calculated_carbs >= 0),
  calculated_calories numeric(9, 2) not null default 0 check (calculated_calories >= 0),
  calculated_sodium_mg numeric(9, 2) not null default 0 check (calculated_sodium_mg >= 0),
  calculated_volume_ml numeric(9, 2) not null default 0 check (calculated_volume_ml >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_plan_items_bottle_location_check check (
    (location = 'bottle' and bottle_id is not null)
    or (location <> 'bottle')
  )
);

create index nutrition_plans_user_id_idx on public.nutrition_plans(user_id);
create index nutrition_plans_updated_at_idx on public.nutrition_plans(updated_at desc);
create index nutrition_products_scope_idx on public.nutrition_products(product_scope, is_active);
create index nutrition_products_user_id_idx on public.nutrition_products(user_id);
create unique index nutrition_products_global_name_idx
on public.nutrition_products(lower(name))
where product_scope = 'global';
create unique index nutrition_products_user_name_idx
on public.nutrition_products(user_id, lower(name))
where product_scope = 'user' and is_active = true;
create index nutrition_plan_bottles_plan_id_idx on public.nutrition_plan_bottles(plan_id);
create index nutrition_plan_bottles_user_id_idx on public.nutrition_plan_bottles(user_id);
create index nutrition_plan_items_plan_id_idx on public.nutrition_plan_items(plan_id);
create index nutrition_plan_items_bottle_id_idx on public.nutrition_plan_items(bottle_id);
create index nutrition_plan_items_user_id_idx on public.nutrition_plan_items(user_id);
create index nutrition_plan_items_product_id_idx on public.nutrition_plan_items(product_id);

create trigger nutrition_plans_set_updated_at
before update on public.nutrition_plans
for each row execute function public.set_updated_at();

create trigger nutrition_products_set_updated_at
before update on public.nutrition_products
for each row execute function public.set_updated_at();

create trigger nutrition_plan_bottles_set_updated_at
before update on public.nutrition_plan_bottles
for each row execute function public.set_updated_at();

create trigger nutrition_plan_items_set_updated_at
before update on public.nutrition_plan_items
for each row execute function public.set_updated_at();

create or replace function app_private.enforce_custom_nutrition_product_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  custom_product_count integer;
begin
  if new.product_scope <> 'user' then
    return new;
  end if;

  if new.user_id is null then
    raise exception 'Custom nutrition products require a user_id.';
  end if;

  if tg_op = 'UPDATE'
    and old.product_scope = 'user'
    and old.user_id = new.user_id then
    return new;
  end if;

  select count(*)
  into custom_product_count
  from public.nutrition_products
  where product_scope = 'user'
    and user_id = new.user_id
    and is_active = true;

  if custom_product_count >= 15 then
    raise exception 'Custom nutrition products are limited to 15 per user.';
  end if;

  return new;
end;
$$;

create trigger nutrition_products_custom_limit
before insert or update of product_scope, user_id on public.nutrition_products
for each row execute function app_private.enforce_custom_nutrition_product_limit();

revoke all on function app_private.enforce_custom_nutrition_product_limit() from public;
revoke all on function app_private.enforce_custom_nutrition_product_limit() from anon;
revoke all on function app_private.enforce_custom_nutrition_product_limit() from authenticated;

alter table public.nutrition_plans enable row level security;
alter table public.nutrition_products enable row level security;
alter table public.nutrition_plan_bottles enable row level security;
alter table public.nutrition_plan_items enable row level security;

grant select, insert, update, delete on public.nutrition_plans to authenticated;
grant select, insert, update, delete on public.nutrition_products to authenticated;
grant select, insert, update, delete on public.nutrition_plan_bottles to authenticated;
grant select, insert, update, delete on public.nutrition_plan_items to authenticated;

create policy "Users can read their nutrition plans"
on public.nutrition_plans for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their nutrition plans"
on public.nutrition_plans for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their nutrition plans"
on public.nutrition_plans for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their nutrition plans"
on public.nutrition_plans for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can read nutrition products"
on public.nutrition_products for select to authenticated
using (
  (product_scope = 'global' and is_active = true)
  or (product_scope = 'user' and auth.uid() = user_id)
  or exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
);

create policy "Users can insert custom nutrition products"
on public.nutrition_products for insert to authenticated
with check (
  product_scope = 'user'
  and auth.uid() = user_id
);

create policy "Users can update custom nutrition products"
on public.nutrition_products for update to authenticated
using (
  product_scope = 'user'
  and auth.uid() = user_id
)
with check (
  product_scope = 'user'
  and auth.uid() = user_id
);

create policy "Users can delete custom nutrition products"
on public.nutrition_products for delete to authenticated
using (
  product_scope = 'user'
  and auth.uid() = user_id
);

create policy "Admins can insert global nutrition products"
on public.nutrition_products for insert to authenticated
with check (
  product_scope = 'global'
  and user_id is null
  and exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
);

create policy "Admins can update global nutrition products"
on public.nutrition_products for update to authenticated
using (
  product_scope = 'global'
  and exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
)
with check (
  product_scope = 'global'
  and user_id is null
  and exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
);

create policy "Admins can delete global nutrition products"
on public.nutrition_products for delete to authenticated
using (
  product_scope = 'global'
  and exists (
    select 1 from public.admin_roles
    where admin_roles.user_id = auth.uid()
  )
);

create policy "Users can read their nutrition bottles"
on public.nutrition_plan_bottles for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their nutrition bottles"
on public.nutrition_plan_bottles for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = nutrition_plan_bottles.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

create policy "Users can update their nutrition bottles"
on public.nutrition_plan_bottles for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = nutrition_plan_bottles.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
);

create policy "Users can delete their nutrition bottles"
on public.nutrition_plan_bottles for delete to authenticated
using (auth.uid() = user_id);

create policy "Users can read their nutrition plan items"
on public.nutrition_plan_items for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their nutrition plan items"
on public.nutrition_plan_items for insert to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = nutrition_plan_items.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
  and (
    bottle_id is null
    or exists (
      select 1 from public.nutrition_plan_bottles
      where nutrition_plan_bottles.id = nutrition_plan_items.bottle_id
        and nutrition_plan_bottles.plan_id = nutrition_plan_items.plan_id
        and nutrition_plan_bottles.user_id = auth.uid()
    )
  )
  and exists (
    select 1 from public.nutrition_products
    where nutrition_products.id = nutrition_plan_items.product_id
      and (
        (nutrition_products.product_scope = 'global' and nutrition_products.is_active = true)
        or (nutrition_products.product_scope = 'user' and nutrition_products.user_id = auth.uid())
      )
  )
);

create policy "Users can update their nutrition plan items"
on public.nutrition_plan_items for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.nutrition_plans
    where nutrition_plans.id = nutrition_plan_items.plan_id
      and nutrition_plans.user_id = auth.uid()
  )
  and (
    bottle_id is null
    or exists (
      select 1 from public.nutrition_plan_bottles
      where nutrition_plan_bottles.id = nutrition_plan_items.bottle_id
        and nutrition_plan_bottles.plan_id = nutrition_plan_items.plan_id
        and nutrition_plan_bottles.user_id = auth.uid()
    )
  )
);

create policy "Users can delete their nutrition plan items"
on public.nutrition_plan_items for delete to authenticated
using (auth.uid() = user_id);

insert into public.nutrition_products (
  id,
  name,
  category,
  product_scope,
  user_id,
  default_serving_size,
  default_serving_unit,
  carbs_per_serving,
  calories_per_serving,
  sodium_mg_per_serving,
  liquid_volume_ml_per_serving,
  weight_g_per_serving,
  icon_key,
  notes
)
values
  ('00000000-0000-4000-8000-000000000100', 'Water', 'drink', 'global', null, 500, 'ml', 0, 0, 0, 500, 0, 'water', 'Plain water for bottle planning.'),
  ('00000000-0000-4000-8000-000000000101', 'Sugar', 'bottle_ingredient', 'global', null, 10, 'g', 10, 40, 0, 0, 10, 'sugar', 'Simple carbohydrate bottle ingredient.'),
  ('00000000-0000-4000-8000-000000000102', 'Salt', 'bottle_ingredient', 'global', null, 1, 'g', 0, 0, 390, 0, 1, 'salt', 'Approximate sodium value for table salt.'),
  ('00000000-0000-4000-8000-000000000103', 'Maltodextrin', 'powder', 'global', null, 10, 'g', 10, 40, 0, 0, 10, 'powder', 'Neutral carbohydrate powder for bottles.'),
  ('00000000-0000-4000-8000-000000000104', 'Honey', 'bottle_ingredient', 'global', null, 21, 'g', 17, 64, 0, 0, 21, 'honey', 'Liquid carbohydrate ingredient.'),
  ('00000000-0000-4000-8000-000000000105', 'Energy gel', 'gel', 'global', null, 1, 'gel', 25, 100, 50, 0, 35, 'gel', 'Typical single-serve endurance gel.'),
  ('00000000-0000-4000-8000-000000000106', 'Bocadillo', 'candy', 'global', null, 30, 'g', 24, 90, 10, 0, 30, 'candy', 'Guava-style solid fuel.'),
  ('00000000-0000-4000-8000-000000000107', 'Banana', 'fruit', 'global', null, 120, 'g', 27, 105, 1, 0, 120, 'banana', 'Medium banana estimate.'),
  ('00000000-0000-4000-8000-000000000108', 'Gummies', 'candy', 'global', null, 30, 'g', 23, 90, 20, 0, 30, 'candy', 'Chewable carbohydrate candy.'),
  ('00000000-0000-4000-8000-000000000109', 'Energy bar', 'bar', 'global', null, 1, 'bar', 35, 180, 150, 0, 60, 'bar', 'Typical endurance energy bar.'),
  ('00000000-0000-4000-8000-000000000110', 'Rice cake', 'solid_food', 'global', null, 1, 'unit', 20, 90, 100, 0, 50, 'rice', 'Portable ride food estimate.'),
  ('00000000-0000-4000-8000-000000000111', 'Isotonic drink', 'drink', 'global', null, 500, 'ml', 30, 120, 300, 500, 0, 'bottle', 'Ready-to-drink sports drink estimate.'),
  ('00000000-0000-4000-8000-000000000112', 'Coca-Cola', 'drink', 'global', null, 355, 'ml', 39, 140, 45, 355, 0, 'drink', 'Common race-aid-station cola estimate.'),
  ('00000000-0000-4000-8000-000000000113', 'Dates', 'fruit', 'global', null, 1, 'date', 18, 66, 0, 0, 24, 'dates', 'Medjool date estimate.'),
  ('00000000-0000-4000-8000-000000000114', 'Raisins', 'fruit', 'global', null, 40, 'g', 31, 120, 5, 0, 40, 'raisins', 'Dried fruit carbohydrate source.'),
  ('00000000-0000-4000-8000-000000000115', 'Pretzels', 'solid_food', 'global', null, 30, 'g', 24, 110, 350, 0, 30, 'pretzel', 'Salty carbohydrate snack.'),
  ('00000000-0000-4000-8000-000000000116', 'Sandwich', 'sandwich', 'global', null, 1, 'unit', 40, 250, 500, 0, 140, 'sandwich', 'Simple endurance sandwich estimate.')
on conflict (id) do update
set name = excluded.name,
    category = excluded.category,
    default_serving_size = excluded.default_serving_size,
    default_serving_unit = excluded.default_serving_unit,
    carbs_per_serving = excluded.carbs_per_serving,
    calories_per_serving = excluded.calories_per_serving,
    sodium_mg_per_serving = excluded.sodium_mg_per_serving,
    liquid_volume_ml_per_serving = excluded.liquid_volume_ml_per_serving,
    weight_g_per_serving = excluded.weight_g_per_serving,
    icon_key = excluded.icon_key,
    notes = excluded.notes,
    is_active = true,
    updated_at = now();

comment on table public.nutrition_plans is
  'Authenticated athlete-owned endurance fueling plan headers and calculated plan totals.';
comment on table public.nutrition_products is
  'Global system nutrition products and user-owned custom products. Users cannot edit global products through RLS.';
comment on table public.nutrition_plan_bottles is
  'Bottle/caramanola configuration and calculated ingredient capacity for nutrition plans.';
comment on table public.nutrition_plan_items is
  'Products assigned to a plan, either carried separately, timed around the workout, or placed inside a bottle.';
