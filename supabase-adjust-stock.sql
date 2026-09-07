-- Ejecutar una sola vez en el SQL Editor de Supabase (Dashboard > SQL Editor).
--
-- Motivo: el checkout de la web llama a supabase.from('products').update({stock:...})
-- como usuario anónimo (rol `anon`). Si la tabla `products` no tiene una policy de
-- RLS que permita UPDATE a `anon`, esa llamada devuelve 200 OK pero 0 filas afectadas
-- (no lanza error), por lo que el stock nunca baja para pedidos hechos desde la web,
-- aunque sí baja cuando lo hace un admin autenticado.
--
-- Esta función corre con los privilegios de quien la creó (SECURITY DEFINER), así que
-- funciona igual para clientes anónimos y para admins autenticados, sin necesidad de
-- abrir una policy de UPDATE directa sobre `products` (que permitiría a cualquiera con
-- la anon key pública modificar el stock libremente vía API).
--
-- De paso, al hacer el ajuste dentro de un solo UPDATE por producto (y todos los
-- productos de un pedido en una sola llamada RPC), se evita la condición de carrera
-- de "leer stock, calcular, escribir" que tenía el código anterior en varios lugares
-- (dos compras simultáneas del mismo producto podían leer el mismo stock y pisarse).

create or replace function public.adjust_products_stock(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    update products
    set stock = greatest(0, stock - ((item->>'delta')::numeric)::integer)
    where id = (item->>'id')::uuid;
  end loop;
end;
$$;

-- delta positivo = descuenta stock (venta / reactivar pedido cancelado)
-- delta negativo = repone stock (cancelar pedido / eliminar pedido / bajar cantidad)

grant execute on function public.adjust_products_stock(jsonb) to anon, authenticated;
