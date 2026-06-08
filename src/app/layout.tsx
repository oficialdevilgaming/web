import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export const metadata: Metadata = {
  title: "Devil Gaming | Elite Hardware & Gaming Setup",
  description: "Dominá tu mundo con el estándar de élite en hardware. PCs armadas, componentes premium y periféricos de alto rendimiento.",
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
