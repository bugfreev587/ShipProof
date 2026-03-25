import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShipProof — Turn every launch into lasting social proof",
  description:
    "AI-powered launch content + community proof wall for indie hackers",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="shipproof-theme"
            enableSystem
          >
            {children}
          </ThemeProvider>
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
