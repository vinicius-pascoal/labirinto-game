import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Labirinto 2D – Jogo Web",
  description: "Maze 2D gerado proceduralmente em Next.js com Canvas e controles WASD/Setas.",
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://labirinto.local"),
  openGraph: {
    title: "Labirinto 2D – Jogo Web",
    description: "Maze 2D gerado proceduralmente em Next.js com Canvas e controles WASD/Setas.",
    url: "https://labirinto.local",
    siteName: "Labirinto 2D",
  },
  twitter: {
    card: "summary",
    title: "Labirinto 2D – Jogo Web",
    description: "Maze 2D gerado proceduralmente em Next.js com Canvas e controles WASD/Setas.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
