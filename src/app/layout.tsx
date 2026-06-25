import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.devilgaming.com.ar'),
  title: "Devil Gaming | Elite Hardware & Gaming Setup",
  description: "Dominá tu mundo con el estándar de élite en hardware. PCs armadas, componentes premium y periféricos de alto rendimiento.",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: "Devil Gaming | Elite Hardware & Gaming Setup",
    description: "Dominá tu mundo con el estándar de élite en hardware. PCs armadas, componentes premium y periféricos de alto rendimiento.",
    url: 'https://www.devilgaming.com.ar',
    siteName: 'Devil Gaming',
    locale: 'es_AR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body suppressHydrationWarning={true}>
        <AppRouterCacheProvider>
          <Providers>
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
