import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/login/', '/checkout/', '/cart/'],
    },
    sitemap: 'https://www.devilgaming.com.ar/sitemap.xml',
  };
}
