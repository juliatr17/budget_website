import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moj Budzet",
  description: "System do zarzadzania budzetem osobistym",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
