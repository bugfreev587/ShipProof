import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShipProof Embed",
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ background: "transparent" }}>
      <head>
        <style>{`html, body { background: transparent !important; }`}</style>
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        style={{ background: "transparent" }}
      >
        {children}
      </body>
    </html>
  );
}
