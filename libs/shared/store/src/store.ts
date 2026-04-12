import { configureStore, type Middleware } from '@reduxjs/toolkit';
import { authReducer } from './auth/auth.slice';
import { wizardDraftReducer } from './wizard-draft/wizard-draft.slice';

export interface RootReducerShape {
  auth: ReturnType<typeof authReducer>;
  wizardDraft: ReturnType<typeof wizardDraftReducer>;
}

/**
 * Creates the Yellow Ladder mobile Redux store. The API middleware from
 * `@yellowladder/shared-api` is passed in lazily via `apiMiddleware` so this
 * lib stays decoupled from the RTK Query slices (keeps the dependency graph
 * acyclic: `shared-store` is a leaf under `shared-types`).
 *
 * Usage from the app shell:
 *
 *   import { setupStore } from '@yellowladder/shared-store';
 *   import { yellowladderApi } from '@yellowladder/shared-api';
 *
 *   const store = setupStore({
 *     apiReducer: yellowladderApi.reducer,
 *     apiReducerPath: yellowladderApi.reducerPath,
 *     apiMiddleware: yellowladderApi.middleware,
 *   });
 */
export interface SetupStoreOptions {
  apiReducerPath: string;
  apiReducer: ReturnType<typeof createSlicePlaceholder>;
  apiMiddleware: Middleware;
}

// Placeholder type helper — the API slice is injected so this file has no
// runtime dependency on `shared-api`.
type createSlicePlaceholder = (...args: unknown[]) => unknown;

export function setupStore(options: SetupStoreOptions) {
  return configureStore({
    reducer: {
      auth: authReducer,
      wizardDraft: wizardDraftReducer,
      [options.apiReducerPath]: options.apiReducer,
    },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(options.apiMiddleware),
  });
}

export type YellowladderStore = ReturnType<typeof setupStore>;
export type YellowladderRootState = ReturnType<YellowladderStore['getState']>;
export type YellowladderDispatch = YellowladderStore['dispatch'];
