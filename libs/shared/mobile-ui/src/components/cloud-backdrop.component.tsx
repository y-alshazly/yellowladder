import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { useDeviceClass } from '../hooks/use-device-class.hook';

/**
 * Which cloud artwork to render as the full-bleed background. The three
 * variants match the three asset groups from Feature 01 designs:
 *
 * - `hero` → the vivid Renaissance cloud painting used by the Splash and
 *   Welcome screens. Automatically picks `cloud-tablet.jpg` on tablets and
 *   `cloud-mobile.jpg` on phones so the background aspect ratio matches the
 *   device orientation.
 * - `watermark` → the white watermark backdrop used by the Login, Forgot
 *   Password, Reset Password and OTP Verify screens. Automatically picks
 *   `cloud-watermark-mobile.png` on phones and `cloud-watermark-tablet.png`
 *   on tablets so the background fits the device aspect ratio.
 * - `wizard-side` → the narrow vertical cloud painting used by the Sign Up
 *   form and every wizard step. This is rendered by `BrandArtworkPanel` as
 *   the left-hand split column on tablets. Phones do not render this variant
 *   directly — they use a solid surface.
 */
export type CloudBackdropVariant = 'hero' | 'watermark' | 'wizard-side';

export interface CloudBackdropProps {
  /**
   * Children rendered over the backdrop. The caller is responsible for
   * positioning them — the backdrop fills the entire parent layout.
   */
  children?: ReactNode;
  /**
   * Selects which bundled cloud asset to render. Defaults to `hero` to keep
   * backwards-compatibility with the Splash and Welcome screens.
   */
  variant?: CloudBackdropVariant;
  /**
   * Optional opacity override for the backing image. Defaults are variant
   * aware: `hero` = 1, `watermark` = 1 (the PNG already has alpha baked in),
   * `wizard-side` = 1. Pass a value between `0` and `1` to dim further.
   */
  opacity?: number;
}

// Asset sources are required at module scope so Metro picks up every
// reference during bundling. `require` calls inside a component body still
// work, but keeping them here makes the backing assets explicit.
const ASSET_HERO_TABLET = require('../assets/cloud-tablet.jpg');
const ASSET_HERO_MOBILE = require('../assets/cloud-mobile.jpg');
const ASSET_WATERMARK_TABLET = require('../assets/cloud-watermark-tablet.png');
const ASSET_WATERMARK_MOBILE = require('../assets/cloud-watermark-mobile.png');
const ASSET_WIZARD_SIDE = require('../assets/cloud-wizard-side.jpg');

/**
 * Full-bleed cloud-painting backdrop. Feature libs MUST use this component
 * instead of requiring the assets directly — the bundled PNGs/JPEGs live
 * under `libs/shared/mobile-ui/src/assets/` and cannot be reached through a
 * path alias from `libs/mobile/*`.
 */
export function CloudBackdrop({ children, variant = 'hero', opacity = 1 }: CloudBackdropProps) {
  const { deviceClass } = useDeviceClass();
  const isPhone = deviceClass === 'phone';
  let source;
  if (variant === 'hero') {
    source = isPhone ? ASSET_HERO_MOBILE : ASSET_HERO_TABLET;
  } else if (variant === 'watermark') {
    source = isPhone ? ASSET_WATERMARK_MOBILE : ASSET_WATERMARK_TABLET;
  } else {
    source = ASSET_WIZARD_SIDE;
  }
  return (
    <ImageBackground
      source={source}
      resizeMode="cover"
      style={styles.root}
      imageStyle={{ opacity }}
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
