import type { StoreEnhancer } from '@reduxjs/toolkit';
import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';

// Dev-only Reactotron bootstrapper. Import this from `main.tsx` before the
// app mounts so the connection is open by the time the store is created.
// The Reactotron desktop app must be listening on port 9090 (default).
// Android physical devices need `adb reverse tcp:9090 tcp:9090`.

declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

const tron = Reactotron.configure({ name: 'MobileClient' }).useReactNative().use(reactotronRedux());

if (__DEV__) {
  tron.connect();
  tron.clear?.();
  console.tron = tron;
}

export const reactotronReduxEnhancer: StoreEnhancer | undefined = __DEV__
  ? // createEnhancer is added by the reactotronRedux() plugin
    (tron as unknown as { createEnhancer: () => StoreEnhancer }).createEnhancer()
  : undefined;
