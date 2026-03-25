import { useState, useEffect } from "react";
import type { Product } from "../../lib/api";
import { setDefaultProductId } from "../../lib/storage";

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors duration-150 ${
        checked ? "bg-[#6366F1]" : "bg-[#2A2A32]"
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform duration-150 ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsView({
  apiKey,
  products,
  selectedProductId,
  setSelectedProductId,
  onBack,
  onDisconnect,
}: {
  apiKey: string;
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  onBack: () => void;
  onDisconnect: () => void;
}) {
  const truncatedKey =
    apiKey.length > 16
      ? apiKey.slice(0, 6) + "..." + apiKey.slice(-4)
      : apiKey;

  const [autoDetect, setAutoDetect] = useState(true);
  const [afterSave, setAfterSave] = useState<"auto-close" | "stay-open">(
    "auto-close",
  );

  useEffect(() => {
    chrome.storage.local.get(
      ["autoDetectPlatform", "afterSave"],
      (result) => {
        if (result.autoDetectPlatform !== undefined)
          setAutoDetect(result.autoDetectPlatform as boolean);
        if (result.afterSave)
          setAfterSave(result.afterSave as "auto-close" | "stay-open");
      },
    );
  }, []);

  return (
    <div className="min-h-[480px] bg-[#0C0C0E] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E24]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[#8B8B92] hover:text-[#EDEDEF] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <span className="text-sm font-medium text-[#EDEDEF]">Settings</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {/* Account */}
        <div className="space-y-2">
          <p className="text-xs text-[#55555C]">Connected as</p>
          <p className="text-[13px] text-[#EDEDEF] font-mono">
            {truncatedKey}
          </p>
          <button
            onClick={onDisconnect}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="border-t border-[#1E1E24]" />

        {/* Default Product */}
        <div className="space-y-2">
          <p className="text-xs text-[#55555C]">Default Product</p>
          {products.length === 0 ? (
            <p className="text-[13px] text-[#55555C]">No products</p>
          ) : (
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setDefaultProductId(e.target.value);
              }}
              className="w-full rounded-lg border border-[#1E1E24] bg-[#1A1A1F] px-3 py-2 text-[13px] text-[#EDEDEF] focus:border-[#6366F1] focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="border-t border-[#1E1E24]" />

        {/* Auto-detect Platform */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] text-[#EDEDEF]">
              Auto-detect platform
            </div>
            <div className="text-[11px] text-[#55555C] mt-0.5">
              Detect platform from page URL
            </div>
          </div>
          <ToggleSwitch
            checked={autoDetect}
            onChange={(val) => {
              setAutoDetect(val);
              chrome.storage.local.set({ autoDetectPlatform: val });
            }}
          />
        </div>

        <div className="border-t border-[#1E1E24]" />

        {/* After Save */}
        <div>
          <p className="text-xs text-[#55555C] mb-2">After saving proof</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="afterSave"
                value="auto-close"
                checked={afterSave === "auto-close"}
                onChange={() => {
                  setAfterSave("auto-close");
                  chrome.storage.local.set({ afterSave: "auto-close" });
                }}
                className="accent-[#6366F1]"
              />
              <span className="text-[13px] text-[#EDEDEF]">
                Close popup after 3 seconds
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="afterSave"
                value="stay-open"
                checked={afterSave === "stay-open"}
                onChange={() => {
                  setAfterSave("stay-open");
                  chrome.storage.local.set({ afterSave: "stay-open" });
                }}
                className="accent-[#6366F1]"
              />
              <span className="text-[13px] text-[#EDEDEF]">
                Stay open for another capture
              </span>
            </label>
          </div>
        </div>

        <div className="border-t border-[#1E1E24]" />

        {/* Links */}
        <div className="space-y-2">
          <a
            href="https://shipproof.io/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[13px] text-[#818CF8] hover:text-[#6366F1] transition-colors"
          >
            Open Dashboard
          </a>
          <a
            href="https://shipproof.io/dashboard/settings?tab=api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[13px] text-[#818CF8] hover:text-[#6366F1] transition-colors"
          >
            Manage API Keys
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1E1E24] text-center">
        <p className="text-[11px] text-[#55555C]">
          ShipProof Proof Collector v1.1.0
        </p>
        <a
          href="https://shipproof.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[#6366F1] hover:text-[#818CF8] transition-colors"
        >
          shipproof.io
        </a>
      </div>
    </div>
  );
}
