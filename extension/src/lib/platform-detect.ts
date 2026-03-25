export function detectPlatform(url: string): string {
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("producthunt.com")) return "product_hunt";
  if (url.includes("news.ycombinator.com")) return "hackernews";
  if (url.includes("indiehackers.com")) return "indiehackers";
  return "other";
}

export const PLATFORM_OPTIONS = [
  { value: "product_hunt", label: "Product Hunt" },
  { value: "reddit", label: "Reddit" },
  { value: "twitter", label: "Twitter / X" },
  { value: "hackernews", label: "Hacker News" },
  { value: "indiehackers", label: "IndieHackers" },
  { value: "direct", label: "Direct" },
  { value: "other", label: "Other" },
] as const;
