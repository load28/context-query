import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Context Query - Next.js Example",
  description: "Example of using @context-query/core with Next.js",
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
