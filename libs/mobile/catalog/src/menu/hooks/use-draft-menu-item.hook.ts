import { useCallback, useRef, useState } from 'react';
import type { CreateMenuItemInput } from './use-catalogue-mutations.hook';

export interface DraftMenuItemState {
  categoryId: string;
  name: string;
  price: string;
}

export interface UseDraftMenuItemResult {
  draftItem: DraftMenuItemState | null;
  setDraftItem: (next: DraftMenuItemState | null) => void;
  updateDraftName: (next: string) => void;
  updateDraftPrice: (next: string) => void;
  startCreateItem: (categoryId: string) => void;
  commitDraftItem: () => Promise<void>;
  cancelDraftItem: () => void;
}

/**
 * Draft state for the inline "add product" row. Exposes the current draft
 * and a commit function that delegates to the supplied `createMenuItemDraft`
 * only when both name and non-negative price are present. Uses a ref guard
 * so onSubmitEditing / onBlur / onEndEditing firing in the same tick don't
 * each trigger their own API call.
 */
export function useDraftMenuItem(
  createMenuItemDraft: (input: CreateMenuItemInput) => Promise<void>,
): UseDraftMenuItemResult {
  const [draftItem, setDraftItem] = useState<DraftMenuItemState | null>(null);
  const draftItemCommittedRef = useRef(false);

  const updateDraftName = useCallback((next: string) => {
    setDraftItem((current) => (current ? { ...current, name: next } : current));
  }, []);

  const updateDraftPrice = useCallback((next: string) => {
    setDraftItem((current) => (current ? { ...current, price: next } : current));
  }, []);

  const commitDraftItem = useCallback(async () => {
    if (!draftItem || draftItemCommittedRef.current) return;
    const { categoryId, name, price } = draftItem;
    const trimmedName = name.trim();
    const parsedPrice = parseFloat(price);
    // Require BOTH a non-empty name AND a valid non-negative price. If either
    // is missing, don't commit and leave the draft row visible so the user
    // can finish filling it in.
    if (!trimmedName || Number.isNaN(parsedPrice) || parsedPrice < 0) return;
    draftItemCommittedRef.current = true;
    setDraftItem(null);
    await createMenuItemDraft({
      categoryId,
      name: trimmedName,
      basePrice: parsedPrice,
    });
  }, [draftItem, createMenuItemDraft]);

  const startCreateItem = useCallback(
    (categoryId: string) => {
      // If another draft is open and complete, commit it first before switching.
      if (draftItem) {
        void commitDraftItem();
      }
      draftItemCommittedRef.current = false;
      setDraftItem({ categoryId, name: '', price: '' });
    },
    [draftItem, commitDraftItem],
  );

  const cancelDraftItem = useCallback(() => {
    draftItemCommittedRef.current = true; // suppress any late commit
    setDraftItem(null);
  }, []);

  return {
    draftItem,
    setDraftItem,
    updateDraftName,
    updateDraftPrice,
    startCreateItem,
    commitDraftItem,
    cancelDraftItem,
  };
}
