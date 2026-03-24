"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Skip tracking for admin/dashboard pages
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return;

    const utm_source = searchParams.get("utm_source") || null;
    const utm_medium = searchParams.get("utm_medium") || null;
    const utm_campaign = searchParams.get("utm_campaign") || null;

    fetch(`${API_URL}/api/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        utm_source,
        utm_medium,
        utm_campaign,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
