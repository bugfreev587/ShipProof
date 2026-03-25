"use client";

import { useState } from "react";

type Step = "input" | "generating" | "results";
type PlatformId = "producthunt" | "twitter" | "reddit" | "hackernews" | "indiehackers";

interface FormData {
  productName: string;
  tagline: string;
  problemSolved: string;
  targetAudience: string;
  keyFeatures: string;
  founderStory: string;
}

const PLATFORMS = [
  { id: "producthunt" as PlatformId, name: "Product Hunt", icon: "▲", color: "#FF6154", description: "Tagline, description & maker comment", tips: "Keep tagline under 60 chars. Description should highlight the problem, solution, and why now." },
  { id: "twitter" as PlatformId, name: "Twitter / X", icon: "𝕏", color: "#1DA1F2", description: "Launch thread (5-7 tweets)", tips: "Start with a hook. End with a CTA. Use line breaks for readability." },
  { id: "reddit" as PlatformId, name: "Reddit", icon: "●", color: "#FF4500", description: "Posts for r/SideProject & r/indiehackers", tips: "Sound like a real person, not a marketer. Share your story. Be honest about what's early." },
  { id: "hackernews" as PlatformId, name: "Hacker News", icon: "Y", color: "#FF6600", description: "Show HN post", tips: "HN values technical depth. Lead with what's interesting, not what's for sale." },
  { id: "indiehackers" as PlatformId, name: "IndieHackers", icon: "IH", color: "#0E7490", description: "Launch post with backstory", tips: "IH loves founder stories. Share revenue, mistakes, and what you learned." },
];

