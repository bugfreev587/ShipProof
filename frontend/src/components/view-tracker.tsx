"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/api";

export function ViewTracker({
  entityType,
  slug,
}: {
  entityType: "space" | "wall";
  slug: string;
}) {
  useEffect(() => {
    recordView(entityType, slug);
  }, [entityType, slug]);

  return null;
}
