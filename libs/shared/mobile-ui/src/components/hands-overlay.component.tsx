import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * Transparent PNG sprites shipped alongside the cloud backdrops. The Splash
 * screen animates them horizontally with Reanimated; the Welcome screen
 * renders them in their final "close together" pose so the visual
 * transition from splash to welcome is continuous.
 */
const HAND_LEFT = require('../assets/hand-left.png');
const HAND_RIGHT = require('../assets/hand-right.png');

// Reanimated's `useAnimatedStyle` hook returns an opaque internal type that
// is declared incompatible with the public `StyleProp<ViewStyle>`. We use
// `StyleProp<ViewStyle>` here so the caller can pass either a plain
// ViewStyle or a Reanimated-returned shared value — Animated.Image accepts
// both at runtime.
export interface HandsOverlayProps {
  /**
   * Reanimated style applied to the left hand (`hand-left.png`). Used by the
   * Splash screen to drive the slide-in + scale-up animation. When omitted,
   * the hand renders in its static final pose.
   */
  leftHandStyle?: StyleProp<ViewStyle>;
  /**
   * Reanimated style applied to the right hand (`hand-right.png`).
   */
  rightHandStyle?: StyleProp<ViewStyle>;
  /**
   * Vertical position of the hands as a percentage of the parent container.
   * The Welcome design sits the hands around the top third while the Splash
   * design sits them slightly lower. Defaults to `0.34` which matches the
   * Welcome tablet design reference.
   */
  verticalAnchor?: number;
}

/**
 * Decorative overlay of the two Renaissance hand sprites, used by the
 * Splash and Welcome screens. The hands are pinned around the horizontal
 * centre of the viewport so the phone-watch layer of the design reads the
 * same on phone and tablet.
 *
 * The width of each sprite is a percentage of the parent container so the
 * layout never breaks on a new device class. `useDeviceClass()` is NOT used
 * directly here — the parent screen is already responsive via Safe Area +
 * ImageBackground, so the same percentages work on every breakpoint.
 */
export function HandsOverlay({
  leftHandStyle,
  rightHandStyle,
  verticalAnchor = 0.34,
}: HandsOverlayProps) {
  const topPercent = `${Math.round(verticalAnchor * 100)}%`;
  return (
    <View pointerEvents="none" style={styles.root}>
      <Animated.Image
        source={HAND_LEFT}
        resizeMode="contain"
        style={[
          styles.handBase,
          styles.handLeftBase,
          { top: topPercent as unknown as number },
          leftHandStyle,
        ]}
      />
      <Animated.Image
        source={HAND_RIGHT}
        resizeMode="contain"
        style={[
          styles.handBase,
          styles.handRightBase,
          { top: topPercent as unknown as number },
          rightHandStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject },
  handBase: {
    position: 'absolute',
    width: '52%',
    aspectRatio: 512 / 483,
  },
  handLeftBase: {
    left: -12,
  },
  handRightBase: {
    right: -12,
  },
});
