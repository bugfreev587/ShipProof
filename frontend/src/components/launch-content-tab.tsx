"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  generateLaunchContent,
  getDraft,
  saveDraft,
  deleteDraft,
  confirmVersion,
  listVersions,
  getVersion,
  regenerateField,
  type LaunchDraft,
  type LaunchVersion,
  type Product,
  ApiError,
} from "@/lib/api";

const PLATFORMS = [
  { key: "product_hunt", label: "Product Hunt" },
  { key: "reddit", label: "Reddit" },
  { key: "hackernews", label: "Hacker News" },
  { key: "twitter", label: "Twitter/X" },
  { key: "indiehackers", label: "IndieHackers" },
];

const SUBREDDITS = ["r/SaaS", "r/startups", "r/sideproject", "r/webdev"];

interface Props {
  product: Product;
}

export default function LaunchContentTab({ product }: Props) {
  const { getToken } = useAuth();
  const [draft, setDraft] = useState<LaunchDraft | null>(null);
  const [versions, setVersions] = useState<LaunchVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [expandedVersionData, setExpandedVersionData] =
    useState<LaunchVersion | null>(null);

  // Generate form state
  const [launchType, setLaunchType] = useState("initial");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([
    "r/SaaS",
  ]);
  const [customSubreddit, setCustomSubreddit] = useState("");
  const [launchNotes, setLaunchNotes] = useState("");

  // Draft editing
  const [activePlatform, setActivePlatform] = useState("");
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>(
    {},
  );

  // Confirm modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [versionTitle, setVersionTitle] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [draftRes, versionsRes] = await Promise.all([
        getDraft(product.id, token),
        listVersions(product.id, token),
      ]);

      setDraft(draftRes.draft);
      if (draftRes.draft) {
        setEditedContent(
          draftRes.draft.content as Record<string, unknown>,
        );
        const platforms = draftRes.draft.platforms || [];
        setActivePlatform(platforms[0] || "");
        if (draftRes.draft.launch_notes?.Valid) {
          setLaunchNotes(draftRes.draft.launch_notes.String);
        }
      }
      setVersions(versionsRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, product.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const token = await getToken();
      if (!token) return;

      const allSubreddits = [...selectedSubreddits];
      if (
        customSubreddit &&
        !allSubreddits.includes(customSubreddit)
      ) {
        allSubreddits.push(
          customSubreddit.startsWith("r/")
            ? customSubreddit
            : `r/${customSubreddit}`,
        );
      }

      const result = await generateLaunchContent(
        product.id,
        {
          launch_type: launchType,
          platforms: selectedPlatforms,
          reddit_subreddits: selectedPlatforms.includes("reddit")
            ? allSubreddits
            : undefined,
          launch_notes: launchNotes || undefined,
        },
        token,
      );
      setDraft(result);
      setEditedContent(result.content as Record<string, unknown>);
      setActivePlatform(selectedPlatforms[0]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError(err.message);
      } else {
        setError("Failed to generate content. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await saveDraft(product.id, editedContent, token);
      setDraft(updated);
      setEditedContent(updated.content as Record<string, unknown>);
    } catch {
      setError("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!versionTitle.trim()) return;
    try {
      const token = await getToken();
      if (!token) return;
      await confirmVersion(product.id, versionTitle.trim(), token);
      setDraft(null);
      setEditedContent({});
      setShowConfirmModal(false);
      setVersionTitle("");
      fetchData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setError(err.message);
      } else {
        setError("Failed to confirm version");
      }
    }
  };

  const handleCancelDraft = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await deleteDraft(product.id, token);
      setDraft(null);
      setEditedContent({});
    } catch {
      setError("Failed to cancel draft");
    }
  };

  const handleExpandVersion = async (vId: string) => {
    if (expandedVersion === vId) {
      setExpandedVersion(null);
      setExpandedVersionData(null);
      return;
    }
    try {
      const token = await getToken();
      if (!token) return;
      const v = await getVersion(product.id, vId, token);
      setExpandedVersion(vId);
      setExpandedVersionData(v);
    } catch {
      // ignore
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  if (loading) return <div className="text-[#9CA3AF]">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Draft Area */}
      {!draft ? (
        <GenerateForm
          launchType={launchType}
          setLaunchType={setLaunchType}
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
          selectedSubreddits={selectedSubreddits}
          setSelectedSubreddits={setSelectedSubreddits}
          customSubreddit={customSubreddit}
          setCustomSubreddit={setCustomSubreddit}
          launchNotes={launchNotes}
          setLaunchNotes={setLaunchNotes}
          generating={generating}
          onGenerate={handleGenerate}
          error={error}
        />
      ) : (
        <DraftEditor
          draft={draft}
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          activePlatform={activePlatform}
          setActivePlatform={setActivePlatform}
          onSave={handleSaveDraft}
          onConfirm={() => setShowConfirmModal(true)}
          onRegenerate={handleGenerate}
          onCancelDraft={handleCancelDraft}
          saving={saving}
          generating={generating}
          copyToClipboard={copyToClipboard}
          error={error}
          setSelectedPlatforms={setSelectedPlatforms}
          setLaunchType={setLaunchType}
        />
      )}

      {/* Version History */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#F1F1F3]">
          Version History
        </h3>
        {versions.length === 0 ? (
          <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8 text-center text-[#9CA3AF]">
            No versions yet. Generate and confirm your first launch content.
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.id}>
                <button
                  onClick={() => handleExpandVersion(v.id)}
                  className="w-full rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-4 text-left hover:border-[#3F3F46] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="mr-2 font-mono text-sm text-[#6366F1]">
                        {v.version_label}
                      </span>
                      <span className="font-medium text-[#F1F1F3]">
                        {v.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                      <span className="rounded bg-[#242429] px-2 py-0.5 text-xs">
                        {v.launch_type.replace("_", " ")}
                      </span>
                      <span>
                        {new Date(v.created_at).toLocaleDateString()}
                      </span>
                      <span>{expandedVersion === v.id ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>
                {expandedVersion === v.id && expandedVersionData && (
                  <div className="mt-2 rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-4">
                    {expandedVersionData.launch_notes?.Valid && (
                      <div className="mb-4 rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-3">
                        <span className="text-xs font-medium text-[#9CA3AF]">Launch Notes</span>
                        <p className="mt-1 text-sm text-[#F1F1F3] whitespace-pre-wrap">
                          {expandedVersionData.launch_notes.String}
                        </p>
                      </div>
                    )}
                    <ContentViewer
                      content={
                        expandedVersionData.content as Record<string, unknown>
                      }
                      platforms={expandedVersionData.platforms}
                      copyToClipboard={copyToClipboard}
                      readOnly
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#F1F1F3]">
              Confirm & Save Version
            </h3>
            <p className="mb-4 text-sm text-[#9CA3AF]">
              This will save the current draft as an immutable version.
            </p>
            <input
              type="text"
              value={versionTitle}
              onChange={(e) => setVersionTitle(e.target.value)}
              placeholder="Version title (e.g. Product Hunt Launch)"
              className="mb-4 w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!versionTitle.trim()}
                className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function GenerateForm({
  launchType,
  setLaunchType,
  selectedPlatforms,
  setSelectedPlatforms,
  selectedSubreddits,
  setSelectedSubreddits,
  customSubreddit,
  setCustomSubreddit,
  launchNotes,
  setLaunchNotes,
  generating,
  onGenerate,
  error,
}: {
  launchType: string;
  setLaunchType: (v: string) => void;
  selectedPlatforms: string[];
  setSelectedPlatforms: (v: string[]) => void;
  selectedSubreddits: string[];
  setSelectedSubreddits: (v: string[]) => void;
  customSubreddit: string;
  setCustomSubreddit: (v: string) => void;
  launchNotes: string;
  setLaunchNotes: (v: string) => void;
  generating: boolean;
  onGenerate: () => void;
  error: string;
}) {
  const togglePlatform = (key: string) => {
    setSelectedPlatforms(
      selectedPlatforms.includes(key)
        ? selectedPlatforms.filter((p) => p !== key)
        : [...selectedPlatforms, key],
    );
  };

  const toggleSubreddit = (sr: string) => {
    setSelectedSubreddits(
      selectedSubreddits.includes(sr)
        ? selectedSubreddits.filter((s) => s !== sr)
        : [...selectedSubreddits, sr],
    );
  };

  return (
    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
      <h3 className="mb-4 text-lg font-semibold text-[#F1F1F3]">
        Generate Launch Content
      </h3>

      {/* Launch Type */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-[#9CA3AF]">
          Launch Type
        </label>
        <div className="flex gap-3">
          {[
            { key: "initial", label: "Initial Launch" },
            { key: "feature_update", label: "Feature Update" },
            { key: "major_update", label: "Major Update" },
          ].map((lt) => (
            <button
              key={lt.key}
              onClick={() => setLaunchType(lt.key)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                launchType === lt.key
                  ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]"
                  : "border-[#2A2A30] text-[#9CA3AF] hover:border-[#3F3F46]"
              }`}
            >
              {lt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-[#9CA3AF]">
          Target Platforms
        </label>
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => togglePlatform(p.key)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                selectedPlatforms.includes(p.key)
                  ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]"
                  : "border-[#2A2A30] text-[#9CA3AF] hover:border-[#3F3F46]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reddit subreddits */}
      {selectedPlatforms.includes("reddit") && (
        <div className="mb-4 ml-4 rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-4">
          <label className="mb-2 block text-sm font-medium text-[#9CA3AF]">
            Subreddits
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {SUBREDDITS.map((sr) => (
              <button
                key={sr}
                onClick={() => toggleSubreddit(sr)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  selectedSubreddits.includes(sr)
                    ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]"
                    : "border-[#2A2A30] text-[#9CA3AF] hover:border-[#3F3F46]"
                }`}
              >
                {sr}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customSubreddit}
            onChange={(e) => setCustomSubreddit(e.target.value)}
            placeholder="Custom subreddit (e.g. r/react)"
            className="w-full rounded-md border border-[#2A2A30] bg-[#0F0F10] px-2 py-1 text-xs text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
          />
        </div>
      )}

      {/* Launch Notes */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-[#9CA3AF]">
          Launch Notes
        </label>
        <textarea
          value={launchNotes}
          onChange={(e) => setLaunchNotes(e.target.value)}
          rows={4}
          placeholder="Key talking points, unique angles, specific features to highlight, tone preferences, or any context the AI should use when generating content..."
          className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none resize-none"
        />
        <p className="mt-1 text-xs text-[#6B7280]">
          These notes will be used as the primary context for AI-generated content across all platforms.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-[#EF4444]">{error}</p>}

      <button
        onClick={onGenerate}
        disabled={generating || selectedPlatforms.length === 0}
        className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
      >
        {generating ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Generating...
          </span>
        ) : (
          "Generate Launch Content"
        )}
      </button>
    </div>
  );
}

function DraftEditor({
  draft,
  editedContent,
  setEditedContent,
  activePlatform,
  setActivePlatform,
  onSave,
  onConfirm,
  onRegenerate,
  onCancelDraft,
  saving,
  generating,
  copyToClipboard,
  error,
  setSelectedPlatforms,
  setLaunchType,
}: {
  draft: LaunchDraft;
  editedContent: Record<string, unknown>;
  setEditedContent: (v: Record<string, unknown>) => void;
  activePlatform: string;
  setActivePlatform: (v: string) => void;
  onSave: () => void;
  onConfirm: () => void;
  onRegenerate: () => void;
  onCancelDraft: () => void;
  saving: boolean;
  generating: boolean;
  copyToClipboard: (text: string) => void;
  error: string;
  setSelectedPlatforms: (v: string[]) => void;
  setLaunchType: (v: string) => void;
}) {
  const platforms = draft.platforms || [];

  // Sync generate form state so Regenerate works
  useEffect(() => {
    setSelectedPlatforms(platforms);
    setLaunchType(draft.launch_type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#F1F1F3]">
          Draft{" "}
          <span className="text-sm font-normal text-[#9CA3AF]">
            ({draft.launch_type.replace("_", " ")})
          </span>
        </h3>
      </div>

      {/* Platform tabs */}
      <div className="mb-4 flex gap-1 border-b border-[#2A2A30]">
        {platforms.map((p) => {
          const label =
            PLATFORMS.find((pl) => pl.key === p)?.label || p;
          return (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activePlatform === p
                  ? "border-b-2 border-[#6366F1] text-[#F1F1F3]"
                  : "text-[#9CA3AF] hover:text-[#F1F1F3]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content editor */}
      <ContentEditor
        platform={activePlatform}
        content={editedContent}
        onChange={setEditedContent}
        copyToClipboard={copyToClipboard}
        productId={draft.product_id}
      />

      {error && <p className="mt-4 text-sm text-[#EF4444]">{error}</p>}

      {/* Action bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#2A2A30] pt-4">
        <button
          onClick={onRegenerate}
          disabled={generating}
          className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#2A2A30] hover:text-[#F1F1F3] disabled:opacity-50 transition-colors"
        >
          {generating ? "Regenerating..." : "Regenerate All"}
        </button>
        <button
          onClick={() => setEditedContent({})}
          className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#9CA3AF] hover:bg-[#2A2A30] hover:text-[#F1F1F3] transition-colors"
        >
          Discard All
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={onCancelDraft}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Cancel Draft
        </button>
        <button
          onClick={onConfirm}
          className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
        >
          Confirm & Save Version
        </button>
      </div>
    </div>
  );
}

function ContentEditor({
  platform,
  content,
  onChange,
  copyToClipboard,
  productId,
}: {
  platform: string;
  content: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  copyToClipboard: (text: string) => void;
  productId: string;
}) {
  const { getToken } = useAuth();
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const platformContent = content[platform] as Record<string, unknown> | unknown[] | undefined;

  const updateField = (field: string, value: string) => {
    const current = (content[platform] || {}) as Record<string, unknown>;
    onChange({ ...content, [platform]: { ...current, [field]: value } });
  };

  const handleRegenerate = async (
    field: string,
    onResult: (text: string) => void,
    opts?: { index?: number; subreddit?: string },
  ) => {
    const key = `${platform}-${field}-${opts?.index ?? ""}`;
    setRegeneratingKey(key);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await regenerateField(
        productId,
        { platform, field, index: opts?.index ?? -1, subreddit: opts?.subreddit },
        token,
      );
      onResult(res.text);
    } catch {
      // ignore
    } finally {
      setRegeneratingKey(null);
    }
  };

  const regenButton = (
    field: string,
    onResult: (text: string) => void,
    opts?: { index?: number; subreddit?: string },
  ) => {
    const key = `${platform}-${field}-${opts?.index ?? ""}`;
    const isRegenerating = regeneratingKey === key;
    return (
      <button
        onClick={() => handleRegenerate(field, onResult, opts)}
        disabled={regeneratingKey !== null}
        className="shrink-0 rounded px-2 py-1 text-xs text-[#6366F1] hover:bg-[#6366F1]/10 disabled:opacity-50 transition-colors"
      >
        {isRegenerating ? "Regenerating..." : "Regenerate"}
      </button>
    );
  };

  const discardField = (field: string) => {
    const current = (content[platform] || {}) as Record<string, unknown>;
    onChange({ ...content, [platform]: { ...current, [field]: "" } });
  };

  const discardButton = (field: string) => (
    <button
      onClick={() => discardField(field)}
      className="shrink-0 rounded px-2 py-1 text-xs text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
    >
      Discard
    </button>
  );

  if (!platformContent) {
    return (
      <div className="text-sm text-[#9CA3AF]">
        No content generated for this platform.
      </div>
    );
  }

  if (platform === "product_hunt") {
    const ph = platformContent as Record<string, string>;
    return (
      <div className="space-y-4">
        <Field label="Title" value={ph.title || ""} onChange={(v) => updateField("title", v)} onCopy={copyToClipboard}
          extraAction={discardButton("title")}
        />
        <Field label="Subtitle" value={ph.subtitle || ""} onChange={(v) => updateField("subtitle", v)} onCopy={copyToClipboard}
          extraAction={discardButton("subtitle")}
        />
        <Field label="Description" value={ph.description || ""} onChange={(v) => updateField("description", v)} onCopy={copyToClipboard} multiline rows={14} />
        <div className="flex justify-end gap-1">
          {regenButton("description", (t) => updateField("description", t))}
          {discardButton("description")}
        </div>
        <Field label="Maker Comment" value={ph.maker_comment || ""} onChange={(v) => updateField("maker_comment", v)} onCopy={copyToClipboard} multiline rows={10} />
        <div className="flex justify-end gap-1">
          {regenButton("maker_comment", (t) => updateField("maker_comment", t))}
          {discardButton("maker_comment")}
        </div>
      </div>
    );
  }

  if (platform === "reddit") {
    const posts = platformContent as Array<{
      subreddit: string;
      title: string;
      body: string;
    }>;
    if (posts.length === 0) {
      return (
        <div className="text-sm text-[#9CA3AF]">
          All Reddit posts have been discarded. Use &quot;Regenerate&quot; to generate new content.
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {posts.map((post, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-4"
          >
            <div className="mb-2">
              <span className="text-sm font-medium text-[#6366F1]">
                {post.subreddit}
              </span>
            </div>
            <Field
              label="Title"
              value={post.title}
              onChange={(v) => {
                const updated = [...posts];
                updated[i] = { ...updated[i], title: v };
                onChange({ ...content, reddit: updated });
              }}
              onCopy={copyToClipboard}
            />
            <div className="mt-3">
              <Field
                label="Body"
                value={post.body}
                onChange={(v) => {
                  const updated = [...posts];
                  updated[i] = { ...updated[i], body: v };
                  onChange({ ...content, reddit: updated });
                }}
                onCopy={copyToClipboard}
                multiline
                rows={12}
              />
            </div>
            <div className="mt-2 flex justify-end gap-1">
              {regenButton("body", (t) => {
                const updated = [...posts];
                updated[i] = { ...updated[i], body: t };
                onChange({ ...content, reddit: updated });
              }, { index: i, subreddit: post.subreddit })}
              <button
                onClick={() => {
                  const updated = posts.filter((_, idx) => idx !== i);
                  if (updated.length === 0) {
                    const newContent = { ...content };
                    delete newContent.reddit;
                    onChange(newContent);
                  } else {
                    onChange({ ...content, reddit: updated });
                  }
                }}
                className="shrink-0 rounded px-2 py-1 text-xs text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (platform === "hackernews") {
    const hn = platformContent as Record<string, string>;
    return (
      <div className="space-y-4">
        <Field label="Title" value={hn.title || ""} onChange={(v) => updateField("title", v)} onCopy={copyToClipboard}
          extraAction={discardButton("title")}
        />
        <Field label="First Comment" value={hn.first_comment || ""} onChange={(v) => updateField("first_comment", v)} onCopy={copyToClipboard} multiline rows={12} />
        <div className="flex justify-end gap-1">
          {regenButton("first_comment", (t) => updateField("first_comment", t))}
          {discardButton("first_comment")}
        </div>
      </div>
    );
  }

  if (platform === "twitter") {
    const tw = platformContent as { thread: string[] };
    const thread = tw.thread || [];
    if (thread.length === 0) {
      return (
        <div className="text-sm text-[#9CA3AF]">
          All tweets have been discarded. Use &quot;Regenerate&quot; to generate new content.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {thread.map((tweet, i) => (
          <div key={i} className="relative">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">
                Tweet {i + 1}
              </span>
              <div className="flex items-center gap-2">
                {regenButton("thread", (t) => {
                  const updated = [...thread];
                  updated[i] = t;
                  onChange({ ...content, twitter: { thread: updated } });
                }, { index: i })}
                <button
                  onClick={() => {
                    const updated = thread.filter((_, idx) => idx !== i);
                    if (updated.length === 0) {
                      const newContent = { ...content };
                      delete newContent.twitter;
                      onChange(newContent);
                    } else {
                      onChange({ ...content, twitter: { thread: updated } });
                    }
                  }}
                  className="shrink-0 rounded px-2 py-1 text-xs text-[#9CA3AF] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  Discard
                </button>
                <span
                  className={`text-xs ${tweet.length > 280 ? "text-[#EF4444]" : "text-[#9CA3AF]"}`}
                >
                  {tweet.length}/280
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <textarea
                value={tweet}
                onChange={(e) => {
                  const updated = [...thread];
                  updated[i] = e.target.value;
                  onChange({
                    ...content,
                    twitter: { thread: updated },
                  });
                }}
                rows={3}
                className="flex-1 rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none resize-none"
              />
              <CopyButton text={tweet} onCopy={copyToClipboard} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (platform === "indiehackers") {
    const ih = platformContent as Record<string, string>;
    return (
      <div className="space-y-4">
        <Field label="Title" value={ih.title || ""} onChange={(v) => updateField("title", v)} onCopy={copyToClipboard}
          extraAction={discardButton("title")}
        />
        <Field label="Body" value={ih.body || ""} onChange={(v) => updateField("body", v)} onCopy={copyToClipboard} multiline rows={14} />
        <div className="flex justify-end gap-1">
          {regenButton("body", (t) => updateField("body", t))}
          {discardButton("body")}
        </div>
      </div>
    );
  }

  return <div className="text-sm text-[#9CA3AF]">Unknown platform</div>;
}

function ContentViewer({
  content,
  platforms,
  copyToClipboard,
  readOnly,
}: {
  content: Record<string, unknown>;
  platforms: string[];
  copyToClipboard: (text: string) => void;
  readOnly?: boolean;
}) {
  const [active, setActive] = useState(platforms[0] || "");

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-[#2A2A30]">
        {platforms.map((p) => {
          const label = PLATFORMS.find((pl) => pl.key === p)?.label || p;
          return (
            <button
              key={p}
              onClick={() => setActive(p)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                active === p
                  ? "border-b-2 border-[#6366F1] text-[#F1F1F3]"
                  : "text-[#9CA3AF] hover:text-[#F1F1F3]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <ReadOnlyContent
        platform={active}
        content={content}
        copyToClipboard={copyToClipboard}
      />
      {readOnly && null}
    </div>
  );
}

function ReadOnlyContent({
  platform,
  content,
  copyToClipboard,
}: {
  platform: string;
  content: Record<string, unknown>;
  copyToClipboard: (text: string) => void;
}) {
  const platformContent = content[platform];
  if (!platformContent) return null;

  if (platform === "product_hunt") {
    const ph = platformContent as Record<string, string>;
    return (
      <div className="space-y-3">
        <ReadOnlyField label="Title" value={ph.title} onCopy={copyToClipboard} />
        <ReadOnlyField label="Subtitle" value={ph.subtitle} onCopy={copyToClipboard} />
        <ReadOnlyField label="Description" value={ph.description} onCopy={copyToClipboard} />
        <ReadOnlyField label="Maker Comment" value={ph.maker_comment} onCopy={copyToClipboard} />
      </div>
    );
  }

  if (platform === "reddit") {
    const posts = platformContent as Array<{ subreddit: string; title: string; body: string }>;
    return (
      <div className="space-y-4">
        {posts.map((post, i) => (
          <div key={i} className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-3">
            <div className="mb-2 text-sm font-medium text-[#6366F1]">{post.subreddit}</div>
            <ReadOnlyField label="Title" value={post.title} onCopy={copyToClipboard} />
            <div className="mt-2"><ReadOnlyField label="Body" value={post.body} onCopy={copyToClipboard} /></div>
          </div>
        ))}
      </div>
    );
  }

  if (platform === "hackernews") {
    const hn = platformContent as Record<string, string>;
    return (
      <div className="space-y-3">
        <ReadOnlyField label="Title" value={hn.title} onCopy={copyToClipboard} />
        <ReadOnlyField label="First Comment" value={hn.first_comment} onCopy={copyToClipboard} />
      </div>
    );
  }

  if (platform === "twitter") {
    const tw = platformContent as { thread: string[] };
    return (
      <div className="space-y-2">
        {(tw.thread || []).map((tweet, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-2 text-sm text-[#F1F1F3] whitespace-pre-wrap">
              <span className="text-xs text-[#9CA3AF]">#{i + 1} </span>
              {tweet}
            </div>
            <CopyButton text={tweet} onCopy={copyToClipboard} />
          </div>
        ))}
      </div>
    );
  }

  if (platform === "indiehackers") {
    const ih = platformContent as Record<string, string>;
    return (
      <div className="space-y-3">
        <ReadOnlyField label="Title" value={ih.title} onCopy={copyToClipboard} />
        <ReadOnlyField label="Body" value={ih.body} onCopy={copyToClipboard} />
      </div>
    );
  }

  return null;
}

function Field({
  label,
  value,
  onChange,
  onCopy,
  multiline,
  rows = 5,
  extraAction,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCopy: (text: string) => void;
  multiline?: boolean;
  rows?: number;
  extraAction?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-[#9CA3AF]">{label}</label>
        <div className="flex items-center gap-1">
          {extraAction}
          <CopyButton text={value} onCopy={onCopy} />
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
        />
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (text: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-[#9CA3AF]">{label}</span>
        <CopyButton text={value} onCopy={onCopy} />
      </div>
      <div className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] whitespace-pre-wrap">
        {value}
      </div>
    </div>
  );
}

function CopyButton({
  text,
  onCopy,
}: {
  text: string;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded px-2 py-1 text-xs text-[#9CA3AF] hover:bg-[#2A2A30] hover:text-[#F1F1F3] transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
