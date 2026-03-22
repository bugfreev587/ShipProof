"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Platform } from "./data";

export type LaunchDay = "mon" | "tue" | "wed" | "thu" | "fri";

const DAYS: { id: LaunchDay; label: string; recommended: boolean }[] = [
  { id: "mon", label: "Mon", recommended: false },
  { id: "tue", label: "Tue", recommended: true },
  { id: "wed", label: "Wed", recommended: true },
  { id: "thu", label: "Thu", recommended: true },
  { id: "fri", label: "Fri", recommended: false },
];

const DAY_INDEX: Record<LaunchDay, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function weekdayName(launchDay: LaunchDay, offset: number): string {
  const base = DAY_INDEX[launchDay];
  const idx = ((base + offset) % 7 + 7) % 7;
  return WEEKDAY_NAMES[idx];
}

const platformLabels: Record<Platform, string> = {
  ph: "Product Hunt",
  reddit: "Reddit",
  hn: "Hacker News",
  twitter: "Twitter / X",
  ih: "IndieHackers",
};

const platformBadgeLabels: Record<Platform, string> = {
  ph: "PH",
  reddit: "Reddit",
  hn: "HN",
  twitter: "X",
  ih: "IH",
};

// ---------------------------------------------------------------------------
// Timeline data types
// ---------------------------------------------------------------------------

type SectionPlatform = Platform | "all" | "evening" | "content-prep" | "platform-prep";

interface TimelineSection {
  platform: SectionPlatform;
  time?: string;
  title: string;
  items: string[];
  cta?: { text: string; href: string };
}

type Variant = "prep" | "warning" | "launch" | "post" | "collect";

interface TimelineEntryDef {
  dayOffset: number;
  label: string;
  variant: Variant;
  sections: TimelineSection[];
}

// ---------------------------------------------------------------------------
// Timeline content definitions
// ---------------------------------------------------------------------------

