"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0F0F10]">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
