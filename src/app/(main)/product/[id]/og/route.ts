import sharp from 'sharp';
import { getShareProduct } from '../../../../../lib/productShare';
import { getCDNUrl } from '../../../../../lib/imageUtils';

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Imagen de vista previa (og:image) de un producto: la foto principal centrada en 1200x630
 * sobre un fondo desenfocado que continúa sus bordes, en JPEG. Las fotos se guardan en WebP,
 * formato que WhatsApp no siempre muestra en las vistas previas.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fallback = Response.redirect(new URL('/main_image.jpeg', request.url), 307);

  try {
    const product = await getShareProduct(id);
    if (!product?.image) return fallback;

    const res = await fetch(new URL(getCDNUrl(product.image), request.url));
    if (!res.ok) return fallback;
    const source = Buffer.from(await res.arrayBuffer());

    const foreground = await sharp(source)
      .flatten({ background: '#ffffff' })
      .resize(WIDTH, HEIGHT, { fit: 'inside' })
      .toBuffer({ resolveWithObject: true });
    const left = Math.floor((WIDTH - foreground.info.width) / 2);
    const top = Math.floor((HEIGHT - foreground.info.height) / 2);

    // El fondo continúa los bordes de la foto (una foto con fondo blanco queda con costados blancos).
    const extended = await sharp(foreground.data)
      .extend({
        top,
        bottom: HEIGHT - foreground.info.height - top,
        left,
        right: WIDTH - foreground.info.width - left,
        extendWith: 'copy',
      })
      .toBuffer();
    const background = await sharp(extended).blur(30).toBuffer();

    const jpeg = await sharp(background)
      .composite([{ input: foreground.data, left, top }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(jpeg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Error generating product share image:', err);
    return fallback;
  }
}
