const COMPANY_DOMAINS: Record<string, string> = {
  meta: "meta.com",
  facebook: "meta.com",
  google: "google.com",
  apple: "apple.com",
  amazon: "amazon.com",
  microsoft: "microsoft.com",
  netflix: "netflix.com",
  twitter: "x.com",
  x: "x.com",
  stripe: "stripe.com",
  shopify: "shopify.com",
  vercel: "vercel.com",
  github: "github.com",
  gitlab: "gitlab.com",
  slack: "slack.com",
  spotify: "spotify.com",
  uber: "uber.com",
  airbnb: "airbnb.com",
  linkedin: "linkedin.com",
  salesforce: "salesforce.com",
  adobe: "adobe.com",
  oracle: "oracle.com",
  ibm: "ibm.com",
  intel: "intel.com",
  nvidia: "nvidia.com",
  tesla: "tesla.com",
  snap: "snap.com",
  snapchat: "snap.com",
  tiktok: "tiktok.com",
  bytedance: "bytedance.com",
  figma: "figma.com",
  notion: "notion.so",
  datadog: "datadoghq.com",
  twilio: "twilio.com",
  cloudflare: "cloudflare.com",
  mongodb: "mongodb.com",
  supabase: "supabase.com",
  hashicorp: "hashicorp.com",
  atlassian: "atlassian.com",
  jira: "atlassian.com",
  dropbox: "dropbox.com",
  zoom: "zoom.us",
  pinterest: "pinterest.com",
  reddit: "reddit.com",
  discord: "discord.com",
  paypal: "paypal.com",
  square: "squareup.com",
  block: "block.xyz",
  coinbase: "coinbase.com",
  robinhood: "robinhood.com",
  plaid: "plaid.com",
};

export function extractCompanyDomain(authorTitle: string | null): string | null {
  if (!authorTitle) return null;

  const title = authorTitle.trim();

  // Patterns: "... at Company", "... @ Company", "... | Company", "... , Company", "ex-Company"
  const patterns = [
    /\bat\s+(.+)$/i,
    /\b@\s*(.+)$/i,
    /\|\s*(.+)$/,
    /,\s*(.+)$/,
    /\bex[- ](.+)$/i,
    /\bformerly\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const company = match[1].trim();
      if (company) {
        const key = company.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (COMPANY_DOMAINS[key]) return COMPANY_DOMAINS[key];
        // Fallback: use company name as domain
        const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (slug.length >= 2) return `${slug}.com`;
      }
    }
  }

  return null;
}

export function getCompanyLogoUrl(authorTitle: string | null): string | null {
  const domain = extractCompanyDomain(authorTitle);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
