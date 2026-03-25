import { useState } from "react";
import { setApiKey } from "../../lib/storage";
import { fetchProducts } from "../../lib/api";

export default function LoginView({
  onConnected,
}: {
  onConnected: (key: string) => void;
}) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!key.trim()) return;
    setConnecting(true);
    setError("");
    try {
      await fetchProducts(key.trim());
      await setApiKey(key.trim());
      onConnected(key.trim());
    } catch {
      setError("Invalid API key");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-[480px] bg-[#0C0C0E] flex flex-col items-center justify-center px-8 py-10">
      {/* Logo */}
      <svg width="48" height="48" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="#6366F1" />
        <path
          d="M32,46 C32,46 16,35 16,26 C16,20 19,17 24,17 C27,17 30,19 32,21 C34,19 37,17 40,17 C45,17 48,20 48,26 C48,35 32,46 32,46Z"
          fill="white"
        />
      </svg>

      <h1 className="mt-4 text-lg font-medium text-white">Proof Collector</h1>
      <p className="mt-1 text-[13px] text-[#8B8B92] text-center">
        Capture social proof from anywhere on the web.
      </p>

      <div className="w-full mt-6 space-y-3">
        <label className="block text-xs text-[#8B8B92]">API Key</label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            placeholder="Paste your API key from Dashboard"
            className="w-full rounded-xl border border-[#1E1E24] bg-[#1A1A1F] px-4 py-3 text-[13px] text-[#EDEDEF] placeholder-[#55555C] focus:border-[#6366F1] focus:outline-none transition-colors"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55555C] hover:text-[#8B8B92] transition-colors"
          >
            {showKey ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={connecting || !key.trim()}
          className="w-full rounded-xl bg-[#6366F1] py-3 text-sm font-medium text-white hover:bg-[#818CF8] disabled:bg-[#1E1E24] disabled:text-[#55555C] disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {connecting ? "Connecting..." : "Connect"}
        </button>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-[#55555C]">
          Get your API key from{" "}
          <a
            href="https://shipproof.io/dashboard/settings?tab=api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#818CF8] hover:text-[#6366F1] transition-colors"
          >
            ShipProof Dashboard
          </a>
        </p>
        <p className="text-xs text-[#55555C]">
          Don&apos;t have an account?{" "}
          <a
            href="https://shipproof.io/sign-up"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#818CF8] hover:text-[#6366F1] transition-colors"
          >
            Sign up free
          </a>
        </p>
      </div>
    </div>
  );
}
