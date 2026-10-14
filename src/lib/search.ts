/**
 * Valor de un filtro `ilike` (contiene, sin distinguir mayúsculas) para usar dentro de
 * `.or(...)` de Supabase/PostgREST.
 *
 * Va entre comillas dobles para que comas, puntos o paréntesis del texto buscado no rompan
 * la sintaxis del filtro: sin comillas, "Ryzen, 16gb" hace fallar la consulta y "(Usado)"
 * no encuentra nada.
 */
export const ilikeOrValue = (term: string) => `"%${term.replace(/[\\"]/g, '\\$&')}%"`;
