export type Platform = "ph" | "reddit" | "hn" | "twitter" | "ih";

export interface PlatformInfo {
  id: Platform;
  label: string;
  icon: string;
}

export const platforms: PlatformInfo[] = [
  { id: "ph", label: "Product Hunt", icon: "P" },
  { id: "reddit", label: "Reddit", icon: "R" },
  { id: "hn", label: "Hacker News", icon: "Y" },
  { id: "twitter", label: "Twitter / X", icon: "\ud835\udd4f" },
  { id: "ih", label: "IndieHackers", icon: "IH" },
];

export type Phase = "before" | "day" | "after";

export interface ChecklistItem {
  id: string;
  text: string;
  hint?: string;
  platforms?: Platform[]; // undefined = universal
  cta?: { text: string; href: string }; // ShipProof導流
}

export const checklistData: Record<Phase, ChecklistItem[]> = {
  before: [
    // Universal
    {
      id: "before-landing",
      text: "Finalize your landing page with clear value proposition",
      hint: "Make sure it loads fast and looks good on mobile",
    },
    {
      id: "before-visuals",
      text: "Prepare visual assets (screenshots, GIF walkthrough, or demo video)",
      hint: "5 images for PH gallery, Twitter-friendly aspect ratio for X",
    },
    {
      id: "before-analytics",
      text: "Set up analytics tracking (UTM params for each platform)",
    },
    {
      id: "before-discount",
      text: "Prepare a launch day discount or exclusive offer (optional but effective)",
    },
    {
      id: "before-copy",
      text: "Write your launch copy for each platform",
      hint: "Writing 5 different posts is painful.",
      cta: { text: "Generate all with ShipProof \u2192", href: "/sign-up" },
    },
    {
      id: "before-notify",
      text: "Notify your early users, friends, and network about the upcoming launch",
    },
    {
      id: "before-calendar",
      text: "Clear your calendar for launch day \u2014 you'll need the full day",
    },
    // PH
    {
      id: "before-ph-profile",
      text: "Complete your Maker profile (photo, bio, social links, maker byline)",
      platforms: ["ph"],
    },
    {
      id: "before-ph-teaser",
      text: 'Create a "Coming Soon" teaser page on Product Hunt',
      hint: "People can click \u201cNotify me\u201d \u2014 they'll get pinged on launch day",
      platforms: ["ph"],
    },
    {
      id: "before-ph-engage",
      text: "Engage on Product Hunt for 1\u20132 weeks before launch (comment, upvote, discuss)",
      hint: "New accounts with no activity get less algorithmic weight",
      platforms: ["ph"],
    },
    {
      id: "before-ph-comment",
      text: "Prepare your Maker's Comment (first comment on your product)",
      hint: "Personal story + why you built this + ask for feedback. Be genuine.",
      platforms: ["ph"],
    },
    {
      id: "before-ph-gallery",
      text: "Prepare 5 gallery images (1200\u00d7900px) or a GIF/video",
      platforms: ["ph"],
    },
    {
      id: "before-ph-tagline",
      text: "Write your tagline (<60 chars) and description (2\u20133 sentences)",
      platforms: ["ph"],
    },
    // Reddit
    {
      id: "before-reddit-subs",
      text: "Identify target subreddits and read their posting rules",
      hint: "r/SaaS, r/startups, r/sideproject, r/webdev \u2014 each has different rules",
      platforms: ["reddit"],
    },
    {
      id: "before-reddit-participate",
      text: "Participate in target subreddits for 1\u20132 weeks before posting",
      hint: "Reddit communities can smell a drive-by post from a mile away",
      platforms: ["reddit"],
    },
    {
      id: "before-reddit-posts",
      text: "Prepare separate posts for each subreddit, matching their tone",
      hint: "r/SaaS: product intro OK. r/startups: share your journey. r/sideproject: show + ask feedback",
      platforms: ["reddit"],
    },
    // HN
    {
      id: "before-hn-karma",
      text: "Build up some karma by commenting on relevant HN posts",
      platforms: ["hn"],
    },
    {
      id: "before-hn-title",
      text: 'Prepare your Show HN title: "Show HN: [Name] \u2013 [one-line description]"',
      hint: "Keep it technical and understated. No marketing speak.",
      platforms: ["hn"],
    },
    {
      id: "before-hn-comment",
      text: "Prepare a first comment explaining your tech decisions and motivation",
      platforms: ["hn"],
    },
    // Twitter
    {
      id: "before-twitter-thread",
      text: "Draft a launch thread (5\u20138 tweets)",
      hint: "Hook first, features/story in the middle, CTA+link at the end only",
      platforms: ["twitter"],
    },
    {
      id: "before-twitter-premium",
      text: "If you have X Premium, your replies get priority \u2014 worth $8/mo for launch week",
      platforms: ["twitter"],
    },
    {
      id: "before-twitter-pinned",
      text: "Prepare a pinned tweet for launch day",
      platforms: ["twitter"],
    },
    {
      id: "before-twitter-accounts",
      text: "Identify 10\u201320 accounts to tag or DM when you launch",
      platforms: ["twitter"],
    },
    // IH
    {
      id: "before-ih-post",
      text: "Draft a build-in-public style post (journey + what you built + ask for feedback)",
      platforms: ["ih"],
    },
    {
      id: "before-ih-active",
      text: "Be active in IH discussions in the weeks before launch",
      platforms: ["ih"],
    },
  ],

  day: [
    // Universal (top)
    {
      id: "day-breathe",
      text: "Take a deep breath. You've prepared well. Let's go. \ud83d\ude80",
    },
    // PH
    {
      id: "day-ph-publish",
      text: "Publish at 12:01 AM Pacific Time (start of a new PH day)",
      platforms: ["ph"],
    },
    {
      id: "day-ph-comment",
      text: "Post your Maker's Comment immediately after publishing",
      platforms: ["ph"],
    },
    {
      id: "day-ph-respond",
      text: "Respond to EVERY comment in the first 4 hours \u2014 this is critical",
      hint: "Speed and warmth matter more than perfect answers",
      platforms: ["ph"],
    },
    {
      id: "day-ph-share",
      text: "Share your PH link across all your channels",
      platforms: ["ph"],
    },
    // Reddit
    {
      id: "day-reddit-post",
      text: "Post to target subreddits during their peak hours",
      hint: "r/SaaS and r/startups peak: weekday mornings US time",
      platforms: ["reddit"],
    },
    {
      id: "day-reddit-respond",
      text: "Respond to every comment. Be helpful, not salesy.",
      platforms: ["reddit"],
    },
    {
      id: "day-reddit-customize",
      text: "Don't cross-post the exact same text \u2014 customize per sub",
      platforms: ["reddit"],
    },
    // HN
    {
      id: "day-hn-submit",
      text: "Submit during US business hours (10 AM \u2013 12 PM ET works well)",
      platforms: ["hn"],
    },
    {
      id: "day-hn-comment",
      text: "Post your explanatory first comment within minutes",
      platforms: ["hn"],
    },
    {
      id: "day-hn-noupvotes",
      text: "Don't ask for upvotes \u2014 HN will penalize you",
      platforms: ["hn"],
    },
    // Twitter
    {
      id: "day-twitter-post",
      text: "Post your thread at 9\u201311 AM in your audience's timezone",
      platforms: ["twitter"],
    },
    {
      id: "day-twitter-pin",
      text: "Pin the thread to your profile",
      platforms: ["twitter"],
    },
    {
      id: "day-twitter-reply",
      text: "Reply to your own thread with the product link (keeps it off the first tweet)",
      platforms: ["twitter"],
    },
    {
      id: "day-twitter-engage",
      text: "Engage with every reply and quote tweet",
      platforms: ["twitter"],
    },
    // IH
    {
      id: "day-ih-post",
      text: "Post during weekday hours when the community is most active",
      platforms: ["ih"],
    },
    {
      id: "day-ih-genuine",
      text: "Be genuine \u2014 IH readers can tell when you're marketing vs. sharing",
      platforms: ["ih"],
    },
    // Universal (bottom)
    {
      id: "day-email",
      text: "Send an email blast to your waitlist / newsletter",
    },
    {
      id: "day-communities",
      text: "Post in relevant Slack / Discord communities (don't spam \u2014 add value)",
    },
    {
      id: "day-monitor",
      text: "Monitor all platforms throughout the day \u2014 set up notifications",
    },
  ],

  after: [
    {
      id: "after-respond",
      text: "Respond to any remaining comments across all platforms",
    },
    {
      id: "after-thankyou",
      text: "Send personal thank-you messages to people who commented or shared",
    },
    {
      id: "after-collect",
      text: "Collect positive feedback as social proof",
      hint: "Don't let great comments disappear.",
      cta: { text: "Collect proof with ShipProof \u2192", href: "/sign-up" },
    },
    {
      id: "after-display",
      text: "Display social proof on your landing page",
      hint: "Embed a proof widget or create a Wall of Proof.",
      cta: { text: "Try ShipProof \u2192", href: "/sign-up" },
    },
    {
      id: "after-update",
      text: "Update your product based on feedback received",
    },
    {
      id: "after-retro",
      text: "Write a launch retrospective post (great for IH and Twitter)",
      hint: "Share your numbers honestly \u2014 the community respects transparency",
    },
    {
      id: "after-followup",
      text: "Follow up with warm leads (people who asked questions or showed interest)",
    },
    {
      id: "after-analyze",
      text: "Analyze traffic sources and conversion data",
    },
    {
      id: "after-iterate",
      text: "Plan your next iteration based on what you learned",
    },
    {
      id: "after-celebrate",
      text: "Celebrate. You shipped. That's more than most people do. \ud83c\udf89",
    },
  ],
};

