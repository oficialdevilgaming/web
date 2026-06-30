/**
 * Categorías que siempre deben mostrarse en la tienda,
 * aunque no tengan productos visibles (is_hidden = false).
 *
 * La comparación se hace en minúsculas para evitar problemas
 * por mayúsculas, tildes o variaciones de escritura.
 */
export const ALWAYS_VISIBLE_CATEGORY_NAMES: string[] = [
  'pc armadas',
  'placa de video outlet',
];

/**
 * Devuelve true si la categoría debe mostrarse siempre,
 * independientemente de si tiene productos visibles.
 */
export function isAlwaysVisibleCategory(categoryName: string): boolean {
  return ALWAYS_VISIBLE_CATEGORY_NAMES.includes(categoryName.toLowerCase().trim());
}
