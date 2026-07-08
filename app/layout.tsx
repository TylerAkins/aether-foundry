import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Aether Foundry",
  description:
    "Aether Foundry is home to software products, internal tools, games, and technical experiments.",
  icons: {
    icon: "/branding/icon.svg",
    shortcut: "/branding/icon.svg",
    apple: "/branding/icon.svg",
  },
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
