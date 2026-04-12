import { ImageBackground, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../theme/use-app-theme.hook';

/**
 * Design-mandated hardcoded colours for the brand artwork panel.
 *
 * The cloud painting renders as a full-bleed background behind every element
 * on this panel. The painting is a medium-dark photographic image, so the
 * wordmark, headline, stars, and testimonial MUST be white (and the stars
 * gold) for legibility. These cannot come from the Paper theme because no
 * theme token represents "always-white-regardless-of-surface". Confirmed
 * against 01-accounts-sign-up/designs/sign-up-form-tablet.png. Do not
 * extract to the Paper theme or swap for `onPrimaryContainer`.
 */
const BRAND_ON_ARTWORK = '#FFFFFF';
const BRAND_STAR_GOLD = '#F4B842';
const BRAND_WORDMARK_DOT = '#C7A4F2';

export interface BrandArtworkPanelProps {
  /**
   * Headline rendered as the hero text on the artwork panel. i18n-ready — the
   * caller passes an already-translated string.
   */
  headline: string;
  /**
   * Testimonial copy shown beneath the rating stars.
   */
  testimonial: string;
  /**
   * Attribution line for the testimonial (name, role).
   */
  attribution: string;
  /**
   * Wordmark shown top-left, above the headline. Defaults to "tappd" to
   * match the Feature 01 designs.
   */
  wordmark?: string;
}

/**
 * Tablet-only decorative panel shown on the left of the auth split view. On
 * phones the parent layout omits this panel entirely.
 *
 * The background is the Yellow Ladder narrow vertical cloud painting
 * (`cloud-wizard-side.jpg`) — the Figma-canonical asset for every wizard
 * split layout. `resizeMode="cover"` lets the painting fill the column
 * without stretching regardless of the column's aspect ratio.
 */
export function BrandArtworkPanel({
  headline,
  testimonial,
  attribution,
  wordmark = 'tappd',
}: BrandArtworkPanelProps) {
  const theme = useAppTheme();
  return (
    <ImageBackground
      source={require('../assets/cloud-wizard-side.jpg')}
      resizeMode="cover"
      style={styles.root}
      imageStyle={styles.imageStyle}
    >
      <View style={[styles.inner, { padding: theme.spacing.xl }]}>
        <View style={styles.topSection}>
          <Text variant="headlineMedium" style={[styles.wordmark, { color: BRAND_ON_ARTWORK }]}>
            {wordmark}
          </Text>
          <View
            style={[
              styles.wordmarkDot,
              { backgroundColor: BRAND_WORDMARK_DOT, marginLeft: theme.spacing.xs },
            ]}
          />
        </View>
        <View style={styles.headlineSection}>
          <Text style={[styles.headline, { color: BRAND_ON_ARTWORK }]}>{headline}</Text>
        </View>
        <View style={styles.testimonialSection}>
          <View style={styles.ratingRow}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Icon
                key={index}
                name="star"
                size={20}
                color={BRAND_STAR_GOLD}
                style={styles.starGlyph}
              />
            ))}
          </View>
          <Text
            variant="bodyMedium"
            style={[
              styles.testimonial,
              { color: BRAND_ON_ARTWORK, marginTop: theme.spacing.sm },
            ]}
          >
            {testimonial}
          </Text>
          <Text
            variant="labelSmall"
            style={[
              styles.attribution,
              { color: BRAND_ON_ARTWORK, marginTop: theme.spacing.xs },
            ]}
          >
            {attribution}
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  imageStyle: { resizeMode: 'cover' },
  inner: { flex: 1, justifyContent: 'space-between' },
  topSection: { flexDirection: 'row', alignItems: 'center' },
  wordmark: { fontWeight: '800', letterSpacing: -0.5 },
  wordmarkDot: { width: 10, height: 10, borderRadius: 5 },
  headlineSection: { flex: 1, justifyContent: 'center' },
  headline: { fontWeight: '900', fontSize: 72, lineHeight: 76, letterSpacing: -1 },
  testimonialSection: {},
  ratingRow: { flexDirection: 'row' },
  starGlyph: { marginRight: 2 },
  testimonial: { fontStyle: 'italic', lineHeight: 20 },
  attribution: {},
});
