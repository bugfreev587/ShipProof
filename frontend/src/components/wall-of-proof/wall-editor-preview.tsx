"use client";

import { useState } from "react";
import type { WallProof, WallDisplayConfig } from "./types";
import { getWallThemeColors } from "./types";
import WallMasonry from "./wall-masonry";
import WallCarousel from "./wall-carousel";
import AiSummaryCard from "./ai-summary-card";

interface WallEditorPreviewProps {
  proofs: WallProof[];
  config: WallDisplayConfig;
  onConfigChange: (config: WallDisplayConfig) => void;
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[#6366F1] text-white"
          : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? "bg-[#6366F1]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </label>
  );
}

export default function WallEditorPreview({
  proofs,
  config,
  onConfigChange,
}: WallEditorPreviewProps) {
  const theme = getWallThemeColors(config.theme);
  const [showAiSummary, setShowAiSummary] = useState(false);

  const update = (partial: Partial<WallDisplayConfig>) => {
    onConfigChange({ ...config, ...partial });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Display Settings
        </h4>

        {/* Layout */}
        <div className="space-y-1.5">
          <span className="text-xs text-[var(--text-secondary)]">Layout</span>
          <div className="flex gap-2">
            <ToggleButton
              active={config.layout === "masonry"}
              onClick={() => update({ layout: "masonry" })}
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </span>
            </ToggleButton>
            <ToggleButton
              active={config.layout === "carousel"}
              onClick={() => update({ layout: "carousel" })}
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Carousel
              </span>
            </ToggleButton>
          </div>
        </div>

        {/* Columns (only for masonry) */}
        {config.layout === "masonry" && (
          <div className="space-y-1.5">
            <span className="text-xs text-[var(--text-secondary)]">Columns</span>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((n) => (
                <ToggleButton
                  key={n}
                  active={(config.columns || 3) === n}
                  onClick={() => update({ columns: n })}
                >
                  {n}
                </ToggleButton>
              ))}
            </div>
          </div>
        )}

        {/* Theme */}
        <div className="space-y-1.5">
          <span className="text-xs text-[var(--text-secondary)]">Theme</span>
          <div className="flex gap-2">
            {(["dark", "light", "dim", "gray"] as const).map((t) => (
              <ToggleButton
                key={t}
                active={config.theme === t}
                onClick={() => update({ theme: t })}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </ToggleButton>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          <ToggleSwitch
            label="AI Summary"
            checked={showAiSummary}
            onChange={setShowAiSummary}
          />
          <ToggleSwitch
            label="Source badges"
            checked={config.showSourceBadges}
            onChange={(v) => update({ showSourceBadges: v })}
          />
          <ToggleSwitch
            label="Verified tags"
            checked={config.showVerifiedTags}
            onChange={(v) => update({ showVerifiedTags: v })}
          />
          <ToggleSwitch
            label="Time context"
            checked={config.showTimeContext}
            onChange={(v) => update({ showTimeContext: v })}
          />
          <ToggleSwitch
            label="Branding"
            checked={config.showBranding}
            onChange={(v) => update({ showBranding: v })}
          />
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-xl overflow-hidden p-4"
        style={{
          background: theme.bgBase,
          border: `1px solid ${theme.borderColor}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: theme.textTertiary }}
          >
            Preview
          </span>
        </div>

        {showAiSummary && proofs.length > 0 && (
          <AiSummaryCard proofs={proofs} theme={theme} />
        )}

        {proofs.length === 0 ? (
          <div
            className="text-center py-8 text-sm"
            style={{ color: theme.textTertiary }}
          >
            Add proofs to this wall to see a preview.
          </div>
        ) : config.layout === "carousel" ? (
          <WallCarousel
            proofs={proofs}
            theme={theme}
            borderRadius={config.borderRadius}
            showSourceBadges={config.showSourceBadges}
            showVerifiedTags={config.showVerifiedTags}
            showTimeContext={config.showTimeContext}
          />
        ) : (
          <WallMasonry
            proofs={proofs}
            theme={theme}
            columns={config.columns || 3}
            spacing={config.cardSpacing}
            borderRadius={config.borderRadius}
            showSourceBadges={config.showSourceBadges}
            showVerifiedTags={config.showVerifiedTags}
            showTimeContext={config.showTimeContext}
          />
        )}
      </div>
    </div>
  );
}
