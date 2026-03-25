import { captureVisible } from "../../lib/api";

export default function ScreenshotTab({
  screenshot,
  setScreenshot,
}: {
  screenshot: string | null;
  setScreenshot: (s: string | null) => void;
}) {
  const handleCapture = async () => {
    try {
      const dataUrl = await captureVisible();
      setScreenshot(dataUrl);
    } catch {
      // capture failed (e.g. chrome:// page)
    }
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
        <span className="text-[13px] text-[#8B8B92]">Capture visible area</span>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleCapture}
          className="rounded-xl border border-[#2A2A32] px-6 py-2.5 text-sm text-[#EDEDEF] hover:border-[#55555C] transition-colors"
        >
          Capture
        </button>
      </div>
    </div>
  );
}
