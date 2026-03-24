"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  plannerPhases,
  type Platform,
  type LaunchDay,
  type PlannerItem,
  type PlannerPhase,
  type Variant,
} from "./data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_INDEX: Record<LaunchDay, number> = {
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5,
};
const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function weekdayName(launchDay: LaunchDay, offset: number): string {
  const base = DAY_INDEX[launchDay];
  const idx = ((base + offset) % 7 + 7) % 7;
  return WEEKDAY_NAMES[idx];
}

const DAYS: { id: LaunchDay; label: string; recommended: boolean }[] = [
  { id: "mon", label: "Mon", recommended: false },
  { id: "tue", label: "Tue", recommended: true },
  { id: "wed", label: "Wed", recommended: true },
  { id: "thu", label: "Thu", recommended: true },
  { id: "fri", label: "Fri", recommended: false },
];

const variantNodeColor: Record<Variant, string> = {
  prep: "#55555C",
  warning: "#F59E0B",
  launch: "#6366F1",
  post: "#22C55E",
};

const platformBadgeLabels: Record<Platform, string> = {
  ph: "PH", reddit: "Reddit", hn: "HN", twitter: "X", ih: "IH",
};

function phaseSubtitle(phase: PlannerPhase, launchDay: LaunchDay): string {
  switch (phase.id) {
    case "prep":
      return "7 days before launch";
    case "prelaunch":
      return `${weekdayName(launchDay, -1)} \u00b7 1 day before`;
    case "launch":
      return `${weekdayName(launchDay, 0)} \u00b7 launch day \ud83d\ude80`;
    case "postlaunch":
      return "Days +1 to +4";
    default:
      return phase.subtitle;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
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
        We&apos;ll build your plan around this day
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
              <span className="text-[10px] text-[#55555C] mt-1">recommended</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckboxItem({
  item,
  checked,
  onToggle,
}: {
  item: PlannerItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#1E1E24] last:border-b-0 group">
      <button onClick={onToggle} aria-checked={checked} role="checkbox" className="mt-0.5 shrink-0 cursor-pointer">
        <div
          className={`w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-150
            ${checked
              ? "bg-[#6366F1] border-[#6366F1]"
              : "border-[1.5px] border-[#2A2A32] group-hover:border-[#55555C]"
            }`}
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="motion-safe:animate-[checkPop_150ms_ease]">
              <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </button>

      <div className="flex-1 min-w-0">
        {item.time && (
          <span className="font-mono text-xs text-[#55555C] mr-2">{item.time}</span>
        )}
        <span className={`text-sm leading-relaxed transition-all duration-150 ${checked ? "text-[#55555C] line-through" : "text-[#EDEDEF]"}`}>
          {item.text}
        </span>
        {item.hint && (
          <p className="text-xs text-[#55555C] mt-0.5 leading-relaxed">
            {item.hint}
            {item.cta && (
              <>
                {" "}
                <Link href={item.cta.href} className="text-[#818CF8] hover:text-[#6366F1] transition-colors duration-150">
                  {item.cta.text}
                </Link>
              </>
            )}
          </p>
        )}
        {!item.hint && item.cta && (
          <p className="text-xs mt-0.5">
            <Link href={item.cta.href} className="text-[#818CF8] hover:text-[#6366F1] transition-colors duration-150">
              {item.cta.text}
            </Link>
          </p>
        )}
      </div>

      {item.platforms && (
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          {item.platforms.map((pid) => (
            <span key={pid} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1E1E24] text-[#8B8B92]">
              {platformBadgeLabels[pid]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseCard({
  phase,
  launchDay,
  selectedPlatforms,
  checkedItems,
  onToggleItem,
  isLast,
}: {
  phase: PlannerPhase;
  launchDay: LaunchDay;
  selectedPlatforms: Set<Platform>;
  checkedItems: Set<string>;
  onToggleItem: (id: string) => void;
  isLast: boolean;
}) {
  const color = variantNodeColor[phase.variant];
  const isLaunch = phase.variant === "launch";
  const nodeSize = isLaunch ? 12 : 8;

  const visibleItems = phase.items.filter(
    (item) => !item.platforms || item.platforms.some((p) => selectedPlatforms.has(p))
  );

  if (visibleItems.length === 0) return null;

  // Group by subgroup
  const groups: { label: string | null; items: PlannerItem[] }[] = [];
  let currentGroup: string | null | undefined = undefined;
  for (const item of visibleItems) {
    const g = item.subgroup || null;
    if (g !== currentGroup) {
      groups.push({ label: g, items: [] });
      currentGroup = g;
    }
    groups[groups.length - 1].items.push(item);
  }

  return (
    <div className="relative flex gap-4 md:gap-6 pb-6 last:pb-0">
      {/* Timeline node + line — desktop */}
      <div className="hidden md:flex flex-col items-center w-6 shrink-0">
        <div
          className="shrink-0 rounded-full z-10"
          style={{
            width: nodeSize,
            height: nodeSize,
            backgroundColor: phase.variant === "prep" ? "transparent" : color,
            border: phase.variant === "prep" ? `2px solid ${color}` : "none",
            marginTop: 18,
          }}
        />
        {!isLast && <div className="flex-1 w-0.5 bg-[#1E1E24]" />}
      </div>

      {/* Card */}
      <div
        className={`flex-1 rounded-xl border p-5 transition-all duration-150 ${
          isLaunch
            ? "border-[#6366F1]/50 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
            : phase.variant === "warning"
              ? "border-[#F59E0B]/30"
              : "border-[#1E1E24]"
        } bg-[#141418]`}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 mb-4">
          {isLaunch && <span className="text-lg">{"\ud83d\ude80"}</span>}
          {/* Mobile node */}
          <div
            className="md:hidden shrink-0 rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: phase.variant === "prep" ? "transparent" : color,
              border: phase.variant === "prep" ? `2px solid ${color}` : "none",
            }}
          />
          <div>
            <h3 className={`font-medium ${isLaunch ? "text-lg text-[#EDEDEF]" : "text-sm text-[#EDEDEF]"}`}>
              {phase.label}
            </h3>
            <p className="text-xs text-[#55555C]">{phaseSubtitle(phase, launchDay)}</p>
          </div>
        </div>

        {/* Groups + items */}
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <h4 className="text-xs font-semibold text-[#8B8B92] uppercase tracking-wider mt-4 mb-1 first:mt-0">
                {group.label}
              </h4>
            )}
            {group.items.map((item) => (
              <CheckboxItem
                key={item.id}
                item={item}
                checked={checkedItems.has(item.id)}
                onToggle={() => onToggleItem(item.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function LaunchPlanner({
  selectedPlatforms,
  launchDay,
  onLaunchDayChange,
  checkedItems,
  onToggleItem,
}: {
  selectedPlatforms: Set<Platform>;
  launchDay: LaunchDay;
  onLaunchDayChange: (day: LaunchDay) => void;
  checkedItems: Set<string>;
  onToggleItem: (id: string) => void;
}) {
  const visiblePhases = useMemo(
    () =>
      plannerPhases.filter((phase) =>
        phase.items.some(
          (item) => !item.platforms || item.platforms.some((p) => selectedPlatforms.has(p))
        )
      ),
    [selectedPlatforms]
  );

  return (
    <div className="motion-safe:animate-[fadeSlideIn_200ms_ease]">
      <DayPicker
        launchDay={launchDay}
        onChange={onLaunchDayChange}
        hasPH={selectedPlatforms.has("ph")}
      />

      <div>
        {visiblePhases.map((phase, i) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            launchDay={launchDay}
            selectedPlatforms={selectedPlatforms}
            checkedItems={checkedItems}
            onToggleItem={onToggleItem}
            isLast={i === visiblePhases.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
