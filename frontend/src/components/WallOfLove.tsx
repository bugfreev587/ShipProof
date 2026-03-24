import { fetchPublicWallProofs, type Proof } from "@/lib/api";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";

const PLATFORM_COLORS: Record<string, string> = {
  product_hunt: "bg-red-500",
  reddit: "bg-orange-500",
  twitter: "bg-zinc-700",
  hackernews: "bg-orange-400",
  indiehackers: "bg-blue-500",
  direct: "bg-green-500",
  other: "bg-gray-500",
};

type PgText = { String: string; Valid: boolean } | string | null;

function pgStr(v: PgText): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  return v.Valid ? v.String : null;
}

function TestimonialCard({ proof }: { proof: Proof }) {
  const authorTitle = pgStr(proof.author_title as PgText);
  const contentText = pgStr(proof.content_text as PgText);
  const contentImageUrl = pgStr(proof.content_image_url as PgText);
  const companyLogoUrl = getCompanyLogoUrl(authorTitle);

  return (
    <div className="break-inside-avoid mb-4 rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-5 hover:border-[#3F3F46] transition-colors relative">
      {companyLogoUrl && <CompanyLogoImg url={companyLogoUrl} />}
      <div className="flex items-center gap-3 mb-3">
        {proof.author_avatar_url ? (
          <img
            src={proof.author_avatar_url}
            alt={proof.author_name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
          >
            {proof.author_name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <div className="text-sm font-semibold text-white">
            {proof.author_name}
          </div>
          {authorTitle && (
            <div className="text-xs text-[#6B7280] mt-0.5">{authorTitle}</div>
          )}
        </div>
      </div>
      {contentText && (
        <p className="text-sm leading-relaxed text-[#9CA3AF]">
          {contentText}
        </p>
      )}
      {contentImageUrl && (
        <img
          src={contentImageUrl.replace(/^https?:\/\/https?:\/\//, "https://")}
          alt="Proof"
          className="mt-3 w-full rounded-lg border border-[#2A2A30]"
        />
      )}
    </div>
  );
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

  return (
    <section className="border-t border-[#2A2A30] py-20">
      <div className="mx-auto max-w-6xl px-4 text-center mb-10">
        <h2 className="text-[28px] font-medium text-white">
          Loved by indie hackers
        </h2>
        <p className="mt-2 text-sm text-[#8B8B92]">
          See what builders are saying about ShipProof
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: "16px" }}>
          {proofs.map((proof) => (
            <TestimonialCard key={proof.id} proof={proof} />
          ))}
        </div>
      </div>
    </section>
  );
}