const DEMO_OUTPUTS: Record<PlatformId, { title: string; content: string }[]> = {
  producthunt: [
    { title: "Tagline", content: "Turn every launch into lasting social proof" },
    { title: "Description", content: "ShipProof is the all-in-one launch toolkit for indie hackers.\n\n🚀 Ship — Generate platform-ready launch copy for PH, Reddit, HN, Twitter/X, and IndieHackers with AI. What used to take a full Sunday now takes 2 minutes.\n\n📥 Collect — Paste a tweet URL, a PH comment, or a Reddit reply. ShipProof pulls in the content, attributes the source, and tags it. Never lose great feedback again.\n\n📊 Display — Embed a Wall of Love on your landing page with two lines of code. Auto-scrolling marquee, masonry grid, or carousel — your pick.\n\nEach cycle makes your next launch stronger. Start free today." },
    { title: "Maker Comment", content: "Hey PH! 👋\n\nI built ShipProof because I kept losing great comments people left about my projects. Someone would praise my tool on Twitter, I'd screenshot it, then lose the file. Sound familiar?\n\nShipProof closes the loop: generate launch content → collect praise → display it everywhere.\n\nThe free plan gives you everything to try the full flow. Would love your feedback!" },
    { title: "First Comment", content: "Thanks for checking out ShipProof! Happy to answer any questions about the product, tech stack (Next.js + Go + Claude API), or my experience launching as a solo founder. 🙌" },
  ],
  twitter: [
    { title: "Launch Thread", content: "🧵 I just launched ShipProof — the all-in-one launch toolkit for indie hackers.\n\nIt turns every launch into lasting social proof.\n\nHere's the story 👇\n\n---\n\n1/ The problem: Every time I launched something, I spent an entire Sunday writing posts for 5 different platforms.\n\nThen the good comments came in... and I lost them in browser tabs.\n\n---\n\n2/ ShipProof fixes this with a flywheel:\n\n🚀 Ship — AI generates platform-ready copy for PH, Reddit, HN, Twitter, IndieHackers\n📥 Collect — Paste a URL, it pulls the content automatically\n📊 Display — Embed a Wall of Love on your site\n\n---\n\n3/ The best part? Each launch cycle makes the next one stronger.\n\nMore social proof → more trust → more users → more feedback → repeat.\n\n---\n\n4/ It's free to start:\n✅ 1 product\n✅ 5 proofs\n✅ AI launch copy generation\n✅ Wall of Love page\n✅ Embeddable widget\n\nNo credit card required.\n\n---\n\n5/ Try it now → shipproof.io\n\nI'd love your feedback. What platform do you struggle with most when launching? 👇" },
  ],
  reddit: [
    { title: "Post Title", content: "I built a tool that generates launch posts for 5 platforms and collects social proof automatically" },
    { title: "Post Body", content: "Hey everyone,\n\nI've been building in public for a while and one thing always frustrated me: writing launch posts.\n\nEvery platform has different expectations. Product Hunt wants polished descriptions. Reddit wants authenticity. HN wants technical depth. Twitter wants hooks. IndieHackers wants the story.\n\nWriting for all of them used to take me an entire Sunday.\n\nSo I built ShipProof.\n\n**What it does:**\n- Generates platform-specific launch copy using AI (not generic cross-posting)\n- Collects praise/testimonials — paste a URL and it pulls the content\n- Displays social proof on your site with a 2-line embed code\n\n**The idea is a flywheel:** Ship → Collect → Display → Ship again (with more proof each time).\n\n**It's free to start** — 1 product, 5 proofs, AI generation included.\n\nI'd love feedback from this community. What could be better? What's missing?\n\nLink: shipproof.io" },
  ],
  hackernews: [
    { title: "Post Title", content: "Show HN: ShipProof – Generate launch copy for 5 platforms, collect social proof automatically" },
    { title: "Post Body", content: "Hi HN,\n\nI built ShipProof because launching across multiple platforms is tedious and feedback gets lost.\n\nThe core idea: AI generates platform-specific launch content (not generic copy), you collect the resulting praise/feedback, and embed it as social proof on your site.\n\nTech stack:\n- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind\n- Backend: Go + Chi router + PostgreSQL + sqlc\n- AI: Claude API for content generation\n- Storage: Cloudflare R2\n- Auth: Clerk\n\nThe content generation is the interesting part — each platform has different cultural norms. PH wants emoji-rich descriptions, Reddit wants genuine stories, HN wants technical substance. The AI is prompted differently for each.\n\nThe embed widget auto-resizes and works with any site (HTML, WordPress, Webflow, etc.) via a simple iframe + postMessage for height sync.\n\nFree tier: 1 product, 5 proofs, AI generation. No credit card.\n\nWould appreciate feedback, especially on the generation quality.\n\nhttps://shipproof.io" },
  ],
  indiehackers: [
    { title: "Post Title", content: "I launched ShipProof — the flywheel from launch content to social proof. Here's what I learned." },
    { title: "Post Body", content: "Hey IH! 👋\n\nAfter months of building, I just launched ShipProof. Here's the honest story.\n\n## The Problem\n\nEvery time I launched a side project, two things happened:\n1. I spent a full day writing launch posts for Product Hunt, Reddit, HN, Twitter, and IndieHackers\n2. People left great comments... and I lost them in browser tabs\n\nNo way to systematically collect and display that social proof.\n\n## What I Built\n\nShipProof is a flywheel:\n- **Ship** — AI generates platform-specific launch copy (not generic)\n- **Collect** — Paste a URL from any platform, it pulls the content and attributes the source\n- **Display** — Embed a Wall of Love on your landing page with 2 lines of code\n\n## The Tech\n\nNext.js + Go backend + PostgreSQL. Claude API for content generation. Entire thing built with Claude Code (dogfooding AI tools to build an AI tool).\n\n## What's Working\n\n- The content generation saves real time. Platform-specific copy in 2 minutes vs 2+ hours\n- The embed widget just works — drop in, auto-resizes\n- Free plan gets people through the full flow\n\n## What's Next\n\n- Chrome Extension for one-click proof capture\n- AI summary cards for Wall of Love\n- Better analytics on which proofs convert\n\n**Free to start:** shipproof.io\n\nWould love feedback from this community. What would make this more useful for your launches?" },
  ],
};

