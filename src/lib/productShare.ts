import { createClient } from '@supabase/supabase-js';

/**
 * Datos de un producto para la vista previa al compartir el link (WhatsApp, Facebook, etc.).
 * Se leen en el servidor porque los crawlers no ejecutan el JS de la página de producto.
 */
export interface ShareProduct {
  id: string;
  name: string;
  price: number;
  discount: number;
  description: string;
  image: string | null;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const getShareProduct = async (id: string): Promise<ShareProduct | null> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, discount, description, images, is_hidden')
    .eq('id', id)
    .maybeSingle();

  if (error || !data || data.is_hidden) return null;

  return {
    id: data.id,
    name: (data.name ?? '').trim(),
    price: Number(data.price) || 0,
    discount: Number(data.discount) || 0,
    description: data.description ?? '',
    image: data.images?.[0] ?? null,
  };
};

/** Texto plano a partir de la descripción HTML del editor, para usar en meta tags. */
export const htmlToPlainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
