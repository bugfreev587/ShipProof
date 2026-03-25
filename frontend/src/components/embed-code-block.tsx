"use client";

import { useState } from "react";

const embedCode = `<script type="text/javascript" src="https://shipproof.io/js/embed.js"></script>
<iframe id="shipproof-{your-space-slug}" src="https://shipproof.io/embed/{your-space-slug}" frameborder="0" scrolling="no" width="100%"></iframe>`;

export default function EmbedCodeBlock() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-muted border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:opacity-80 transition-all"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed">
        <code>
          <span className="text-[#6B7280]">&lt;</span>
          <span className="text-[#F59E0B]">script</span>
          <span className="text-[#818CF8]"> type</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;text/javascript&quot;</span>
          <span className="text-[#818CF8]"> src</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;https://shipproof.io/js/embed.js&quot;</span>
          <span className="text-[#6B7280]">&gt;&lt;/</span>
          <span className="text-[#F59E0B]">script</span>
          <span className="text-[#6B7280]">&gt;</span>
          {"\n"}
          <span className="text-[#6B7280]">&lt;</span>
          <span className="text-[#F59E0B]">iframe</span>
          <span className="text-[#818CF8]"> id</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;shipproof-&#123;slug&#125;&quot;</span>
          <span className="text-[#818CF8]"> src</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;https://shipproof.io/embed/&#123;slug&#125;&quot;</span>
          {"\n"}
          <span className="text-[#818CF8]">  frameborder</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;0&quot;</span>
          <span className="text-[#818CF8]"> scrolling</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;no&quot;</span>
          <span className="text-[#818CF8]"> width</span>
          <span className="text-[#6B7280]">=</span>
          <span className="text-[#10B981]">&quot;100%&quot;</span>
          <span className="text-[#6B7280]">&gt;&lt;/</span>
          <span className="text-[#F59E0B]">iframe</span>
          <span className="text-[#6B7280]">&gt;</span>
        </code>
      </pre>
    </div>
  );
}
