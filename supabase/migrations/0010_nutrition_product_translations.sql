alter table public.nutrition_products
add column if not exists name_en text,
add column if not exists name_es text;

update public.nutrition_products
set name_en = coalesce(name_en, name),
    name_es = coalesce(
      name_es,
      case id
        when '00000000-0000-4000-8000-000000000100' then 'Agua'
        when '00000000-0000-4000-8000-000000000101' then 'Azucar'
        when '00000000-0000-4000-8000-000000000102' then 'Sal'
        when '00000000-0000-4000-8000-000000000103' then 'Maltodextrina'
        when '00000000-0000-4000-8000-000000000104' then 'Miel'
        when '00000000-0000-4000-8000-000000000105' then 'Gel energetico'
        when '00000000-0000-4000-8000-000000000106' then 'Bocadillo'
        when '00000000-0000-4000-8000-000000000107' then 'Banano'
        when '00000000-0000-4000-8000-000000000108' then 'Gomitas'
        when '00000000-0000-4000-8000-000000000109' then 'Barra energetica'
        when '00000000-0000-4000-8000-000000000110' then 'Torta de arroz'
        when '00000000-0000-4000-8000-000000000111' then 'Bebida isotonica'
        when '00000000-0000-4000-8000-000000000112' then 'Coca-Cola'
        when '00000000-0000-4000-8000-000000000113' then 'Datiles'
        when '00000000-0000-4000-8000-000000000114' then 'Uvas pasas'
        when '00000000-0000-4000-8000-000000000115' then 'Pretzels'
        when '00000000-0000-4000-8000-000000000116' then 'Sandwich'
        else name
      end
    )
where product_scope = 'global';

update public.nutrition_products
set name_en = coalesce(name_en, name),
    name_es = coalesce(name_es, name)
where product_scope = 'user';

alter table public.nutrition_products
add constraint nutrition_products_name_en_required check (
  product_scope <> 'global' or nullif(btrim(name_en), '') is not null
),
add constraint nutrition_products_name_es_required check (
  product_scope <> 'global' or nullif(btrim(name_es), '') is not null
);

comment on column public.nutrition_products.name_en is
  'English display name for global nutrition products. User products may leave this null and use name.';
comment on column public.nutrition_products.name_es is
  'Spanish display name for global nutrition products. User products may leave this null and use name.';
