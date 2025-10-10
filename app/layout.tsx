import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bomkai - Generador de Libros con IA",
  description: "Crea libros completos usando inteligencia artificial con Claude API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {children}
      </body>
    </html>
  );
}
