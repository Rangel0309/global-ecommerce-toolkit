import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Ecommerce Toolkit",
  description:
    "Open-source profitability, advertising and market tools for global ecommerce operators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
