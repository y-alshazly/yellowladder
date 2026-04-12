import type { YellowladderDispatch } from '@yellowladder/shared-store';
import {
  selectWizardDraft,
  useAppDispatch,
  useAppSelector,
  type WizardDraftState,
} from '@yellowladder/shared-store';

/**
 * Typed accessor over the wizard-draft Redux slice. Screens use this
 * instead of wiring `useSelector` / `useDispatch` themselves so the slice
 * shape stays an implementation detail of this lib.
 */
export interface WizardDraftApi {
  state: WizardDraftState;
  dispatch: YellowladderDispatch;
}

export function useWizardDraft(): WizardDraftApi {
  const state = useAppSelector(selectWizardDraft);
  const dispatch = useAppDispatch();
  return { state, dispatch };
}
