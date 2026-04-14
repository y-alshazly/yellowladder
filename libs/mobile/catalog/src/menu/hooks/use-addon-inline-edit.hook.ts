import { useCallback, useRef, useState } from 'react';

export interface AddonEditState {
  id: 'new' | string;
  name: string;
  original: string;
}

export interface UseAddonInlineEditOptions {
  menuItemId: string;
  onCreateAddon: (menuItemId: string, name: string) => Promise<void> | void;
  onUpdateAddonName: (addonId: string, name: string) => Promise<void> | void;
}

export interface UseAddonInlineEditResult {
  addonEdit: AddonEditState | null;
  setAddonName: (text: string) => void;
  commitAddonEdit: () => Promise<void>;
  startAddonEdit: (next: AddonEditState) => void;
}

/**
 * Addon inline-edit state for tablet chips + phone pill buttons. Tracks the
 * currently-editing addon (or `'new'` for create), exposes a commit fn, and
 * dedupes simultaneous blur/endEditing/submitEditing calls via a signature
 * ref — those events can all fire in the same React tick on Return and would
 * otherwise each trigger a separate API call.
 */
export function useAddonInlineEdit({
  menuItemId,
  onCreateAddon,
  onUpdateAddonName,
}: UseAddonInlineEditOptions): UseAddonInlineEditResult {
  const [addonEdit, setAddonEdit] = useState<AddonEditState | null>(null);
  const lastCommittedSigRef = useRef<string | null>(null);

  const setAddonName = useCallback((text: string) => {
    setAddonEdit((current) => (current ? { ...current, name: text } : current));
  }, []);

  const commitAddonEdit = useCallback(async () => {
    if (!addonEdit) return;
    const current = addonEdit;
    const sig = `${current.id}:${current.original}:${current.name}`;
    if (lastCommittedSigRef.current === sig) return;
    lastCommittedSigRef.current = sig;
    setAddonEdit(null);
    const trimmed = current.name.trim();
    if (!trimmed) return;
    if (current.id === 'new') {
      await onCreateAddon(menuItemId, trimmed);
    } else if (trimmed !== current.original) {
      await onUpdateAddonName(current.id, trimmed);
    }
  }, [addonEdit, menuItemId, onCreateAddon, onUpdateAddonName]);

  const startAddonEdit = useCallback(
    (next: AddonEditState) => {
      // Commit any in-flight edit before switching targets. commitAddonEdit
      // captures the previous addonEdit via closure, so the old draft is
      // persisted before we overwrite it with the new one.
      if (addonEdit) {
        void commitAddonEdit();
      }
      lastCommittedSigRef.current = null;
      setAddonEdit(next);
    },
    [addonEdit, commitAddonEdit],
  );

  return { addonEdit, setAddonName, commitAddonEdit, startAddonEdit };
}
