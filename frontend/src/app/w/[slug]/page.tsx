import { Metadata } from "next";
import { fetchPublicWallProofs } from "@/lib/api";
import { ViewTracker } from "@/components/view-tracker";
import WallPublic from "@/components/wall-of-proof/wall-public";
import { getWallThemeColors } from "@/components/wall-of-proof/types";
import type { WallProof, WallDisplayConfig } from "@/components/wall-of-proof/types";

export const dynamic = "force-dynamic";

function pgStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  if (typeof v === "object" && v !== null && "Valid" in v) {
    const pg = v as { String: string; Valid: boolean };
    return pg.Valid ? pg.String : null;
  }
  return null;
}

function toWallProof(proof: {
  id: string;
  source_platform: string;
  author_name: string;
  author_title: string | null;
  author_avatar_url: string | null;
  content_text: string | null;
  content_image_url: string | null;
  created_at: string;
}): WallProof {
  return {
    id: proof.id,
    author_name: proof.author_name,
    author_title: pgStr(proof.author_title),
    author_avatar_url: pgStr(proof.author_avatar_url),
    content_text: pgStr(proof.content_text),
    content_image_url: pgStr(proof.content_image_url),
    source_platform: proof.source_platform,
    created_at: proof.created_at,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await fetchPublicWallProofs(slug);
    return {
      title: `${data.wall.name} — ${data.product.name} | ShipProof`,
      description: `Wall of Love for ${data.product.name}. See what people are saying!`,
    };
  } catch {
    return { title: "Wall of Love | ShipProof" };
  }
}

export default async function WallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchPublicWallProofs(slug);
  } catch {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center text-[#9CA3AF]">
        Wall not found.
      </div>
    );
  }

  const { wall, product, proofs } = data;
  const theme = getWallThemeColors(wall.theme);
  const wallProofs = proofs.map(toWallProof);

  const config: WallDisplayConfig = {
    layout: "masonry",
    theme: (wall.theme as WallDisplayConfig["theme"]) || "dark",
    columns: 3,
    showSourceBadges: wall.show_platform_icon,
    showVerifiedTags: true,
    showTimeContext: true,
    showBranding: wall.show_branding,
    borderRadius: wall.border_radius,
    cardSpacing: wall.card_spacing,
    showPlatformIcon: wall.show_platform_icon,
  };

  return (
    <div className="min-h-screen" style={{ background: theme.bgBase }}>
      <ViewTracker entityType="wall" slug={slug} />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <WallPublic
          proofs={wallProofs}
          config={config}
          header={
            wall.show_header !== false
              ? {
                  title: wall.name,
                  subtitle: wall.subtitle || undefined,
                  productName: product.name,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
