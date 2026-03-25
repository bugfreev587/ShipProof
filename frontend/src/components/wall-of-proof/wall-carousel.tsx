"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { WallProof, ThemeColors } from "./types";
import ProofCard from "./proof-card";

export default function WallCarousel({
  proofs,
  theme,
  borderRadius = 12,
  showSourceBadges = true,
  showVerifiedTags = true,
  showTimeContext = true,
}: {
  proofs: WallProof[];
  theme: ThemeColors;
  borderRadius?: number;
  showSourceBadges?: boolean;
  showVerifiedTags?: boolean;
  showTimeContext?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, proofs]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (proofs.length === 0) return null;

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.borderColor}`,
            color: theme.textPrimary,
          }}
          aria-label="Scroll left"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
          style={{
            background: theme.bgCard,
            border: `1px solid ${theme.borderColor}`,
            color: theme.textPrimary,
          }}
          aria-label="Scroll right"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Fade edges */}
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-12"
          style={{
            background: `linear-gradient(to right, ${theme.bgBase}, transparent)`,
          }}
        />
      )}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[5] w-12"
          style={{
            background: `linear-gradient(to left, ${theme.bgBase}, transparent)`,
          }}
        />
      )}

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {proofs.map((proof) => (
          <div
            key={proof.id}
            className="flex-shrink-0 w-[320px] sm:w-[360px]"
            style={{ scrollSnapAlign: "start" }}
          >
            <ProofCard
              proof={proof}
              theme={theme}
              borderRadius={borderRadius}
              showSourceBadges={showSourceBadges}
              showVerifiedTags={showVerifiedTags}
              showTimeContext={showTimeContext}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
