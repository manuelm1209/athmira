-- Move any product still using the "sandwich" category to "solid_food" so we can
-- drop the category from the allowed list.
update public.nutrition_products
set category = 'solid_food'
where category = 'sandwich';

alter table public.nutrition_products
drop constraint if exists nutrition_products_category_check;

alter table public.nutrition_products
add constraint nutrition_products_category_check
check (
  category in ('bottle_ingredient', 'gel', 'bar', 'solid_food', 'drink', 'powder', 'fruit', 'candy', 'custom')
);

insert into public.nutrition_products (
  id,
  name,
  name_en,
  name_es,
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
values (
  '00000000-0000-4000-8000-000000000117',
  'Maple syrup',
  'Maple syrup',
  'Jarabe de maple',
  'bottle_ingredient',
  'global',
  null,
  20,
  'g',
  13,
  52,
  2,
  0,
  20,
  'honey',
  'Liquid sweetener with a glucose/sucrose profile similar to honey.'
)
on conflict (id) do update
set name = excluded.name,
    name_en = excluded.name_en,
    name_es = excluded.name_es,
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
