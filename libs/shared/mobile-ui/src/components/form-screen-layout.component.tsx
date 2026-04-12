import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useDeviceClass } from '../hooks/use-device-class.hook';
import { useAppTheme } from '../theme/use-app-theme.hook';
import { BrandArtworkPanel } from './brand-artwork-panel.component';
import { SafeScreen } from './safe-screen.component';

export interface FormScreenLayoutProps {
  children: ReactNode;
  title?: string;
  /**
   * Optional footer pinned to the bottom of the scroll area (used for the
   * wizard nav bar + progress dots).
   */
  footer?: ReactNode;
  /**
   * Hero copy for the tablet brand artwork panel. Wizard steps render the
   * full-bleed cloud painting on the left of the tablet layout matching the
   * Feature 01 designs. On phones the artwork is omitted.
   */
  brandHeadline?: string;
  brandTestimonial?: string;
  brandAttribution?: string;
  /**
   * When `true` the tablet layout renders the brand split with the cloud
   * artwork on the left. Defaults to `true` since every wizard step design
   * uses the split layout. Set to `false` for forms that should not be
   * framed by the artwork (e.g. authenticated profile edit screens).
   */
  showBrandArtwork?: boolean;
}

/**
 * Single-column form layout used by the wizard steps, profile edit, and
 * similar screens. On tablets the form is framed by the Yellow Ladder cloud
 * artwork on the left (matching the Feature 01 wizard designs). On phones
 * the form fills the viewport and the artwork is omitted.
 */
export function FormScreenLayout({
  children,
  title,
  footer,
  brandHeadline,
  brandTestimonial,
  brandAttribution,
  showBrandArtwork = true,
}: FormScreenLayoutProps) {
  const theme = useAppTheme();
  const { deviceClass } = useDeviceClass();
  const isTablet = deviceClass !== 'phone';

  const formInner = (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ padding: theme.spacing.lg, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {title ? (
          <Text
            variant="headlineSmall"
            style={[
              styles.title,
              { color: theme.colors.onSurface, marginBottom: theme.spacing.lg },
            ]}
          >
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );

  if (isTablet && showBrandArtwork) {
    return (
      <SafeScreen noPadding>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.tabletRow}>
            <View style={styles.tabletBrandColumn}>
              <BrandArtworkPanel
                headline={brandHeadline ?? ''}
                testimonial={brandTestimonial ?? ''}
                attribution={brandAttribution ?? ''}
              />
            </View>
            <View style={[styles.tabletFormColumn, { backgroundColor: theme.colors.surface }]}>
              <View
                style={[
                  styles.tabletFormInner,
                  { maxWidth: theme.layout.formMaxWidthTablet },
                ]}
              >
                {formInner}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeScreen>
    );
  }

  // Tablet without brand artwork OR phone: centred single column.
  return (
    <SafeScreen noPadding backgroundToken="surface">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.centered}>
          <View
            style={[
              styles.flex,
              {
                width: '100%',
                maxWidth: isTablet ? theme.layout.formMaxWidthTablet : undefined,
              },
            ]}
          >
            {formInner}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center' },
  title: { fontWeight: '700', textAlign: 'center' },
  footer: { width: '100%' },
  tabletRow: { flex: 1, flexDirection: 'row' },
  tabletBrandColumn: { flex: 1 },
  tabletFormColumn: { flex: 1, alignItems: 'center' },
  tabletFormInner: { flex: 1, width: '100%' },
});
