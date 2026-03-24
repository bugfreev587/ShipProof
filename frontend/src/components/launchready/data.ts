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

export type LaunchDay = "mon" | "tue" | "wed" | "thu" | "fri";

export type PhaseId = "prep" | "prelaunch" | "launch" | "postlaunch";
export type Variant = "prep" | "warning" | "launch" | "post";

export interface PlannerItem {
  id: string;
  text: string;
  hint?: string;
  time?: string;
  platforms?: Platform[];
  cta?: { text: string; href: string };
  subgroup?: string;
}

export interface PlannerPhase {
  id: PhaseId;
  label: string;
  subtitle: string;
  variant: Variant;
  items: PlannerItem[];
}

// ---------------------------------------------------------------------------
// Planner content — all items, filtered by platform at render time
// ---------------------------------------------------------------------------

export const plannerPhases: PlannerPhase[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PREP WEEK (Day -7 to Day -2)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "prep",
    label: "Prep week",
    subtitle: "7 days before launch",
    variant: "prep",
    items: [
      // ── Product & Assets ──
      {
        id: "prep-landing",
        text: "Finalize your landing page with clear value proposition",
        hint: "Make sure it loads fast and looks good on mobile",
        subgroup: "Product & Assets",
      },
      {
        id: "prep-payment",
        text: "Test your payment flow end-to-end (signup, checkout, confirmation)",
        hint: "Nothing kills launch momentum like a broken checkout",
        subgroup: "Product & Assets",
      },
      {
        id: "prep-visuals",
        text: "Prepare visual assets: screenshots, GIF walkthrough, or demo video",
        hint: "PH needs up to 10 images (1270\u00d7760px). Twitter needs landscape aspect ratio.",
        subgroup: "Product & Assets",
      },
      {
        id: "prep-analytics",
        text: "Set up analytics tracking with UTM params for each platform",
        subgroup: "Product & Assets",
      },
      {
        id: "prep-discount",
        text: "Prepare a launch day discount or exclusive offer (optional but effective)",
        subgroup: "Product & Assets",
      },
      {
        id: "prep-copy",
        text: "Write your launch copy for each platform",
        hint: "Each platform has different rules. Don\u2019t copy-paste the same post everywhere.",
        cta: { text: "Generate with ShipProof \u2192", href: "/" },
        subgroup: "Product & Assets",
      },
      {
        id: "prep-faq",
        text: "Prepare answers to common objections and questions",
        hint: "You\u2019ll get the same 5 questions across all platforms \u2014 have answers ready",
        subgroup: "Product & Assets",
      },

      // ── PH Prep ──
      {
        id: "prep-ph-profile",
        text: "Complete your Maker profile \u2014 photo, bio, social links, maker byline",
        platforms: ["ph"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-ph-teaser",
        text: "Create a Coming Soon teaser page on Product Hunt",
        hint: "People can click \u201cNotify me\u201d \u2014 they\u2019ll get pinged on launch day",
        platforms: ["ph"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-ph-engage",
        text: "Start engaging on PH \u2014 comment on 3\u20135 products daily, upvote genuinely",
        hint: "PH algorithm weighs account age and activity. New accounts with no history get less visibility.",
        platforms: ["ph"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-ph-comment",
        text: "Prepare your Maker\u2019s Comment draft",
        hint: "Personal story + why you built this + ask for specific feedback. Not a feature list.",
        platforms: ["ph"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-ph-gallery",
        text: "Prepare up to 10 gallery images (1270\u00d7760px) or a GIF/video",
        platforms: ["ph"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-ph-tagline",
        text: "Write your tagline (under 60 chars) and description",
        platforms: ["ph"],
        subgroup: "Platform Prep",
      },

      // ── Reddit Prep ──
      {
        id: "prep-reddit-subs",
        text: "Identify target subreddits and read their posting rules carefully",
        hint: "r/SaaS: product intros OK if valuable. r/startups: journey focus. r/sideproject: show + ask feedback.",
        platforms: ["reddit"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-reddit-participate",
        text: "Start participating in target subreddits \u2014 comment helpfully on 2\u20133 posts daily",
        hint: "Reddit communities can smell a drive-by promotion. Build history first.",
        platforms: ["reddit"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-reddit-posts",
        text: "Prepare separate posts for each subreddit, matching their tone",
        hint: "Story-first, product-second. Never put your product URL in the post body.",
        platforms: ["reddit"],
        subgroup: "Platform Prep",
      },

      // ── HN Prep ──
      {
        id: "prep-hn-karma",
        text: "Build karma by commenting on relevant HN posts",
        platforms: ["hn"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-hn-title",
        text: "Prepare Show HN title: \u201cShow HN: [Name] \u2013 [one-line description]\u201d",
        hint: "Technical, understated. No superlatives, no emoji, no marketing language.",
        platforms: ["hn"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-hn-comment",
        text: "Prepare first comment: tech decisions, motivation, what you want feedback on",
        platforms: ["hn"],
        subgroup: "Platform Prep",
      },

      // ── Twitter Prep ──
      {
        id: "prep-twitter-thread",
        text: "Draft a launch thread (5\u20138 tweets)",
        hint: "Hook first, story in the middle, CTA + link at the end only. No URL in first tweet.",
        platforms: ["twitter"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-twitter-premium",
        text: "Consider X Premium+ \u2014 replies get algorithm priority, significantly higher reach",
        platforms: ["twitter"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-twitter-bip",
        text: "Start posting build-in-public content to build audience before launch",
        platforms: ["twitter"],
        subgroup: "Platform Prep",
      },

      // ── IH Prep ──
      {
        id: "prep-ih-draft",
        text: "Draft a build-in-public style post (journey + honest numbers + ask feedback)",
        platforms: ["ih"],
        subgroup: "Platform Prep",
      },
      {
        id: "prep-ih-engage",
        text: "Start commenting on other IH posts \u2014 3\u20135 thoughtful comments daily",
        platforms: ["ih"],
        subgroup: "Platform Prep",
      },

      // ── Notify Network ──
      {
        id: "prep-notify-list",
        text: "Identify 10\u201320 people to notify on launch day (friends, supporters, fellow builders)",
        subgroup: "Notify Your Network",
      },
      {
        id: "prep-notify-dm",
        text: "DM them personally \u2014 not a template blast. Mention a previous interaction.",
        subgroup: "Notify Your Network",
      },
      {
        id: "prep-notify-email",
        text: "Prepare an email for your waitlist/newsletter (if you have one)",
        subgroup: "Notify Your Network",
      },
      {
        id: "prep-calendar",
        text: "Clear your calendar for launch day \u2014 you\u2019ll need the whole day",
        subgroup: "Notify Your Network",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-LAUNCH (Day -1)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "prelaunch",
    label: "Pre-launch day",
    subtitle: "1 day before launch",
    variant: "warning",
    items: [
      {
        id: "pre-twitter-thread",
        text: "Post a pre-launch thread on Twitter",
        hint: "Share your story, what you\u2019re launching tomorrow. No product link in main tweets.",
        time: "9:00 AM PT",
        platforms: ["twitter"],
      },
      {
        id: "pre-twitter-pin",
        text: "Pin the thread to your profile",
        platforms: ["twitter"],
      },
      {
        id: "pre-twitter-dm",
        text: "DM your 10\u201320 supporters: \u201cLaunching tomorrow, would love your support\u201d",
        platforms: ["twitter"],
      },
      {
        id: "pre-ph-check",
        text: "Final check: Coming Soon page, gallery images, description, tagline all correct",
        platforms: ["ph"],
      },
      {
        id: "pre-ph-comment-ready",
        text: "Maker\u2019s Comment finalized and ready to paste",
        platforms: ["ph"],
      },
      {
        id: "pre-test",
        text: "Test your website one more time \u2014 signup flow, payment, core features",
      },
      {
        id: "pre-alarm",
        text: "Set alarm for 11:50 PM PT if launching at midnight",
        platforms: ["ph"],
      },
      {
        id: "pre-rest",
        text: "Get some rest. Tomorrow is a big day.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAUNCH DAY (Day 0)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "launch",
    label: "Launch day",
    subtitle: "LAUNCH DAY",
    variant: "launch",
    items: [
      // ── PH ──
      {
        id: "launch-ph-publish",
        text: "Publish on Product Hunt",
        hint: "Start of new PH day for maximum 24hr window",
        time: "12:01 AM PT",
        platforms: ["ph"],
      },
      {
        id: "launch-ph-comment",
        text: "Post your Maker\u2019s Comment immediately",
        platforms: ["ph"],
      },
      {
        id: "launch-ph-respond",
        text: "First 4 hours: respond to EVERY comment",
        hint: "Speed and warmth matter more than perfect answers",
        platforms: ["ph"],
      },
      {
        id: "launch-ph-share",
        text: "Share PH link on all your social channels",
        platforms: ["ph"],
      },

      // ── Twitter ──
      {
        id: "launch-twitter-post",
        text: "Tweet: \u201cWe\u2019re live on Product Hunt! \ud83d\ude80\u201d with PH link",
        hint: "This is the one tweet where a link is OK \u2014 it\u2019s a call to action",
        time: "9:00 AM PT",
        platforms: ["twitter"],
      },
      {
        id: "launch-twitter-updates",
        text: "Share milestone updates throughout the day (\u201cTop 10!\u201d, \u201cXX upvotes!\u201d)",
        platforms: ["twitter"],
      },
      {
        id: "launch-twitter-engage",
        text: "Engage with every reply and quote tweet",
        platforms: ["twitter"],
      },

      // ── Reddit ──
      {
        id: "launch-reddit-post",
        text: "Post during peak hours in your target subreddits",
        hint: "r/SaaS, r/startups peak: weekday mornings US time. Story-first. Product URL in a comment, not the post body.",
        platforms: ["reddit"],
      },
      {
        id: "launch-reddit-respond",
        text: "Respond to every comment \u2014 be helpful, not salesy",
        platforms: ["reddit"],
      },
      {
        id: "launch-reddit-removed",
        text: "If a post gets removed, don\u2019t repost. Message mods politely.",
        platforms: ["reddit"],
      },

      // ── HN ──
      {
        id: "launch-hn-submit",
        text: "Submit Show HN",
        time: "7:00 AM PT",
        platforms: ["hn"],
      },
      {
        id: "launch-hn-comment",
        text: "Post explanatory first comment within minutes",
        platforms: ["hn"],
      },
      {
        id: "launch-hn-noupvotes",
        text: "Never ask for upvotes \u2014 HN will penalize you",
        platforms: ["hn"],
      },

      // ── IH ──
      {
        id: "launch-ih-post",
        text: "Post during weekday hours \u2014 build-in-public style with real numbers",
        platforms: ["ih"],
      },

      // ── General ──
      {
        id: "launch-email",
        text: "Send email blast to your waitlist/newsletter",
      },
      {
        id: "launch-communities",
        text: "Post in relevant Slack/Discord communities (one message, don\u2019t spam)",
      },
      {
        id: "launch-monitor",
        text: "Monitor all platforms throughout the day",
      },
      {
        id: "launch-evening",
        text: "Evening \u2014 Thank-you tweet: \u201cDay 1 done. XX upvotes, XX comments. Thank you.\u201d",
      },
      {
        id: "launch-metrics",
        text: "Record all metrics: upvotes, comments, website visits, signups",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // POST-LAUNCH (Day +1 to Day +4)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "postlaunch",
    label: "Post-launch",
    subtitle: "The work isn\u2019t over",
    variant: "post",
    items: [
      {
        id: "post-respond",
        text: "Respond to any remaining comments across all platforms",
        subgroup: "Day +1",
      },
      {
        id: "post-thankyou",
        text: "Send personal thank-you messages to people who commented or shared",
        subgroup: "Day +1",
      },
      {
        id: "post-followup",
        text: "Follow up with warm leads (people who asked questions or showed interest)",
        subgroup: "Day +2",
      },
      {
        id: "post-update",
        text: "Update your product based on feedback received",
        subgroup: "Day +2",
      },
      {
        id: "post-reddit-check",
        text: "Check if any Reddit posts were removed and message mods if needed",
        hint: "Some subs have delayed moderation \u2014 check back the next day",
        platforms: ["reddit"],
        subgroup: "Day +2",
      },
      {
        id: "post-hn-monitor",
        text: "Monitor HN for second-wave traffic (posts can resurface days later)",
        platforms: ["hn"],
        subgroup: "Day +2",
      },
      {
        id: "post-collect",
        text: "Collect positive feedback as social proof",
        hint: "Don\u2019t let great comments disappear into threads.",
        cta: { text: "Collect with ShipProof \u2192", href: "/" },
        subgroup: "Day +3\u20134",
      },
      {
        id: "post-display",
        text: "Display social proof on your landing page",
        hint: "Embed a widget or create a Wall of Proof page.",
        cta: { text: "Display with ShipProof \u2192", href: "/" },
        subgroup: "Day +3\u20134",
      },
      {
        id: "post-retro",
        text: "Write a launch retrospective (great for Twitter thread and IH post)",
        hint: "Share real numbers \u2014 the community respects transparency",
        platforms: ["ih", "twitter"],
        subgroup: "Day +3\u20134",
      },
      {
        id: "post-analyze",
        text: "Analyze traffic sources and conversion data",
        subgroup: "Day +3\u20134",
      },
      {
        id: "post-iterate",
        text: "Plan your next iteration based on what you learned",
        subgroup: "Day +3\u20134",
      },
      {
        id: "post-celebrate",
        text: "Celebrate. You shipped. That\u2019s more than most people do. \ud83c\udf89",
        subgroup: "Day +3\u20134",
      },
    ],
  },
];
