import { useWindowDimensions } from 'react-native';

export type DeviceClass = 'phone' | 'tablet' | 'large-tablet';
export type ScreenOrientation = 'portrait' | 'landscape';

export interface DeviceClassInfo {
  deviceClass: DeviceClass;
  orientation: ScreenOrientation;
  width: number;
  height: number;
}

/**
 * Reactive device class + orientation hook. Wraps `useWindowDimensions()` so
 * screens re-render on rotation / split-screen. Never call `Dimensions.get()`
 * or `Platform.isPad` — both are non-reactive or iOS-only.
 *
 * Breakpoints are driven by the SMALLEST dimension so that a phone in
 * landscape is still classified as `phone`.
 */
export function useDeviceClass(): DeviceClassInfo {
  const { width, height } = useWindowDimensions();
  const smallest = Math.min(width, height);
  let deviceClass: DeviceClass;
  if (smallest < 600) {
    deviceClass = 'phone';
  } else if (smallest < 900) {
    deviceClass = 'tablet';
  } else {
    deviceClass = 'large-tablet';
  }
  const orientation: ScreenOrientation = width > height ? 'landscape' : 'portrait';
  return { deviceClass, orientation, width, height };
}

/**
 * Convenience: boolean true when the device is a tablet or large tablet.
 */
export function useIsTabletClass(): boolean {
  const { deviceClass } = useDeviceClass();
  return deviceClass !== 'phone';
}
