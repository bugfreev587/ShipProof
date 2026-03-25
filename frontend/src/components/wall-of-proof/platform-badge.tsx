const PLATFORMS: Record<string, { label: string; color: string; icon: string }> = {
  product_hunt: { label: "Product Hunt", color: "#FF6154", icon: "PH" },
  producthunt: { label: "Product Hunt", color: "#FF6154", icon: "PH" },
  twitter: { label: "Twitter/X", color: "#1DA1F2", icon: "X" },
  reddit: { label: "Reddit", color: "#FF4500", icon: "R" },
  hackernews: { label: "Hacker News", color: "#FF6600", icon: "Y" },
  indiehackers: { label: "IndieHackers", color: "#0E7490", icon: "IH" },
  email: { label: "Email", color: "#6B7280", icon: "E" },
  direct: { label: "Direct", color: "#22C55E", icon: "D" },
  manual: { label: "Manual", color: "#8B5CF6", icon: "M" },
  other: { label: "Other", color: "#6B7280", icon: "O" },
};

export function getPlatformInfo(platform: string) {
  return PLATFORMS[platform] || PLATFORMS.other;
}

export function PlatformBadge({ platform }: { platform: string }) {
  const info = getPlatformInfo(platform);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
      style={{ backgroundColor: info.color }}
    >
      {info.label}
    </span>
  );
}

export function PlatformAvatarBadge({ platform }: { platform: string }) {
  const info = getPlatformInfo(platform);
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white ring-2 ring-[var(--bgCard,#1A1A1F)]"
      style={{ backgroundColor: info.color }}
    >
      {info.icon.charAt(0)}
    </span>
  );
}

export function getLaunchTimeLabel(days: number): string {
  if (days === 0) return "Launch day";
  if (days === 1) return "Day 1 after launch";
  if (days < 7) return `Day ${days} after launch`;
  if (days < 14) return "Week 1 after launch";
  if (days < 21) return "Week 2 after launch";
  if (days < 30) return "Week 3 after launch";
  return `${Math.floor(days / 7)} weeks after launch`;
}
