"use client";

import { useState, type FormEvent } from "react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoFull } from "@/components/Logo";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tosError, setTosError] = useState(false);

  // Flow state
  const [step, setStep] = useState<"start" | "verify">("start");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F0F10]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
      </div>
    );
  }

  // ── OAuth ──────────────────────────────────────────────────────────────────
  async function handleOAuth(strategy: "oauth_google") {
    if (!agreed) {
      setTosError(true);
      return;
    }
    setTosError(false);
    setError("");
    try {
      await signUp!.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
        legalAccepted: true,
      });
    } catch (err: unknown) {
      setError(clerkErrorMessage(err));
    }
  }

  // ── Email / password ───────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setTosError(true);
      return;
    }
    setTosError(false);
    setError("");
    setLoading(true);
    try {
      await signUp!.create({
        emailAddress: email,
        password,
        legalAccepted: true,
      });
      await signUp!.prepareEmailAddressVerification({
        strategy: "email_code",
      });
      setStep("verify");
    } catch (err: unknown) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Verification ───────────────────────────────────────────────────────────
  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && result.createdSessionId) {
        await setActive!({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      setError(clerkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Start step ─────────────────────────────────────────────────────────────
  if (step === "start") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F0F10] px-4">
        <div className="mb-8">
          <LogoFull size={36} />
        </div>
        <div className="w-full max-w-md rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8">
          <h1 className="mb-1 text-2xl font-bold text-[#F1F1F3]">
            Create your account
          </h1>
          <p className="mb-6 text-sm text-[#9CA3AF]">
            Welcome! Please fill in the details to get started.
          </p>

          {/* OAuth */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#2A2A30] bg-[#242429] px-4 py-2.5 text-sm font-medium text-[#F1F1F3] transition-colors hover:border-[#3F3F46] hover:bg-[#2A2A30]"
            onClick={() => handleOAuth("oauth_google")}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#2A2A30]" />
            <span className="text-xs text-[#6B7280]">or</span>
            <div className="h-px flex-1 bg-[#2A2A30]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#9CA3AF]">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#2A2A30] bg-[#242429] px-3 py-2.5 text-sm text-[#F1F1F3] placeholder-[#6B7280] outline-none transition-colors focus:border-[#6366F1]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#9CA3AF]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password"
                className="w-full rounded-lg border border-[#2A2A30] bg-[#242429] px-3 py-2.5 text-sm text-[#F1F1F3] placeholder-[#6B7280] outline-none transition-colors focus:border-[#6366F1]"
              />
            </div>

            {/* ToS checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (e.target.checked) setTosError(false);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#2A2A30] bg-[#242429] accent-[#6366F1]"
              />
              <span className="text-xs leading-relaxed text-[#9CA3AF]">
                I agree to the ShipProof{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-[#818CF8] underline hover:text-[#6366F1]"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-[#818CF8] underline hover:text-[#6366F1]"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>
            {tosError && (
              <p className="text-xs text-red-400">
                Please agree to the Terms of Service and Privacy Policy to
                continue.
              </p>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#6366F1] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#818CF8] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Continue"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-[#818CF8] hover:text-[#6366F1]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Verify step ────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F0F10] px-4">
      <div className="mb-8">
        <LogoFull size={36} />
      </div>
      <div className="w-full max-w-md rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8">
        <h1 className="mb-1 text-2xl font-bold text-[#F1F1F3]">
          Verify your email
        </h1>
        <p className="mb-6 text-sm text-[#9CA3AF]">
          We sent a verification code to{" "}
          <span className="font-medium text-[#F1F1F3]">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#9CA3AF]">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full rounded-lg border border-[#2A2A30] bg-[#242429] px-3 py-2.5 text-sm text-[#F1F1F3] placeholder-[#6B7280] outline-none transition-colors focus:border-[#6366F1]"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#6366F1] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#818CF8] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
          onClick={() => {
            setStep("start");
            setError("");
            setCode("");
          }}
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function clerkErrorMessage(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "errors" in err &&
    Array.isArray((err as { errors: unknown[] }).errors)
  ) {
    const first = (
      err as { errors: { longMessage?: string; message?: string }[] }
    ).errors[0];
    return first?.longMessage || first?.message || "Something went wrong.";
  }
  return (err as Error)?.message || "Something went wrong.";
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
