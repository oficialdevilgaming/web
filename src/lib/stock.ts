import { supabase } from './supabase';

export type StockAdjustment = { id: string; delta: number };

/**
 * Ajusta el stock de uno o más productos de forma atómica llamando a la función
 * `adjust_products_stock` en Supabase (ver supabase-adjust-stock.sql).
 *
 * delta positivo descuenta stock (venta / reactivar pedido cancelado).
 * delta negativo repone stock (cancelar pedido / eliminar pedido / bajar cantidad).
 *
 * Corre con SECURITY DEFINER en la base de datos, así que funciona igual para
 * clientes anónimos (checkout de la web) y para admins autenticados (panel admin),
 * a diferencia de un UPDATE directo sobre `products`, que RLS puede bloquear
 * silenciosamente para el rol `anon`.
 */
export async function adjustStock(items: StockAdjustment[]) {
  const filtered = items.filter(i => i.delta !== 0);
  if (filtered.length === 0) return { error: null };

  const { error } = await supabase.rpc('adjust_products_stock', { items: filtered });
  if (error) {
    console.error('Error al ajustar stock:', error);
  }
  return { error };
}
