import { View, Pressable, Platform, StyleSheet } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import SurfaceCard from '../ui/SurfaceCard';
import { SparklesIcon } from '../app/AppNavIcons';
import InsightOutlineGlow from './InsightOutlineGlow';
import { useInsightTextExpansion } from './useInsightTextExpansion';

const ICON_SIZE_STANDALONE = 18;
const ICON_SIZE_EMBEDDED = 14;
const BODY_LINE_HEIGHT = 24;

function InsightHeader({ title, iconSize }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <SparklesIcon color={C.accent} size={iconSize} />
      <Text
        accessibilityRole="header"
        style={{ ...T.cardTitle, flex: 1 }}
        numberOfLines={2}
      >
        {title}
      </Text>
    </View>
  );
}

function InsightBodyText({ paragraphs, numberOfLines, style }) {
  if (!paragraphs?.length) return null;

  return (
    <View style={style}>
      {paragraphs.map((paragraph, index) => (
        <Text
          key={`${index}-${paragraph.slice(0, 24)}`}
          style={{
            ...T.helper,
            fontSize: 15,
            lineHeight: BODY_LINE_HEIGHT,
            color: C.text,
            marginTop: index > 0 ? 8 : 0,
          }}
          numberOfLines={numberOfLines}
        >
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

/**
 * Unified AI insight card — standalone on tabs, embedded in Summary rows.
 */
export default function AIInsightSection({
  paragraphs,
  ctaLabel,
  onCtaPress,
  accessibilityLabel,
  variant = 'standalone',
  titleKey = 'dashboard.insights.sectionTitle',
  titleOverride,
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const isEmbedded = variant === 'embedded';
  const filteredParagraphs = (paragraphs || []).filter(Boolean);

  const {
    fullText,
    collapsedLines,
    expanded,
    showToggle,
    glowToken,
    toggleExpanded,
    handleFullTextLayout,
  } = useInsightTextExpansion(filteredParagraphs, { variant });

  if (!filteredParagraphs.length) return null;

  const title = titleOverride ?? t(titleKey);
  const iconSize = isEmbedded ? ICON_SIZE_EMBEDDED : ICON_SIZE_STANDALONE;
  const shellPadding = isEmbedded ? 12 : undefined;
  const borderRadius = isEmbedded ? R.input : R.card;

  const body = (
    <>
      {!isEmbedded && fullText ? (
        <Text
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.measureText, { lineHeight: BODY_LINE_HEIGHT, fontSize: 15 }]}
          onTextLayout={handleFullTextLayout}
        >
          {fullText}
        </Text>
      ) : null}

      <Animated.View
        layout={reduceMotion ? undefined : LinearTransition.duration(DASHBOARD_MOTION_DURATION)}
      >
        <InsightBodyText
          paragraphs={filteredParagraphs}
          numberOfLines={
            isEmbedded
              ? collapsedLines
              : !expanded && showToggle
                ? collapsedLines
                : undefined
          }
        />

        {showToggle ? (
          <Pressable
            onPress={toggleExpanded}
            accessibilityRole="button"
            accessibilityLabel={expanded ? t('dashboard.insights.showLess') : t('dashboard.insights.learnMore')}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed, hovered }) => ({
              alignSelf: 'flex-start',
              marginTop: 8,
              paddingVertical: 2,
              opacity: pressed ? 0.7 : 1,
              ...(Platform.OS === 'web' && hovered ? { opacity: 0.85 } : {}),
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.accent }}>
              {expanded ? t('dashboard.insights.showLess') : t('dashboard.insights.learnMore')}
            </Text>
          </Pressable>
        ) : null}
      </Animated.View>

      {!isEmbedded && ctaLabel && onCtaPress ? (
        <Pressable
          onPress={onCtaPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? ctaLabel}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            marginTop: 16,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: R.button,
            backgroundColor: pressed ? C.pillSelectedPressed : C.pillSelectedBg,
            minHeight: 44,
            justifyContent: 'center',
            opacity: pressed ? 0.92 : 1,
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.pillSelectedText }}>
            {ctaLabel}
          </Text>
        </Pressable>
      ) : null}
    </>
  );

  const card = (
    <SurfaceCard
      padded={shellPadding == null}
      style={{
        backgroundColor: C.insightCardBg,
        borderWidth: 1,
        borderColor: C.insightCardBorder,
        ...(shellPadding != null ? { padding: shellPadding } : {}),
      }}
    >
      <InsightHeader title={title} iconSize={iconSize} />
      {body}
    </SurfaceCard>
  );

  if (isEmbedded) {
    return <View style={{ marginTop: 10 }}>{card}</View>;
  }

  return (
    <InsightOutlineGlow glowToken={glowToken} borderRadius={borderRadius}>
      {card}
    </InsightOutlineGlow>
  );
}

const styles = StyleSheet.create({
  measureText: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    zIndex: -1,
    color: C.text,
  },
});
