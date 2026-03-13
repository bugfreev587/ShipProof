"use client";

import { useState } from "react";

export function CompanyLogoImg({
  url,
  top = "12px",
  right = "12px",
}: {
  url: string;
  top?: string;
  right?: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  if (status === "error") return null;
  return (
    <img
      src={url}
      alt=""
      width={20}
      height={20}
      style={{
        borderRadius: "4px",
        position: "absolute",
        top,
        right,
        opacity: status === "loaded" ? 1 : 0,
        transition: "opacity 0.2s",
      }}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
    />
  );
}
