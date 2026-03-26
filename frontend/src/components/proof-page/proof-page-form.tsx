"use client";

import { useState } from "react";

interface ProofPageFormProps {
  productSlug: string;
  productName: string;
  theme: {
    bgBase: string;
    bgCard: string;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
  };
}

const PLATFORMS = [
  { value: "product_hunt", label: "Product Hunt" },
  { value: "twitter", label: "Twitter / X" },
  { value: "reddit", label: "Reddit" },
  { value: "hackernews", label: "Hacker News" },
  { value: "indiehackers", label: "IndieHackers" },
  { value: "direct", label: "Direct / Other" },
];

export function ProofPageForm({ productSlug, productName, theme }: ProofPageFormProps) {
  const [step, setStep] = useState<"form" | "submitting" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [experience, setExperience] = useState("");
  const [rating, setRating] = useState(0);
  const [platform, setPlatform] = useState("direct");

  const canSubmit = name.trim() && email.includes("@") && experience.trim().length >= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Honeypot check
    const form = e.target as HTMLFormElement;
    const honeypot = (form.elements.namedItem("website_url") as HTMLInputElement)?.value;
    if (honeypot) return;

    setStep("submitting");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/public/products/${productSlug}/submit-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: name.trim(),
          author_email: email.trim(),
          author_handle: handle.trim() || undefined,
          author_title: title.trim() || undefined,
          content_text: experience.trim(),
          rating: rating > 0 ? rating : undefined,
          source_platform: platform,
          honeypot_field: honeypot || "",
        }),
      });

      const data = await res.json();

      if (data.success === false) {
        setErrorMessage(data.message || "Something went wrong.");
        setStep("error");
      } else {
        setStep("success");
      }
    } catch {
      setStep("success"); // Silent fail — don't reveal errors to potential bots
    }
  }

  // Success state
  if (step === "success") {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: "48px", height: "48px", borderRadius: "50%",
          backgroundColor: "#22C55E20", marginBottom: "16px"
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: "18px", fontWeight: 600, color: theme.textPrimary, marginBottom: "8px" }}>
          Thanks for sharing your experience!
        </h3>
        <p style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "24px" }}>
          Your proof is pending review by the {productName} team.
          Once approved, it will appear on this page.
        </p>
        <div style={{ borderTop: `1px solid ${theme.borderColor}`, paddingTop: "24px", marginTop: "8px" }}>
          <p style={{ fontSize: "13px", color: theme.textTertiary, marginBottom: "12px" }}>
            Want social proof like this for your product?
          </p>
          <a
            href="https://shipproof.io/sign-up"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              backgroundColor: "#6366F1",
              color: "white",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Try ShipProof free →
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div style={{ textAlign: "center", padding: "32px 24px" }}>
        <p style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "16px" }}>
          {errorMessage}
        </p>
        <button
          onClick={() => { setStep("form"); setErrorMessage(""); }}
          style={{
            padding: "8px 20px",
            border: `1px solid ${theme.borderColor}`,
            borderRadius: "8px",
            backgroundColor: "transparent",
            color: theme.textPrimary,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "480px", margin: "0 auto" }}>
      {/* Honeypot — hidden from humans */}
      <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
        <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Name */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
            Name <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
            style={{
              width: "100%", padding: "10px 14px", fontSize: "14px",
              borderRadius: "10px", border: `1px solid ${theme.borderColor}`,
              backgroundColor: theme.bgCard, color: theme.textPrimary,
              outline: "none",
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
            Email <span style={{ color: "#EF4444" }}>*</span>
            <span style={{ fontWeight: 400, color: theme.textTertiary, marginLeft: "8px" }}>Not displayed publicly</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              width: "100%", padding: "10px 14px", fontSize: "14px",
              borderRadius: "10px", border: `1px solid ${theme.borderColor}`,
              backgroundColor: theme.bgCard, color: theme.textPrimary,
              outline: "none",
            }}
          />
        </div>

        {/* Handle + Title side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
              Handle
            </label>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="@twitter"
              style={{
                width: "100%", padding: "10px 14px", fontSize: "14px",
                borderRadius: "10px", border: `1px solid ${theme.borderColor}`,
                backgroundColor: theme.bgCard, color: theme.textPrimary,
                outline: "none",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
              Title / Role
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Indie Hacker"
              style={{
                width: "100%", padding: "10px 14px", fontSize: "14px",
                borderRadius: "10px", border: `1px solid ${theme.borderColor}`,
                backgroundColor: theme.bgCard, color: theme.textPrimary,
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Experience */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
            Your experience <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <textarea
            value={experience}
            onChange={e => setExperience(e.target.value)}
            placeholder={`What do you think about ${productName}?`}
            required
            minLength={20}
            maxLength={500}
            rows={4}
            style={{
              width: "100%", padding: "10px 14px", fontSize: "14px",
              borderRadius: "10px", border: `1px solid ${theme.borderColor}`,
              backgroundColor: theme.bgCard, color: theme.textPrimary,
              outline: "none", resize: "none",
            }}
          />
          <div style={{ fontSize: "12px", color: theme.textTertiary, marginTop: "4px", textAlign: "right" }}>
            {experience.length}/500
          </div>
        </div>

        {/* Rating */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
            Rating
          </label>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? 0 : star)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "2px",
                  color: star <= rating ? "#F59E0B" : theme.borderColor,
                  fontSize: "24px", lineHeight: 1,
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: theme.textPrimary, marginBottom: "6px" }}>
            Where did you find us?
          </label>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", fontSize: "14px",
              borderRadius: "10px", border: `1px solid ${theme.borderColor}`,
              backgroundColor: theme.bgCard, color: theme.textPrimary,
              outline: "none",
            }}
          >
            {PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || step === "submitting"}
          style={{
            width: "100%", padding: "14px",
            backgroundColor: canSubmit ? "#6366F1" : `${theme.borderColor}`,
            color: canSubmit ? "white" : theme.textTertiary,
            borderRadius: "12px", border: "none",
            fontSize: "15px", fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: step === "submitting" ? 0.7 : 1,
          }}
        >
          {step === "submitting" ? "Submitting..." : "Submit your proof →"}
        </button>
      </div>
    </form>
  );
}
