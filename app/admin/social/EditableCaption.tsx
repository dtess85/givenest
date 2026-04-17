"use client";

import { useRef, useState, useTransition } from "react";
import CopyButton from "./CopyButton";
import { updateCaptionAction } from "./actions";

/**
 * Inline-editable caption block for a social-post draft.
 *
 * View mode:  renders the caption as pre-wrapped text + Edit / Copy buttons.
 * Edit mode:  swaps the pre into a <textarea>, offers Save / Cancel.
 *
 * Save calls `updateCaptionAction` (server action, admin-guarded) and
 * reconciles local state from the returned value. `revalidatePath` on the
 * server ensures other tabs/visitors pick it up on next load.
 *
 * Nothing here is specific to format — same component works for CAROUSEL,
 * STORY, and REEL rows.
 */
export default function EditableCaption({
  id,
  initialCaption,
}: {
  id: string;
  initialCaption: string;
}) {
  // `caption` is the source of truth after any successful save.
  const [caption, setCaption] = useState(initialCaption);
  // `draft` is the in-flight textarea value while editing.
  const [draft, setDraft] = useState(initialCaption);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function beginEdit() {
    setDraft(caption);
    setError(null);
    setEditing(true);
    // Focus after the textarea mounts.
    queueMicrotask(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    });
  }

  function cancel() {
    setDraft(caption);
    setError(null);
    setEditing(false);
  }

  function save() {
    if (pending) return;
    setError(null);
    const next = draft.trim();
    if (next === caption.trim()) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateCaptionAction(id, next);
      if (res.ok && res.caption != null) {
        setCaption(res.caption);
        setDraft(res.caption);
        setEditing(false);
      } else {
        setError(res.error ?? "Failed to save.");
      }
    });
  }

  const charCount = (editing ? draft : caption).length;
  const overLimit = charCount > 2200;

  return (
    <div className="mb-3">
      {editing ? (
        <>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Cmd/Ctrl+Enter saves; Esc cancels.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            rows={10}
            disabled={pending}
            className="w-full rounded-[6px] border border-coral bg-white p-3 font-sans text-[12px] leading-relaxed text-[#333] outline-none focus:border-coral focus:ring-1 focus:ring-coral disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className={overLimit ? "text-[#A31F1F] font-medium" : ""}>
                {charCount.toLocaleString()} / 2,200
              </span>
              <span className="hidden sm:inline">⌘↵ save · esc cancel</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={pending}
                className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] hover:border-[#999] transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={pending || overLimit || !draft.trim()}
                className="rounded-[6px] bg-coral px-3 py-1 text-[12px] font-medium text-white hover:bg-[#d4574a] transition-colors disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 rounded-[6px] border border-[#F5C2C2] bg-[#FDE2E2] p-2 text-[11px] text-[#A31F1F]">
              {error}
            </div>
          )}
        </>
      ) : (
        <>
          <pre className="max-h-[180px] overflow-auto whitespace-pre-wrap rounded-[6px] border border-border bg-[#FAF9F6] p-3 font-sans text-[12px] leading-relaxed text-[#333]">
            {caption}
          </pre>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted">
              {charCount.toLocaleString()} chars
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={beginEdit}
                className="rounded-[6px] border border-border bg-white px-3 py-1 text-[12px] hover:border-coral hover:text-coral transition-colors"
              >
                Edit
              </button>
              <CopyButton text={caption} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
