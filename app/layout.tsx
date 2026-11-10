import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "./globals.css";
import { RouteTransition } from "@/components/route-transition";

const heroFont = localFont({
  src: "../node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2",
  variable: "--font-hero",
  display: "swap",
  weight: "300 900",
  preload: true,
});

export const metadata: Metadata = {
  title: "EcoScan | Um novo olhar para o descarte",
  description:
    "Fotografe um resíduo. Descubra o material e como descartá-lo com mais consciência. Identificação inteligente, sem cadastro.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#183e2d",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={heroFont.variable}>
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        {children}
        <RouteTransition />
      </body>
    </html>
  );
}
