import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Aether Foundry",
  description:
    "Aether Foundry designs and builds software products, internal tools, and experimental projects.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f5f7fa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
