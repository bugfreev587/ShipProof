import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShipProof Wall Embed",
};

export default function EmbedWallLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      {children}
    </>
  );
}
