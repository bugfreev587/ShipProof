import { useState, useEffect, useCallback } from "react";
import {
  fetchProducts,
  getTabInfo,
  getSelection,
  createTextProof,
  createImageProof,
  type Product,
} from "../../lib/api";
import {
  getDefaultProductId,
  setDefaultProductId,
  clearAll,
} from "../../lib/storage";
import { detectPlatform } from "../../lib/platform-detect";
import ScreenshotTab from "./ScreenshotTab";
import TextTab from "./TextTab";
import InfoFields from "./InfoFields";
import SettingsView from "./SettingsView";

type Tab = "screenshot" | "text";

export default function CaptureView({
  apiKey,
  onSuccess,
  onLogout,
}: {
  apiKey: string;
  onSuccess: () => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("screenshot");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const [platform, setPlatform] = useState("other");
  const [sourceUrl, setSourceUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const init = useCallback(async () => {
    try {
      // Fetch products
      const prods = await fetchProducts(apiKey);
      setProducts(prods);

      // Set default product
      const defaultId = await getDefaultProductId();
      if (defaultId && prods.some((p) => p.id === defaultId)) {
        setSelectedProductId(defaultId);
      } else if (prods.length > 0) {
        setSelectedProductId(prods[0].id);
      }

      // Get tab info
      const tabInfo = await getTabInfo();
      setSourceUrl(tabInfo.url);
      setPlatform(detectPlatform(tabInfo.url));

      // Check for pending data from context menus or area capture
      const stored = await chrome.storage.local.get([
        "pendingText",
        "pendingImageUrl",
        "pendingUrl",
        "pendingPlatform",
        "capturedImage",
        "capturedRect",
        "capturedDpr",
      ]);

      if (stored.pendingText) {
        setText(stored.pendingText as string);
        setHasSelection(true);
        setActiveTab("text");
        if (stored.pendingUrl) setSourceUrl(stored.pendingUrl as string);
        if (stored.pendingPlatform)
          setPlatform(stored.pendingPlatform as string);
        // Clear pending
        await chrome.storage.local.remove([
          "pendingText",
          "pendingUrl",
          "pendingPlatform",
        ]);
        return;
      }

      if (stored.pendingImageUrl) {
        // Use the image URL directly as screenshot
        setScreenshot(stored.pendingImageUrl as string);
        setActiveTab("screenshot");
        if (stored.pendingUrl) setSourceUrl(stored.pendingUrl as string);
        if (stored.pendingPlatform)
          setPlatform(stored.pendingPlatform as string);
        await chrome.storage.local.remove([
          "pendingImageUrl",
          "pendingUrl",
          "pendingPlatform",
        ]);
        return;
      }

      if (stored.capturedImage && stored.capturedRect) {
        // Crop the captured image using Canvas
        const cropped = await cropImage(
          stored.capturedImage as string,
          stored.capturedRect as {
            x: number;
            y: number;
            width: number;
            height: number;
          },
          (stored.capturedDpr as number) || 1,
        );
        setScreenshot(cropped);
        setActiveTab("screenshot");
        await chrome.storage.local.remove([
          "capturedImage",
          "capturedRect",
          "capturedDpr",
        ]);
        return;
      }

      // Get selection (normal flow)
      const sel = await getSelection();
      if (sel) {
        setText(sel);
        setHasSelection(true);
        setActiveTab("text");
      }
    } catch {
      // might fail on restricted pages
    }
  }, [apiKey]);

  useEffect(() => {
    init();
  }, [init]);

  // Remember selected product
  useEffect(() => {
    if (selectedProductId) {
      setDefaultProductId(selectedProductId);
    }
  }, [selectedProductId]);

  const canSave =
    selectedProductId &&
    ((activeTab === "screenshot" && screenshot) ||
      (activeTab === "text" && text.trim()));

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      if (activeTab === "screenshot" && screenshot) {
        await createImageProof(apiKey, {
          productId: selectedProductId,
          imageDataUrl: screenshot,
          sourcePlatform: platform,
          sourceUrl,
        });
      } else if (activeTab === "text" && text.trim()) {
        await createTextProof(apiKey, {
          productId: selectedProductId,
          contentText: text.trim(),
          authorName: authorName.trim() || "Anonymous",
          sourcePlatform: platform,
          sourceUrl,
        });
      }
      // Show success badge
      chrome.runtime.sendMessage({ type: "SHOW_SUCCESS_BADGE" });
      onSuccess();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearAll();
    onLogout();
  };

  if (showSettings) {
    return (
      <SettingsView
        apiKey={apiKey}
        products={products}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        onBack={() => setShowSettings(false)}
        onDisconnect={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-[480px] bg-[#0C0C0E] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E24]">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="#6366F1" />
            <path
              d="M32,46 C32,46 16,35 16,26 C16,20 19,17 24,17 C27,17 30,19 32,21 C34,19 37,17 40,17 C45,17 48,20 48,26 C48,35 32,46 32,46Z"
              fill="white"
            />
          </svg>
          <span className="text-sm font-medium text-[#EDEDEF]">ShipProof</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-[#55555C] hover:text-[#8B8B92] transition-colors p-1"
          title="Settings"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-[#1E1E24]">
        {(["screenshot", "text"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "text-[#EDEDEF]"
                : "text-[#55555C] hover:text-[#8B8B92]"
            }`}
            style={{
              borderBottom:
                activeTab === tab
                  ? "2px solid #6366F1"
                  : "2px solid transparent",
            }}
          >
            {tab === "screenshot" ? "Screenshot" : "Text"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {activeTab === "screenshot" ? (
          <ScreenshotTab screenshot={screenshot} setScreenshot={setScreenshot} />
        ) : (
          <TextTab text={text} setText={setText} hasSelection={hasSelection} />
        )}

        <InfoFields
          platform={platform}
          setPlatform={setPlatform}
          sourceUrl={sourceUrl}
          products={products}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          authorName={authorName}
          setAuthorName={setAuthorName}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`w-full rounded-xl py-3 text-sm font-medium transition-all active:scale-[0.97] ${
            canSave && !saving
              ? "bg-[#6366F1] text-white hover:bg-[#818CF8]"
              : "bg-[#1E1E24] text-[#55555C] cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : "Save to ShipProof"}
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-center text-[11px] text-[#55555C]">
        Proof Collector by ShipProof
      </div>
    </div>
  );
}

// Crop image using Canvas (runs in popup context which has DOM access)
function cropImage(
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
  dpr: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(
        img,
        rect.x * dpr,
        rect.y * dpr,
        rect.width * dpr,
        rect.height * dpr,
        0,
        0,
        rect.width * dpr,
        rect.height * dpr,
      );
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}
