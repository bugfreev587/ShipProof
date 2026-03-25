import { useState, useEffect } from "react";

export default function SuccessView({
  onCaptureAnother,
}: {
  onCaptureAnother: () => void;
}) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[480px] bg-[#0C0C0E] flex flex-col items-center justify-center px-8">
      {/* Animated check */}
      <div
        className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center"
        style={{ animation: "checkPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#22C55E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="mt-5 text-lg font-medium text-white">Proof saved!</h2>
      <p className="mt-1 text-[13px] text-[#8B8B92] text-center">
        Review and approve it in your Dashboard.
      </p>

      <div className="mt-5 space-y-3 flex flex-col items-center">
        <a
          href="https://shipproof.io/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[#2A2A32] px-6 py-2.5 text-sm text-[#EDEDEF] hover:border-[#55555C] transition-colors"
        >
          Open Dashboard
        </a>

        <button
          onClick={onCaptureAnother}
          className="text-sm text-[#818CF8] hover:text-[#6366F1] transition-colors"
        >
          Capture Another
        </button>
      </div>

      <p className="mt-4 text-xs text-[#55555C]">
        Closing in {countdown}s...
      </p>

      <style>{`
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
