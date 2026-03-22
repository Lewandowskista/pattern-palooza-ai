import {
  LAST_PATTERN_STORAGE_KEY,
  type StoredPatternDraft,
} from "@shared/pattern";
import { type EditorState, editorStateSchema } from "@/lib/pattern-schema";

export function saveLastPatternDraft(draft: StoredPatternDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_PATTERN_STORAGE_KEY, JSON.stringify(draft));
}

export function loadLastPatternDraft(): StoredPatternDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(LAST_PATTERN_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredPatternDraft;
    const validated: EditorState = editorStateSchema.parse(parsed);
    const savedAt =
      typeof parsed.savedAt === "string" ? parsed.savedAt : new Date(0).toISOString();

    return {
      pattern: validated.pattern as StoredPatternDraft["pattern"],
      material: validated.material,
      savedAt,
    };
  } catch {
    window.localStorage.removeItem(LAST_PATTERN_STORAGE_KEY);
    return null;
  }
}