function buildTimeline(selectedPlatforms: Set<Platform>): TimelineEntryDef[] {
  const has = (p: Platform) => selectedPlatforms.has(p);

  const entries: TimelineEntryDef[] = [];

  // Day -7 to -3: Build anticipation
  {
    const platformPrep: string[] = [];
    if (has("ph"))
      platformPrep.push(
        "PH: Create Coming Soon page, engage in community (comment, upvote)"
      );
    if (has("reddit"))
      platformPrep.push(
        "Reddit: Participate in target subreddits (don\u2019t promote yet)"
      );
    if (has("hn"))
      platformPrep.push("HN: Build karma by commenting on relevant posts");
    if (has("twitter"))
      platformPrep.push(
        "Twitter: Share build-in-public content, hint at upcoming launch"
      );
    if (has("ih")) platformPrep.push("IH: Be active in discussions");

    entries.push({
      dayOffset: -7,
      label: "Build anticipation",
      variant: "prep",
      sections: [
        ...(platformPrep.length > 0
          ? [
              {
                platform: "platform-prep" as SectionPlatform,
                title: "Platform prep",
                items: platformPrep,
              },
            ]
          : []),
        {
          platform: "content-prep" as SectionPlatform,
          title: "Content prep",
          items: [
            "Generate launch copy for all platforms with AI",
            "Review and edit all generated content",
            "Prepare visual assets (screenshots, GIF, demo video)",
            "Draft your PH Maker\u2019s Comment (personal story version)",
          ],
          cta: { text: "Generate with ShipProof \u2192", href: "/" },
        },
      ],
    });
  }

  // Day -2: Final prep
  entries.push({
    dayOffset: -2,
    label: "Final prep",
    variant: "prep",
    sections: [
      {
        platform: "all",
        title: "ALL",
        items: [
          "Confirm all launch assets ready (images, copy, links)",
          "Test your website: landing page loads fast, signup works, payment works",
          "Test Widget embed and Wall page",
          "Notify friends and early supporters about launch date",
          "Early bedtime if PH launch is tomorrow (midnight launch!)",
        ],
      },
    ],
  });

  // Day -1: Pre-launch buzz
  {
    const sections: TimelineSection[] = [];
    if (has("twitter")) {
      sections.push({
        platform: "twitter",
        time: "9:00 AM PT",
        title: "TWITTER",
        items: [
          "Post a pre-launch thread: your story, what the product does, \u201cLaunching on Product Hunt tomorrow\u201d",
          "No product link in main thread (save for replies)",
          "Pin thread to profile",
          "DM 10\u201320 builder friends: \u201cHey, launching on PH tomorrow, would love your support\u201d",
        ],
      });
    }
    sections.push({
      platform: "all",
      title: "ALL",
      items: [
        "Final review of all launch copy and assets",
        "Set alarms and notifications for launch day",
      ],
    });
    entries.push({
      dayOffset: -1,
      label: "Pre-launch buzz",
      variant: "warning",
      sections,
    });
  }

  // Day 0: LAUNCH DAY
  {
    const sections: TimelineSection[] = [];
    if (has("ph")) {
      sections.push({
        platform: "ph",
        time: "12:01 AM PT",
        title: "PRODUCT HUNT",
        items: [
          "Publish (or confirm scheduled launch goes live)",
          "Post Maker\u2019s Comment immediately",
          "Share PH link on Twitter",
          "Email your waitlist / newsletter",
          "First 4 hours: respond to EVERY comment",
        ],
      });
    }
    if (has("twitter")) {
      sections.push({
        platform: "twitter",
        time: "7:00 AM PT",
        title: "TWITTER",
        items: [
          'Post: "We\u2019re live on Product Hunt! \ud83d\ude80 {link}"',
          'Share milestone updates throughout the day: "Top 10!" "XX upvotes!" "Amazing feedback"',
        ],
      });
    }
    sections.push({
      platform: "all",
      title: "ALL DAY",
      items: [
        "Check PH every 15\u201330 min, reply to all new comments",
        "Share in Slack/Discord communities (one message, don\u2019t spam)",
        "Track: upvotes, comments, website visits, signups",
      ],
    });
    sections.push({
      platform: "evening",
      title: "EVENING",
      items: [
        'Thank-you tweet: "Day 1 done. XX upvotes, XX comments."',
        "Record all metrics",
      ],
    });
    entries.push({
      dayOffset: 0,
      label: "LAUNCH DAY",
      variant: "launch",
      sections,
    });
  }

  // Day +1
  {
    const sections: TimelineSection[] = [];
    if (has("reddit")) {
      sections.push({
        platform: "reddit",
        time: "9:00 AM PT",
        title: "REDDIT",
        items: [
          "Post to your target subreddits (customize copy per sub)",
          "r/SaaS \u2014 direct product intro, mention PH results",
          "r/startups \u2014 journey + lessons learned angle",
          "r/sideproject \u2014 show what you built + ask feedback",
        ],
      });
    }
    if (has("ih")) {
      sections.push({
        platform: "ih",
        time: "10:30 AM PT",
        title: "INDIEHACKERS",
        items: [
          "Build-in-public post: story + PH data + ask for feedback",
        ],
      });
    }
    sections.push({
      platform: "all",
      title: "ALL DAY",
      items: [
        "Reply to every Reddit and IH comment",
        "Continue replying to PH comments (they keep coming)",
      ],
    });
    entries.push({
      dayOffset: 1,
      label: "Post-launch momentum",
      variant: "post",
      sections,
    });
  }

  // Day +2
  {
    const sections: TimelineSection[] = [];
    if (has("hn")) {
      sections.push({
        platform: "hn",
        time: "7:00 AM PT",
        title: "HACKER NEWS",
        items: [
          'Submit: "Show HN: {product} \u2013 {one-line description}"',
          "Post first comment: tech decisions, motivation, stack",
          "Tone: technical, humble, no marketing speak",
          "Don\u2019t ask for upvotes (HN will penalize)",
        ],
      });
    }
    sections.push({
      platform: "all",
      title: "ALL DAY",
      items: [
        "Reply to HN comments (expect deep technical questions)",
        "Continue monitoring Reddit and IH threads",
      ],
    });
    entries.push({
      dayOffset: 2,
      label: "Technical communities",
      variant: "post",
      sections,
    });
  }

  // Day +3 to +4: Collect & Display
  entries.push({
    dayOffset: 3,
    label: "Collect & reflect",
    variant: "collect",
    sections: [
      {
        platform: "all",
        title: "COLLECT & DISPLAY",
        items: [
          "Go to PH, Twitter, Reddit, HN, IH",
          "Collect positive comments as social proof",
          "Create a Wall of Proof page",
          "Embed Widget on your landing page",
        ],
        cta: { text: "Collect with ShipProof \u2192", href: "/" },
      },
      {
        platform: "all",
        title: "RETROSPECTIVE",
        items: [
          "Write a launch recap thread on Twitter (share real numbers)",
          "Post a retrospective on IndieHackers",
          "Send personal thank-you DMs to people who gave detailed feedback",
          "Analyze: what worked, what didn\u2019t, what to do differently next time",
        ],
      },
    ],
  });

  return entries;
}

