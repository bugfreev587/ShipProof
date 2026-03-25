export default function TextTab({
  text,
  setText,
  hasSelection,
}: {
  text: string;
  setText: (t: string) => void;
  hasSelection: boolean;
}) {
  if (hasSelection && text) {
    return (
      <div className="space-y-2">
        <div className="h-[200px] rounded-xl bg-[#1A1A1F] border border-[#1E1E24] p-4 overflow-y-auto">
          <p className="text-[13px] text-[#EDEDEF] leading-relaxed whitespace-pre-wrap">
            {text}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#22C55E]">Captured from selection</span>
          <button
            onClick={() => {
              // nothing — user can directly edit
            }}
            className="text-xs text-[#8B8B92] hover:text-[#EDEDEF] transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Paste the testimonial text here..."
      className="w-full h-[200px] rounded-xl bg-[#1A1A1F] border border-[#1E1E24] p-4 text-[13px] text-[#EDEDEF] placeholder-[#55555C] resize-none focus:border-[#6366F1] focus:outline-none transition-colors leading-relaxed"
    />
  );
}
