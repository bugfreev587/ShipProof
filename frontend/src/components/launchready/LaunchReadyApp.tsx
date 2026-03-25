"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { LogoIcon } from "@/components/Logo";
import {
  platforms,
  plannerPhases,
  type Platform,
  type LaunchDay,
} from "./data";
import LaunchPlanner from "./LaunchPlanner";

const LS_KEY_CHECKED = "launchready-progress";
const LS_KEY_PLATFORMS = "launchready-platforms";
const LS_KEY_LAUNCH_DAY = "launchready-launch-day";

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

function StartOverDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm motion-safe:animate-[fadeIn_150ms_ease]"
    >
      <div className="bg-[#141418] border border-[#1E1E24] rounded-xl p-6 max-w-sm mx-4 w-full motion-safe:animate-[fadeSlideIn_150ms_ease]">
        <h3 className="text-base font-medium text-[#EDEDEF] mb-2">
          Start a new launch?
        </h3>
        <p className="text-sm text-[#8B8B92] leading-relaxed mb-6">
          This will clear all progress, platform selections, and launch day
          settings so you can plan your next launch from scratch.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#8B8B92] hover:text-[#EDEDEF] transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors duration-150 cursor-pointer"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  checked,
  total,
  onStartOver,
}: {
  checked: number;
  total: number;
  onStartOver: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100);
  const done = pct === 100 && total > 0;

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-2 text-sm">
        <span className="text-[#8B8B92]">
          {checked} of {total} completed
          {done && (
            <span className="text-[#22C55E] ml-2">
              {"\ud83c\udf89"} You&apos;re ready to launch!
            </span>
          )}
          {!done && (
            <span className="text-[#8B8B92] ml-2">{pct}%</span>
          )}
        </span>
        <button
          onClick={onStartOver}
          className="text-xs text-[#55555C] hover:text-[#8B8B92] transition-colors duration-150 cursor-pointer"
        >
          Start Over
        </button>
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

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export function LaunchReadyApp() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [launchDay, setLaunchDay] = useState<LaunchDay>("tue");
  const [hydrated, setHydrated] = useState(false);
  const [showStartOver, setShowStartOver] = useState(false);
  const step1Ref = useRef<HTMLElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedChecked = localStorage.getItem(LS_KEY_CHECKED);
      if (savedChecked) setCheckedItems(new Set(JSON.parse(savedChecked)));
      const savedPlatforms = localStorage.getItem(LS_KEY_PLATFORMS);
      if (savedPlatforms) setSelectedPlatforms(new Set(JSON.parse(savedPlatforms)));
      const savedDay = localStorage.getItem(LS_KEY_LAUNCH_DAY);
      if (savedDay) setLaunchDay(savedDay as LaunchDay);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY_CHECKED, JSON.stringify([...checkedItems]));
  }, [checkedItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY_PLATFORMS, JSON.stringify([...selectedPlatforms]));
  }, [selectedPlatforms, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY_LAUNCH_DAY, launchDay);
  }, [launchDay, hydrated]);

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

  const handleStartOver = useCallback(() => {
    setCheckedItems(new Set());
    setSelectedPlatforms(new Set());
    setLaunchDay("tue");
    setShowStartOver(false);
    localStorage.removeItem(LS_KEY_CHECKED);
    localStorage.removeItem(LS_KEY_PLATFORMS);
    localStorage.removeItem(LS_KEY_LAUNCH_DAY);
    setTimeout(() => {
      step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  // Compute visible items for progress
  const allVisible = useMemo(() => {
    return plannerPhases.flatMap((phase) =>
      phase.items.filter(
        (item) => !item.platforms || item.platforms.some((p) => selectedPlatforms.has(p))
      )
    );
  }, [selectedPlatforms]);

  const totalChecked = useMemo(
    () => allVisible.filter((item) => checkedItems.has(item.id)).length,
    [allVisible, checkedItems]
  );

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

      {/* Header */}
      <header className="pt-20 pb-12 text-center px-4">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoIcon size={24} />
          </Link>
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

      <main className="max-w-4xl mx-auto px-4 pb-24">
        {/* Step 1: Platform selector */}
        <section ref={step1Ref} className="mb-12">
          <h2 className="text-lg font-medium tracking-[-0.5px] mb-1 text-center">
            Where are you launching?
          </h2>
          <p className="text-sm text-[#8B8B92] mb-6 text-center">
            Select the platforms you&apos;re targeting. We&apos;ll customize
            your plan.
          </p>
          <PlatformSelector
            selected={selectedPlatforms}
            onToggle={togglePlatform}
          />
        </section>

        {/* Step 2 + 3: Day picker + planner */}
        {hasPlatforms && (
          <section className="motion-safe:animate-[fadeIn_300ms_ease]">
            <ProgressBar
              checked={totalChecked}
              total={allVisible.length}
              onStartOver={() => setShowStartOver(true)}
            />

            <LaunchPlanner
              selectedPlatforms={selectedPlatforms}
              launchDay={launchDay}
              onLaunchDayChange={setLaunchDay}
              checkedItems={checkedItems}
              onToggleItem={toggleItem}
            />

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
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/"
                  className="inline-block border border-[#2A2A32] hover:border-[#55555C] text-[#8B8B92] hover:text-[#EDEDEF] font-medium text-sm rounded-full px-8 py-3 transition-all duration-150"
                >
                  Learn More &rarr;
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-block bg-[#6366F1] hover:bg-[#818CF8] text-white font-medium text-sm rounded-full px-8 py-3 transition-colors duration-150"
                >
                  Get Started Free &rarr;
                </Link>
              </div>
            </section>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-[#55555C]">
        Built by{" "}
        <Link href="/" className="hover:text-[#8B8B92] transition-colors">
          ShipProof
        </Link>
        {" "}&middot; &copy; {new Date().getFullYear()}
      </footer>

      <StartOverDialog
        open={showStartOver}
        onClose={() => setShowStartOver(false)}
        onConfirm={handleStartOver}
      />
    </div>
  );
}
