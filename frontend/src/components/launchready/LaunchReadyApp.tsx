"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/Logo";
import {
  platforms,
  checklistData,
  cheatSheets,
  type Platform,
  type Phase,
  type ChecklistItem,
} from "./data";

const LS_KEY_CHECKED = "launchready-progress";
const LS_KEY_PLATFORMS = "launchready-platforms";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlatformSelector({
  selected,
  onToggle,
}: {
  selected: Set<Platform>;
  onToggle: (p: Platform) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {platforms.map((p) => {
        const active = selected.has(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer
              ${
                active
                  ? "bg-[#6366F1]/10 border-[#6366F1]/50 text-[#818CF8]"
                  : "bg-transparent border-[#1E1E24] text-[#8B8B92] hover:border-[#2A2A32] hover:text-[#EDEDEF]"
              }`}
          >
            <span className="text-base leading-none">{p.icon}</span>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({
  checked,
  total,
}: {
  checked: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
  const done = pct === 100 && total > 0;

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-2 text-sm">
        <span className="text-[#8B8B92]">
          {checked} of {total} completed
        </span>
        <span className={done ? "text-[#22C55E]" : "text-[#8B8B92]"}>
          {done ? "\ud83c\udf89 Ready to launch!" : `${pct}%`}
        </span>
      </div>
      <div className="h-1 rounded-full bg-[#1E1E24] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: done ? "#22C55E" : "#6366F1",
          }}
        />
      </div>
    </div>
  );
}

function ChecklistItemRow({
  item,
  checked,
  onToggle,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
}) {
  const platformLabels: Record<Platform, string> = {
    ph: "PH",
    reddit: "Reddit",
    hn: "HN",
    twitter: "X",
    ih: "IH",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#1E1E24] last:border-b-0 group">
      {/* Custom checkbox */}
      <button
        onClick={onToggle}
        aria-checked={checked}
        role="checkbox"
        className="mt-0.5 shrink-0 cursor-pointer"
      >
        <div
          className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-150
            ${
              checked
                ? "bg-[#6366F1] border-[#6366F1]"
                : "border-[1.5px] border-[#2A2A32] group-hover:border-[#55555C]"
            }`}
          style={{
            transform: checked ? "scale(1)" : undefined,
          }}
        >
          {checked && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="motion-safe:animate-[checkPop_150ms_ease]"
            >
              <path
                d="M2.5 6L5 8.5L9.5 4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed transition-all duration-150 ${
            checked ? "text-[#55555C] line-through" : "text-[#EDEDEF]"
          }`}
        >
          {item.text}
        </p>
        {item.hint && (
          <p className="text-xs text-[#55555C] mt-0.5 leading-relaxed">
            {item.hint}
            {item.cta && (
              <>
                {" "}
                <Link
                  href={item.cta.href}
                  className="text-[#818CF8] hover:text-[#6366F1] transition-colors duration-150"
                >
                  {item.cta.text}
                </Link>
              </>
            )}
          </p>
        )}
        {!item.hint && item.cta && (
          <p className="text-xs mt-0.5">
            <Link
              href={item.cta.href}
              className="text-[#818CF8] hover:text-[#6366F1] transition-colors duration-150"
            >
              {item.cta.text}
            </Link>
          </p>
        )}
      </div>

      {/* Platform badges */}
      {item.platforms && (
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          {item.platforms.map((pid) => (
            <span
              key={pid}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1E1E24] text-[#8B8B92]"
            >
              {platformLabels[pid]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CheatSheetAccordion({
  selectedPlatforms,
}: {
  selectedPlatforms: Set<Platform>;
}) {
  const [openId, setOpenId] = useState<Platform | null>(null);
  const visible = cheatSheets.filter((cs) => selectedPlatforms.has(cs.platform));

  if (visible.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-medium text-[#EDEDEF] tracking-[-0.5px] mb-1">
        Platform cheat sheets
      </h2>
      <p className="text-sm text-[#8B8B92] mb-6">
        Quick reference for each platform&apos;s rules and best practices.
      </p>
      <div className="space-y-2">
        {visible.map((cs) => {
          const open = openId === cs.platform;
          return (
            <div
              key={cs.platform}
              className="rounded-xl border border-[#1E1E24] bg-[#141418] overflow-hidden"
            >
              <button
                onClick={() => setOpenId(open ? null : cs.platform)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-[#EDEDEF] hover:bg-[#1E1E24]/40 transition-colors duration-150 cursor-pointer"
              >
                {cs.label}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`text-[#55555C] transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div
                className={`transition-all duration-200 ease-out overflow-hidden ${
                  open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-5 pb-4">
                  <table className="w-full text-sm">
                    <tbody>
                      {cs.rows.map((row) => (
                        <tr key={row.key} className="border-t border-[#1E1E24]">
                          <td className="py-2 pr-6 text-[#8B8B92] whitespace-nowrap font-mono text-xs align-top">
                            {row.key}
                          </td>
                          <td className="py-2 text-[#EDEDEF] text-xs leading-relaxed">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export function LaunchReadyApp() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    new Set()
  );
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Phase>("before");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem(LS_KEY_CHECKED);
      if (savedChecked) setCheckedItems(new Set(JSON.parse(savedChecked)));
      const savedPlatforms = localStorage.getItem(LS_KEY_PLATFORMS);
      if (savedPlatforms)
        setSelectedPlatforms(new Set(JSON.parse(savedPlatforms)));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist checked items
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY_CHECKED, JSON.stringify([...checkedItems]));
  }, [checkedItems, hydrated]);

  // Persist platform selection
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      LS_KEY_PLATFORMS,
      JSON.stringify([...selectedPlatforms])
    );
  }, [selectedPlatforms, hydrated]);

  const togglePlatform = useCallback((p: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Filter items for current tab & selected platforms
  const visibleItems = useMemo(() => {
    const items = checklistData[activeTab];
    return items.filter(
      (item) =>
        !item.platforms ||
        item.platforms.some((p) => selectedPlatforms.has(p))
    );
  }, [activeTab, selectedPlatforms]);

  // Total across all phases for progress
  const allVisible = useMemo(() => {
    const phases: Phase[] = ["before", "day", "after"];
    return phases.flatMap((phase) =>
      checklistData[phase].filter(
        (item) =>
          !item.platforms ||
          item.platforms.some((p) => selectedPlatforms.has(p))
      )
    );
  }, [selectedPlatforms]);

  const totalChecked = useMemo(
    () => allVisible.filter((item) => checkedItems.has(item.id)).length,
    [allVisible, checkedItems]
  );

  const tabs: { id: Phase; label: string }[] = [
    { id: "before", label: "Before Launch" },
    { id: "day", label: "Launch Day" },
    { id: "after", label: "After Launch" },
  ];

  const hasPlatforms = selectedPlatforms.size > 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EDEDEF] selection:bg-[#6366F1]/30">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes checkPop {
              0% { transform: scale(0.7); opacity: 0; }
              60% { transform: scale(1.1); }
              100% { transform: scale(1); opacity: 1; }
            }
          `,
        }}
      />

      {/* Header */}
      <header className="pt-20 pb-12 text-center px-4">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <LogoIcon size={24} />
          <h1 className="text-[28px] font-semibold tracking-[-0.5px]">
            LaunchReady
          </h1>
        </div>
        <p className="text-base text-[#8B8B92] max-w-md mx-auto leading-relaxed">
          Your launch day co-pilot.
          <br />
          Plan your multi-platform launch in minutes. Free forever.
        </p>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-24">
        {/* Step 1: Platform selector */}
        <section className="mb-12">
          <h2 className="text-lg font-medium tracking-[-0.5px] mb-1 text-center">
            Where are you launching?
          </h2>
          <p className="text-sm text-[#8B8B92] mb-6 text-center">
            Select the platforms you&apos;re targeting. We&apos;ll customize
            your checklist.
          </p>
          <PlatformSelector
            selected={selectedPlatforms}
            onToggle={togglePlatform}
          />
        </section>

        {/* Step 2: Checklist */}
        {hasPlatforms && (
          <section className="motion-safe:animate-[fadeIn_300ms_ease]">
            <ProgressBar checked={totalChecked} total={allVisible.length} />

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#1E1E24] mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-sm font-medium transition-colors duration-150 relative cursor-pointer
                    ${
                      activeTab === tab.id
                        ? "text-[#EDEDEF]"
                        : "text-[#55555C] hover:text-[#8B8B92]"
                    }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="motion-safe:animate-[fadeSlideIn_200ms_ease]">
              {visibleItems.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  checked={checkedItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>

            {/* Cheat sheets */}
            <CheatSheetAccordion selectedPlatforms={selectedPlatforms} />

            {/* CTA section */}
            <section className="mt-20 text-center">
              <div className="border-t border-[#1E1E24] mb-12" />
              <p className="text-lg font-medium tracking-[-0.5px] mb-2">
                <span className="text-[#6366F1]">Ship</span>
                <span className="text-[#55555C] mx-2">&rarr;</span>
                <span className="text-[#22C55E]">Collect</span>
                <span className="text-[#55555C] mx-2">&rarr;</span>
                <span className="text-[#F59E0B]">Display</span>
              </p>
              <p className="text-[#8B8B92] text-sm mb-6 max-w-md mx-auto leading-relaxed">
                LaunchReady helps you plan. ShipProof helps you execute.
                <br />
                Generate launch copy for all 5 platforms with AI.
                <br />
                Collect community praise after launch.
                <br />
                Embed social proof on your landing page.
              </p>
              <Link
                href="/sign-up"
                className="inline-block bg-[#6366F1] hover:bg-[#818CF8] text-white font-medium text-sm rounded-full px-8 py-3 transition-colors duration-150"
              >
                Try ShipProof &mdash; Free &rarr;
              </Link>
            </section>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-[#55555C]">
        Built by ShipProof &middot; &copy; {new Date().getFullYear()}
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `,
        }}
      />
    </div>
  );
}