export interface CheatSheetRow {
  key: string;
  value: string;
}

export interface CheatSheet {
  platform: Platform;
  label: string;
  rows: CheatSheetRow[];
}

export const cheatSheets: CheatSheet[] = [
  {
    platform: "ph",
    label: "Product Hunt",
    rows: [
      { key: "Best time to post", value: "12:01 AM PST (start of new PH day)" },
      { key: "Best days", value: "Tuesday \u2013 Thursday" },
      { key: "Tagline limit", value: "60 characters" },
      { key: "Gallery", value: "5 images (1200\u00d7900px) or video" },
      { key: "Must have", value: "Tagline + Gallery + Description + Maker Comment" },
      { key: "Avoid", value: "Vote manipulation, new-account upvote campaigns" },
      { key: "Pro tip", value: "Maker accounts with prior activity rank better" },
    ],
  },
  {
    platform: "reddit",
    label: "Reddit",
    rows: [
      { key: "r/SaaS", value: "Direct product intros OK. Focus on the problem you solve." },
      { key: "r/startups", value: "Share your journey and lessons, not just the product." },
      { key: "r/sideproject", value: "Show what you built + ask for honest feedback." },
      { key: "r/webdev", value: "Technical angle. Share interesting tech decisions." },
      { key: "Avoid", value: "External links in titles, pure self-promotion." },
      { key: "Pro tip", value: "If your post gets removed, don\u2019t repost \u2014 message the mods." },
    ],
  },
  {
    platform: "hn",
    label: "Hacker News",
    rows: [
      { key: "Format", value: '"Show HN: [Name] \u2013 [one-line description]"' },
      { key: "Best time", value: "Weekdays, 10 AM \u2013 12 PM ET" },
      { key: "Body text", value: "None (HN Show posts are title + URL only)" },
      { key: "First comment", value: "Explain tech decisions and motivation" },
      { key: "Avoid", value: "Marketing language, asking for upvotes" },
      { key: "Pro tip", value: "HN values technical novelty and honest discussion." },
    ],
  },
  {
    platform: "twitter",
    label: "Twitter / X",
    rows: [
      { key: "Thread length", value: "5\u20138 tweets" },
      { key: "Character limit", value: "280 per tweet (Premium: 25,000)" },
      { key: "Best time", value: "9\u201311 AM in your audience\u2019s timezone" },
      { key: "Link placement", value: "Last tweet or first reply (algorithm penalizes link tweets)" },
      { key: "Premium boost", value: "~10x median reach vs free accounts" },
      { key: "Pro tip", value: "Pin your launch thread. Engage with every reply." },
    ],
  },
  {
    platform: "ih",
    label: "IndieHackers",
    rows: [
      { key: "Style", value: "Build-in-public, honest, sharing your process" },
      { key: "Best content", value: "Journey posts, transparent metrics, lessons learned" },
      { key: "Avoid", value: "Pure advertising posts" },
      { key: "Pro tip", value: "Ask genuine questions. The community loves helping." },
    ],
  },
];
