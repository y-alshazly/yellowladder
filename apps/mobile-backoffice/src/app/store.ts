import { yellowladderApi } from '@yellowladder/shared-api';
import { setupStore } from '@yellowladder/shared-store';

/**
 * Mobile Redux store. Composes the `shared-store` slices with the
 * RTK Query API slice injected from `shared-api`. The single store
 * instance is exported so App.tsx can wrap `<Provider>` around the tree.
 */
export const store = setupStore({
  apiReducerPath: yellowladderApi.reducerPath,
  apiReducer: yellowladderApi.reducer,
  apiMiddleware: yellowladderApi.middleware,
});

export type AppStore = typeof store;
