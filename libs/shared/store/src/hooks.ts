import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { YellowladderDispatch, YellowladderRootState } from './store';

/**
 * Typed Redux hooks used by every feature lib. Always import these instead
 * of the bare `useDispatch` / `useSelector`.
 */
export const useAppDispatch: () => YellowladderDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<YellowladderRootState> = useSelector;
