import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsTabletClass } from '../hooks/use-device-class.hook';
import { useToastContext, type ToastVariant } from '../providers/toast.context';
import { useAppTheme } from '../theme/use-app-theme.hook';

const DEFAULT_DURATION = 4000;
const TABLET_MAX_WIDTH = 480;

interface VariantVisuals {
  icon: string;
  color: string;
}

function getVariantVisuals(variant: ToastVariant, secondary: string): VariantVisuals {
  switch (variant) {
    case 'error':
      return { icon: 'close', color: '#C93636' };
    case 'success':
      return { icon: 'check', color: '#2E8A3F' };
    case 'warning':
      return { icon: 'exclamation-thick', color: '#C48416' };
    case 'info':
    default:
      return { icon: 'web', color: secondary };
  }
}

/**
 * Mount once at the app root. Renders a floating card-style toast controlled
 * by the ToastProvider context. Supports four variants (success, error,
 * warning, info) with a coloured icon badge, title, and optional description.
 */
export function SnackbarHost() {
  const { toast, hideToast } = useToastContext();
  const theme = useAppTheme();
  const isTablet = useIsTabletClass();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast.visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 180, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const duration = toast.duration ?? DEFAULT_DURATION;
    const timeout = setTimeout(hideToast, duration);
    return () => clearTimeout(timeout);
  }, [
    toast.visible,
    toast.message,
    toast.description,
    toast.duration,
    hideToast,
    translateY,
    opacity,
  ]);

  const visuals = getVariantVisuals(toast.variant, theme.colors.secondary);

  return (
    <Animated.View
      pointerEvents={toast.visible ? 'box-none' : 'none'}
      style={[
        styles.container,
        {
          top: insets.top + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onPress={hideToast}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.shadow,
            maxWidth: isTablet ? TABLET_MAX_WIDTH : undefined,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: visuals.color }]}>
          <Icon source={visuals.icon} size={22} color={theme.colors.surface} />
        </View>
        <View style={styles.textWrap}>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.onSurface, fontWeight: '700' }}
            numberOfLines={2}
          >
            {toast.message}
          </Text>
          {toast.description ? (
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={3}
            >
              {toast.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 12,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
});
