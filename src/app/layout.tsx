import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.devilgaming.com.ar'),
  title: "Devil Gaming | PC Gamer, Hardware & Consolas",
  description: "",
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: "Devil Gaming | PC Gamer, Hardware & Consolas",
    description: "",
    url: 'https://www.devilgaming.com.ar',
    siteName: 'Devil Gaming',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/main_image.jpeg',
        width: 819,
        height: 614,
        alt: 'Devil Gaming | Elite Hardware & Gaming Setup',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Devil Gaming | PC Gamer, Hardware & Consolas",
    description: "",
    images: ['/main_image.jpeg'],
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