export function LaunchCopyGenerator() {
  const [step, setStep] = useState<Step>("input");
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    tagline: "",
    problemSolved: "",
    targetAudience: "",
    keyFeatures: "",
    founderStory: "",
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["producthunt", "twitter", "reddit"]);
  const [outputs, setOutputs] = useState<Record<PlatformId, { title: string; content: string }[]>>({} as Record<PlatformId, { title: string; content: string }[]>);
  const [activePlatform, setActivePlatform] = useState<PlatformId>("producthunt");
  const [copiedKey, setCopiedKey] = useState("");

  const togglePlatform = (id: PlatformId) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canGenerate = formData.productName.trim() && formData.tagline.trim() && formData.problemSolved.trim() && selectedPlatforms.length > 0;

  const handleGenerate = async () => {
    setStep("generating");
    // TODO: Replace with real API call
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setOutputs(DEMO_OUTPUTS);
    setStep("results");
    setActivePlatform(selectedPlatforms[0]);
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleReset = () => {
    setStep("input");
    setOutputs({} as Record<PlatformId, { title: string; content: string }[]>);
  };

  const activePlatformInfo = PLATFORMS.find((p) => p.id === activePlatform);

  return (
    <div className="px-6">
      {/* SEO Hero */}
      <section className="pt-24 pb-12 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-[#6366F1]/20 bg-[#6366F1]/10 px-4 py-1.5 text-sm text-[#6366F1] mb-6">
            ✦ Free tool — no signup required
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            AI Launch Copy Generator
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Generate platform-specific launch content for Product Hunt, Reddit,
            Hacker News, Twitter/X, and IndieHackers — in 2 minutes, not 2 hours.
          </p>
        </div>
      </section>

      {/* Input Form */}
      {step === "input" && (
        <section className="pb-16">
          <div className="mx-auto max-w-2xl flex flex-col gap-4">
            <Field label="Product name *" value={formData.productName} onChange={(v) => updateField("productName", v)} placeholder="e.g. ShipProof" />
            <Field label="One-line pitch *" value={formData.tagline} onChange={(v) => updateField("tagline", v)} placeholder="e.g. Turn every launch into lasting social proof" />
            <TextareaField label="What problem does it solve? *" value={formData.problemSolved} onChange={(v) => updateField("problemSolved", v)} rows={3} placeholder="e.g. Indie hackers waste hours writing launch posts for 5 platforms and lose great feedback in browser tabs" />
            <Field label="Target audience" value={formData.targetAudience} onChange={(v) => updateField("targetAudience", v)} placeholder="e.g. Indie hackers, solo founders, small SaaS teams" />
            <TextareaField label="Key features — 2-5 bullet points" value={formData.keyFeatures} onChange={(v) => updateField("keyFeatures", v)} rows={4} placeholder="e.g.&#10;- AI launch copy generation for 5 platforms&#10;- One-click proof collection from URLs&#10;- Embeddable Wall of Love widget" />
            <TextareaField label="Your founder story" sublabel="Optional — improves Reddit/IH/HN quality" value={formData.founderStory} onChange={(v) => updateField("founderStory", v)} rows={3} placeholder="e.g. I kept losing great comments about my side projects..." />

            {/* Platform selection */}
            <div>
              <label className="text-sm font-semibold text-foreground/90 mb-2 block">Select platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                        selected
                          ? "border-[var(--color)] font-semibold"
                          : "border-border text-muted-foreground hover:border-border/80"
                      }`}
                      style={selected ? { borderColor: p.color, color: p.color, backgroundColor: `${p.color}08` } : {}}
                    >
                      <span className="text-base" style={selected ? { color: p.color } : {}}>{p.icon}</span>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full rounded-xl bg-[#6366F1] px-6 py-3.5 text-base font-bold text-white hover:bg-[#818CF8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-2"
            >
              ✦ Generate Launch Copy for {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? "s" : ""}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Free &bull; No signup required &bull; Powered by Claude AI
            </p>
          </div>
        </section>
      )}

      {/* Generating State */}
      {step === "generating" && (
        <section className="pb-16">
          <div className="mx-auto max-w-2xl py-16 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-[#6366F1]" />
            <p className="text-foreground font-medium">Generating launch content...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crafting platform-specific copy for {selectedPlatforms.length} platforms
            </p>
          </div>
        </section>
      )}

      {/* Results */}
      {step === "results" && (
        <section className="pb-16">
          <div className="mx-auto max-w-3xl">
            {/* Platform tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
              {selectedPlatforms.map((pid) => {
                const p = PLATFORMS.find((pl) => pl.id === pid)!;
                const active = activePlatform === pid;
                return (
                  <button
                    key={pid}
                    onClick={() => setActivePlatform(pid)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm transition-all ${
                      active ? "border-2 font-semibold" : "border-border text-muted-foreground"
                    }`}
                    style={active ? { borderColor: p.color, color: p.color, backgroundColor: `${p.color}08` } : {}}
                  >
                    <span>{p.icon}</span>
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Platform tip */}
            {activePlatformInfo && (
              <div
                className="rounded-lg px-4 py-3 mb-4 text-sm text-muted-foreground"
                style={{
                  borderLeft: `3px solid ${activePlatformInfo.color}`,
                  backgroundColor: `${activePlatformInfo.color}08`,
                }}
              >
                <span className="font-medium text-foreground">Platform tip:</span> {activePlatformInfo.tips}
              </div>
            )}

            {/* Output cards */}
            {outputs[activePlatform]?.map((output) => {
              const copyKey = `${activePlatform}-${output.title}`;
              return (
                <div key={copyKey} className="rounded-xl border border-border bg-card/30 p-5 mb-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: activePlatformInfo?.color }}
                    >
                      {output.title}
                    </span>
                    <button
                      onClick={() => handleCopy(copyKey, output.content)}
                      className={`text-xs px-3 py-1 rounded-md border transition-colors ${
                        copiedKey === copyKey
                          ? "border-[#059669] text-[#059669] bg-[#059669]/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {copiedKey === copyKey ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mt-3">
                    {output.content}
                  </div>
                </div>
              );
            })}

            {/* Save CTA */}
            <div className="rounded-2xl border border-[#6366F1]/20 bg-[#6366F1]/5 p-6 text-center mt-8">
              <h3 className="text-lg font-semibold text-foreground">
                Ready to launch? Save your content &amp; track results.
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Sign up free to save generated content, collect social proof post-launch, and display it on your site.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
                <a
                  href="/sign-up"
                  className="rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-semibold text-white hover:bg-[#818CF8] transition-colors"
                >
                  Save &amp; Start Collecting Proof &rarr;
                </a>
                <button
                  onClick={handleReset}
                  className="rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  ↻ Generate again
                </button>
              </div>
            </div>

            {/* Flywheel nudge */}
            <div className="rounded-xl bg-card/20 border border-border p-5 text-center mt-4">
              <p className="text-sm text-muted-foreground">
                This is just <span className="text-foreground font-medium">Step 1</span>. ShipProof does the full loop:{" "}
                <span className="text-[#6366F1] font-medium">Ship</span> (you just did this) →{" "}
                <span className="text-[#F59E0B] font-medium">Collect</span> (gather praise) →{" "}
                <span className="text-[#3B82F6] font-medium">Display</span> (embed social proof).
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SEO Content */}
      <section className="mx-auto max-w-2xl border-t border-border mt-12 pt-12 pb-4">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Why platform-specific launch copy matters
        </h2>
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            Every platform has different cultural expectations. Product Hunt rewards polished,
            emoji-rich descriptions with clear value props. Reddit values authenticity and honest
            storytelling — anything that reads like marketing copy gets downvoted. Hacker News
            respects technical depth and hates self-promotion.
          </p>
          <p>
            Most founders write generic copy and cross-post it everywhere. The result? Mediocre
            engagement across all platforms instead of strong traction on any single one. Platform-native
            content consistently outperforms generic posts by 3-5x in engagement.
          </p>
          <p>
            ShipProof&apos;s generator understands these platform norms. It creates distinct content
            for each platform — matching the tone, format, and cultural expectations that drive
            engagement. What used to take a full day of writing now takes 2 minutes.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-2xl mt-12 pb-4">
        <h2 className="text-xl font-bold text-foreground mb-5">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-border">
          {[
            { q: "Is the launch copy generator really free?", a: "Yes, 100% free with no signup required. We built this as a free tool to help indie hackers launch better. ShipProof makes money from its paid plans which add proof collection and social proof display features." },
            { q: "What platforms does it generate content for?", a: "Product Hunt (tagline, description, maker comment), Twitter/X (launch thread), Reddit (post for r/SideProject and r/indiehackers), Hacker News (Show HN post), and IndieHackers (launch post with backstory)." },
            { q: "How is this different from ChatGPT or other AI writers?", a: "Generic AI writers produce generic copy. ShipProof's generator is specifically trained on platform norms — it knows that Reddit hates marketing speak, HN values technical depth, and Product Hunt rewards concise taglines. Each output matches the specific culture of its platform." },
            { q: "Can I edit the generated content?", a: "Absolutely. The generated content is a strong starting point. We recommend personalizing it with your own voice, specific numbers, and unique insights before posting." },
            { q: "What happens after I launch?", a: "That's where ShipProof's full platform comes in. After launching, you can collect the praise and feedback from each platform, organize it, and embed it as social proof on your website. The free plan gets you started." },
          ].map((item) => (
            <details key={item.q} className="py-4 group">
              <summary className="text-sm font-semibold text-foreground cursor-pointer list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Attribution */}
      <div className="text-center border-t border-border mt-12 pt-10 pb-16">
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <a href="/" className="text-[#6366F1] font-medium hover:text-[#818CF8] transition-colors">
            ShipProof
          </a>
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          The all-in-one launch toolkit — from first post to social proof.
        </p>
      </div>
    </div>
  );
}

/* ─── Form field helpers ─── */

function Field({ label, value, onChange, placeholder, sublabel }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; sublabel?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground/90 mb-1.5 block">
        {label}
        {sublabel && <span className="font-normal text-muted-foreground ml-1.5">({sublabel})</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#6366F1] focus:outline-none transition-colors"
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 3, sublabel }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; sublabel?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground/90 mb-1.5 block">
        {label}
        {sublabel && <span className="font-normal text-muted-foreground ml-1.5">({sublabel})</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-border bg-card/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#6366F1] focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}