// ---------------------------------------------------------------------------
// Visual helpers
// ---------------------------------------------------------------------------

const variantNodeColor: Record<Variant, string> = {
  prep: "#55555C",
  warning: "#F59E0B",
  launch: "#6366F1",
  post: "#22C55E",
  collect: "#8B8B92",
};

function dayOffsetLabel(offset: number): string {
  if (offset <= -3) return "Day \u22127 to \u22123";
  if (offset === -2) return "Day \u22122";
  if (offset === -1) return "Day \u22121";
  if (offset === 0) return "Day 0";
  if (offset === 1) return "Day +1";
  if (offset === 2) return "Day +2";
  return "Day +3 to +4";
}

function phaseLabel(offset: number): string {
  if (offset < 0) return "PREP WEEK";
  if (offset === 0) return "LAUNCH";
  return "POST-LAUNCH";
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function DayPicker({
  launchDay,
  onChange,
  hasPH,
}: {
  launchDay: LaunchDay;
  onChange: (d: LaunchDay) => void;
  hasPH: boolean;
}) {
  return (
    <div className="mb-10">
      <h3 className="text-base font-medium text-[#EDEDEF] mb-1 text-center">
        {hasPH
          ? "When is your Product Hunt launch day?"
          : "Pick any day as your main launch day"}
      </h3>
      <p className="text-xs text-[#55555C] mb-4 text-center">
        We&apos;ll build your week around this day
      </p>
      <div className="flex justify-center gap-2">
        {DAYS.map((d) => (
          <div key={d.id} className="flex flex-col items-center">
            <button
              onClick={() => onChange(d.id)}
              className={`w-14 h-10 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer
                ${
                  launchDay === d.id
                    ? "bg-[#6366F1] text-white"
                    : "bg-[#141418] border border-[#1E1E24] text-[#8B8B92] hover:border-[#2A2A32] hover:text-[#EDEDEF]"
                }`}
            >
              {d.label}
            </button>
            {d.recommended && (
              <span className="text-[10px] text-[#55555C] mt-1">
                recommended
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionBadge({ platform }: { platform: SectionPlatform }) {
  if (
    platform === "all" ||
    platform === "evening" ||
    platform === "content-prep" ||
    platform === "platform-prep"
  )
    return null;
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1E1E24] text-[#8B8B92]">
      {platformBadgeLabels[platform as Platform]}
    </span>
  );
}

function TimelineCard({
  entry,
  launchDay,
  isLast,
}: {
  entry: TimelineEntryDef;
  launchDay: LaunchDay;
  isLast: boolean;
}) {
  const isLaunch = entry.variant === "launch";
  const color = variantNodeColor[entry.variant];
  const nodeSize = isLaunch ? 12 : 8;
  const dayName = entry.dayOffset <= -3
    ? ""
    : weekdayName(launchDay, entry.dayOffset);

  return (
    <div className="relative flex gap-4 md:gap-6 pb-8 last:pb-0">
      {/* Vertical line + node — desktop only */}
      <div className="hidden md:flex flex-col items-center w-6 shrink-0">
        {/* Node */}
        <div
          className="shrink-0 rounded-full z-10"
          style={{
            width: nodeSize,
            height: nodeSize,
            backgroundColor:
              entry.variant === "prep" ? "transparent" : color,
            border:
              entry.variant === "prep"
                ? `2px solid ${color}`
                : "none",
            marginTop: 6,
          }}
        />
        {/* Line */}
        {!isLast && (
          <div className="flex-1 w-0.5 bg-[#1E1E24]" />
        )}
      </div>

      {/* Mobile day badge */}
      <div className="flex md:hidden shrink-0 mt-1">
        <div
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: `${color}20`,
            color,
          }}
        >
          {dayOffsetLabel(entry.dayOffset)}
        </div>
      </div>

      {/* Card */}
      <div
        className={`flex-1 rounded-xl border p-5 transition-all duration-150 ${
          isLaunch
            ? "border-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            : "border-[#1E1E24]"
        } bg-[#141418]`}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 mb-4">
          {isLaunch && <span className="text-lg">{"\ud83d\ude80"}</span>}
          <div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-[10px] font-medium text-[#55555C] uppercase tracking-wider">
                {phaseLabel(entry.dayOffset)}
              </span>
              <span className="hidden md:inline text-[10px] font-medium rounded px-1.5 py-0.5" style={{ backgroundColor: `${color}20`, color }}>
                {dayOffsetLabel(entry.dayOffset)}
              </span>
            </div>
            <h4
              className={`font-medium ${
                isLaunch ? "text-lg text-[#EDEDEF]" : "text-sm text-[#EDEDEF]"
              }`}
            >
              {entry.label}
              {dayName && (
                <span className="text-[#55555C] font-normal ml-2">
                  {dayName}
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-5">
          {entry.sections.map((section, si) => (
            <div key={si}>
              <div className="flex items-center gap-2 mb-2">
                {section.time && (
                  <span className="font-mono text-xs text-[#55555C]">
                    {section.time}
                  </span>
                )}
                <span className="text-xs font-semibold text-[#8B8B92] uppercase tracking-wider">
                  {section.title}
                </span>
                <SectionBadge platform={section.platform} />
              </div>
              <ul className="space-y-1.5 ml-1">
                {section.items.map((item, ii) => (
                  <li
                    key={ii}
                    className="flex items-start gap-2 text-sm text-[#EDEDEF] leading-relaxed"
                  >
                    <span className="text-[#55555C] mt-1.5 shrink-0">
                      {"\u2022"}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {section.cta && (
                <Link
                  href={section.cta.href}
                  className="inline-block mt-2 ml-3 text-xs text-[#818CF8] hover:text-[#6366F1] transition-colors duration-150"
                >
                  {section.cta.text}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function LaunchWeekPlanner({
  selectedPlatforms,
  launchDay,
  onLaunchDayChange,
}: {
  selectedPlatforms: Set<Platform>;
  launchDay: LaunchDay;
  onLaunchDayChange: (day: LaunchDay) => void;
}) {
  const timeline = useMemo(
    () => buildTimeline(selectedPlatforms),
    [selectedPlatforms]
  );

  return (
    <div className="motion-safe:animate-[fadeSlideIn_200ms_ease]">
      <DayPicker
        launchDay={launchDay}
        onChange={onLaunchDayChange}
        hasPH={selectedPlatforms.has("ph")}
      />

      {/* Timeline */}
      <div>
        {timeline.map((entry, i) => (
          <TimelineCard
            key={entry.dayOffset}
            entry={entry}
            launchDay={launchDay}
            isLast={i === timeline.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
