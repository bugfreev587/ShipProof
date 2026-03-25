import { fetchPublicWallProofs, type Proof } from "@/lib/api";
import WallPublic from "@/components/wall-of-proof/wall-public";
import type { WallProof } from "@/components/wall-of-proof/types";

function toWallProof(proof: Proof): WallProof {
  const pgStr = (v: unknown): string | null => {
    if (v == null) return null;
    if (typeof v === "string") return v || null;
    if (typeof v === "object" && v !== null && "Valid" in v) {
      const pg = v as { String: string; Valid: boolean };
      return pg.Valid ? pg.String : null;
    }
    return null;
  };

  return {
    id: proof.id,
    author_name: proof.author_name,
    author_title: pgStr(proof.author_title),
    author_avatar_url: pgStr(proof.author_avatar_url),
    content_text: pgStr(proof.content_text),
    content_image_url: pgStr(proof.content_image_url),
    source_platform: proof.source_platform,
    source_url: pgStr(proof.source_url),
    created_at: proof.created_at,
    tags: proof.tags,
  };
}

export default async function WallOfLove() {
  let proofs: Proof[] = [];
  try {
    const data = await fetchPublicWallProofs("first-wall-e9e4d4");
    proofs = data.proofs;
  } catch {
    // Wall not available
  }

  if (proofs.length === 0) return null;

  const wallProofs = proofs.map(toWallProof);

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-4 text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Loved by indie hackers
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          See what builders are saying about ShipProof
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <WallPublic
          proofs={wallProofs}
          config={{
            layout: "masonry",
            theme: "dark",
            columns: 3,
            showSourceBadges: true,
            showVerifiedTags: true,
            showTimeContext: false,
            showBranding: false,
            borderRadius: 12,
            cardSpacing: 16,
            showPlatformIcon: true,
          }}
        />
      </div>
    </section>
  );
}
