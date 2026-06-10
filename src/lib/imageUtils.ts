import imageCompression from 'browser-image-compression';

export const compressAndConvertToWebP = async (file: File) => {
  // CONFIGURACIÓN ACTUAL (Más agresiva para máximo ahorro)
  const options = {
    maxSizeMB: 0.2, // Apuntamos a ~200KB máximo
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp' as any,
    initialQuality: 0.6, // Compresión más fuerte
  };

  /* CONFIGURACIÓN ANTERIOR (Más calidad, más peso)
  const options = {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp' as any,
    initialQuality: 0.8,
  };
  */

  try {
    const compressedFile = await imageCompression(file, options);
    // Renombrar el archivo para asegurar la extensión .webp
    const newFile = new File([compressedFile], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
      type: 'image/webp',
      lastModified: Date.now(),
    });
    return newFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // Fallback al original
  }
};

/**
 * Converts a Supabase storage URL to the Cloudflare CDN URL.
 * If the URL is not a Supabase storage URL, it is returned unchanged.
 */
export const getCDNUrl = (url: string | null | undefined): string => {
  if (!url) return '/default-gaming-product.png';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // e.g., "https://abldpbbhlqsnufmzojgc.supabase.co"
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;           // e.g., "https://cdn.devilgaming.com"
  
  if (supabaseUrl && cdnUrl && url.startsWith(supabaseUrl)) {
    const searchString = `${supabaseUrl}/storage/v1/object/public`;
    if (url.startsWith(searchString)) {
      return url.replace(searchString, cdnUrl);
    }
  }
  return url;
};
