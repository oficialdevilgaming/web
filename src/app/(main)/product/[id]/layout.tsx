import type { Metadata } from 'next';
import { createHash } from 'crypto';
import { getShareProduct, htmlToPlainText } from '../../../../lib/productShare';
import { formatMoney } from '../../../../lib/money';

const MAX_DESCRIPTION = 160;

/**
 * La página de producto es un componente cliente, así que los meta tags del producto
 * (título, descripción e imagen al compartir el link) se generan acá, en el servidor.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getShareProduct(id);

  // Producto inexistente u oculto: quedan los meta tags generales del sitio.
  if (!product) return {};

  const title = `${product.name} | Devil Gaming`;

  const finalPrice = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;
  const priceText = product.discount > 0
    ? `${formatMoney(finalPrice)} (${product.discount}% OFF, antes ${formatMoney(product.price)})`
    : formatMoney(finalPrice);

  let description = `${priceText} · ${htmlToPlainText(product.description)}`;
  if (description.length > MAX_DESCRIPTION) {
    description = `${description.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`;
  }

  const url = `/product/${product.id}`;

  // El parámetro "v" cambia cuando cambia la foto principal, para no servir una imagen cacheada vieja.
  const version = createHash('sha1').update(product.image ?? '').digest('hex').slice(0, 10);
  const image = {
    url: `/product/${product.id}/og?v=${version}`,
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: product.name,
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Devil Gaming',
      locale: 'es_AR',
      type: 'website',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
