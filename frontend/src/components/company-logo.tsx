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
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <img
      src={url}
      alt=""
      width={20}
      height={20}
      style={{ borderRadius: "4px", position: "absolute", top, right }}
      onError={() => setHidden(true)}
    />
  );
}
