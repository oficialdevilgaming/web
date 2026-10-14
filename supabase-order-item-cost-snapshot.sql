-- Ejecutado una sola vez en el SQL Editor de Supabase (Dashboard > SQL Editor) el 14/10/2026.
--
-- Motivo: la Ganancia Neta del Lobby y la columna "Ganancia" de Pedidos tomaban el costo
-- ACTUAL de `products.cost_price`. Al eliminar un producto su costo pasaba a contarse como 0
-- (la ganancia subía) y al editar un costo cambiaban las ganancias de ventas ya hechas.
--
-- Este trigger congela el costo de cada producto dentro de `orders.items`
-- (items[].cost_price) al momento de la venta, del lado de la base de datos, así que cubre
-- el checkout de la web (rol `anon`), la creación manual y la edición de pedidos desde el
-- panel sin cambiar ese código:
--   * INSERT: el costo SIEMPRE sale de `products`. Se ignora cualquier cost_price que
--     venga en los ítems, porque el checkout es anónimo y no se confía en el navegador.
--   * UPDATE de `items`:
--       - si el ítem ya trae un cost_price numérico, se respeta (correcciones manuales
--         por SQL, como cargar el costo de un producto ya eliminado);
--       - si no (EditOrderWizard reescribe cada ítem como {id, name, price, quantity}),
--         se conserva el costo ya congelado del mismo producto en OLD.items;
--       - si tampoco existe (ítem agregado en la edición), se toma el de `products`.
--   * Si el producto ya no existe, queda cost_price = null (costo desconocido).
--
-- SECURITY DEFINER: igual que adjust_products_stock, para que funcione aunque RLS no deje
-- leer `products.cost_price` al rol `anon`.
--
-- Junto con este script se hizo un backfill único que congeló el costo vigente en los
-- pedidos existentes (respaldo previo en backup.orders_20261014, con RLS activado). Quedaron
-- sin costo los ítems de productos que ya estaban eliminados (pedidos #51, #53 y #70).

create or replace function public.orders_snapshot_item_cost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_items jsonb := '[]'::jsonb;
begin
  if new.items is null or jsonb_typeof(new.items) <> 'array' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if jsonb_typeof(old.items) = 'array' then
      previous_items := old.items;
    end if;
  end if;

  -- INSERT: siempre el costo de products (se ignora el que venga del navegador).
  -- UPDATE: costo numérico ya presente → se respeta; si no, el de OLD.items; si no, el de products.
  new.items := (
    select coalesce(jsonb_agg(
             case
               when jsonb_typeof(it) <> 'object' then it
               when tg_op = 'UPDATE' and jsonb_typeof(it->'cost_price') = 'number' then it
               else it || jsonb_build_object('cost_price', coalesce(
                 (select (prev->>'cost_price')::numeric
                    from jsonb_array_elements(previous_items) as prev
                   where prev->>'id' = it->>'id'
                     and jsonb_typeof(prev->'cost_price') = 'number'
                   limit 1),
                 (select p.cost_price from products p where p.id::text = it->>'id')
               ))
             end
             order by ord), '[]'::jsonb)
      from jsonb_array_elements(new.items) with ordinality as t(it, ord)
  );

  return new;
end;
$$;

drop trigger if exists trg_orders_snapshot_item_cost on public.orders;
create trigger trg_orders_snapshot_item_cost
  before insert or update of items on public.orders
  for each row execute function public.orders_snapshot_item_cost();

-- Control: debe listar trg_orders_snapshot_item_cost para INSERT y UPDATE, y ningún otro
-- trigger en el esquema public (verificado el 14/10/2026).
select event_object_table as tabla, trigger_name, event_manipulation as evento, action_timing as momento
  from information_schema.triggers
 where event_object_schema = 'public'
 order by 1, 2, 3;
