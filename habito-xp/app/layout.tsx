import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs' // O poderoso Clerk aqui!

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lucrô",
  description: "Gestor de Rendas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}