import { captureVisible } from "../../lib/api";

function sendToBackground(msg: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, () => resolve());
  });
}

export default function ScreenshotTab({
  screenshot,
  setScreenshot,
}: {
  screenshot: string | null;
  setScreenshot: (s: string | null) => void;
}) {
  const handleCaptureFullScreen = async () => {
    try {
      const dataUrl = await captureVisible();
      setScreenshot(dataUrl);
    } catch {
      // capture failed
    }
  };

  const handleCaptureArea = async () => {
    // Tell background to inject content script and start area capture
    await sendToBackground({ type: "START_AREA_CAPTURE" });
    // Close popup — area selector runs on the page
    // When done, captured image is stored in chrome.storage.local
    // Next time popup opens, CaptureView reads it
    window.close();
  };

  if (screenshot) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border border-[#1E1E24]">
          <img
            src={screenshot}
            alt="Screenshot"
            className="w-full h-[200px] object-cover"
          />
          <button
            onClick={() => setScreenshot(null)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80 transition-colors"
          >
            &times;
          </button>
        </div>
        <button
          onClick={() => setScreenshot(null)}
          className="text-xs text-[#8B8B92] hover:text-[#EDEDEF] transition-colors"
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-[200px] rounded-xl border-2 border-dashed border-[#2A2A32] flex flex-col items-center justify-center gap-2">
        <span className="text-2xl text-[#55555C]">📷</span>
        <span className="text-[13px] text-[#8B8B92]">
          Capture a screenshot
        </span>
      </div>
      <div className="flex justify-center gap-2">
        <button
          onClick={handleCaptureArea}
          className="rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm text-white hover:bg-[#818CF8] transition-colors"
        >
          Capture Area
        </button>
        <button
          onClick={handleCaptureFullScreen}
          className="rounded-xl border border-[#2A2A32] px-5 py-2.5 text-sm text-[#EDEDEF] hover:border-[#55555C] transition-colors"
        >
          Full Screen
        </button>
      </div>
    </div>
  );
}
