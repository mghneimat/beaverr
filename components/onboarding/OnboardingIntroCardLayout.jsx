import { Platform, ScrollView, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, ONBOARDING_FULL_BLEED, S } from '../../constants/onboarding-theme';
import { elevationShadow } from '../../lib/shadow';
import OnboardingIllustrationFrame from './OnboardingIllustrationFrame';
import OnboardingIntroCard from './OnboardingIntroCard';

const SHOW_SCROLL_INDICATOR = Platform.OS === 'web';

function renderHeader({
  headerContent,
  hasTitleHeader,
  title,
  titleTextStyle,
  description,
  descriptionTextStyle,
  descriptionMinHeight,
}) {
  if (headerContent) return headerContent;
  if (!hasTitleHeader) return null;
  return (
    <>
      <Text
        accessibilityRole="header"
        style={[
          titleTextStyle,
          { marginBottom: description ? 12 : 0 },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text style={[
          descriptionTextStyle,
          descriptionMinHeight ? { minHeight: descriptionMinHeight } : null,
        ]}
        >
          {description}
        </Text>
      ) : null}
    </>
  );
}

function IllustrationBand({
  illustration,
  padH,
  bandStyle,
}) {
  return (
    <View style={{
      backgroundColor: C.insightCardBg,
      paddingHorizontal: padH,
      paddingTop: padH,
      paddingBottom: padH,
      flexShrink: 0,
      justifyContent: 'center',
      ...bandStyle,
    }}
    >
      <OnboardingIllustrationFrame style={{ marginBottom: 0 }}>
        {illustration}
      </OnboardingIllustrationFrame>
    </View>
  );
}

function CardModeLayout({
  illustration,
  illustrationMinHeight,
  hasIllustration,
  hasHeader,
  hasChildren,
  headerContent,
  hasTitleHeader,
  title,
  titleTextStyle,
  description,
  descriptionTextStyle,
  descriptionMinHeight,
  children,
  footer,
}) {
  return (
    <OnboardingIntroCard style={{ padding: 0, overflow: 'hidden' }}>
      {hasIllustration ? (
        <View style={{
          backgroundColor: C.insightCardBg,
          paddingHorizontal: S.cardPad,
          paddingTop: S.cardPad,
          paddingBottom: S.cardPad,
          ...(illustrationMinHeight
            ? { minHeight: illustrationMinHeight + S.cardPad * 2, justifyContent: 'center' }
            : null),
        }}
        >
          <OnboardingIllustrationFrame style={{ marginBottom: 0 }}>
            {illustration}
          </OnboardingIllustrationFrame>
        </View>
      ) : null}

      <View style={{
        borderTopWidth: hasIllustration ? 1 : 0,
        borderTopColor: C.border,
        backgroundColor: C.surface,
        padding: S.cardPad,
      }}
      >
        {renderHeader({
          headerContent,
          hasTitleHeader,
          title,
          titleTextStyle,
          description,
          descriptionTextStyle,
          descriptionMinHeight,
        })}

        {hasChildren ? (
          <View style={{ marginTop: hasHeader ? S.sectionGap : 0 }}>
            {children}
          </View>
        ) : null}

        {footer ? (
          <View style={{ marginTop: hasHeader || hasChildren ? S.sectionGap : 0 }}>
            {footer}
          </View>
        ) : null}
      </View>
    </OnboardingIntroCard>
  );
}

function FullBleedModeLayout({
  illustration,
  illustrationMinHeight,
  layoutMode,
  hasIllustration,
  hasHeader,
  hasChildren,
  headerContent,
  hasTitleHeader,
  title,
  titleTextStyle,
  description,
  descriptionTextStyle,
  descriptionMinHeight,
  children,
  footer,
  contentPadH,
  scrollRef,
}) {
  const padH = contentPadH ?? ONBOARDING_FULL_BLEED.contentPadH;
  const isIntroPinned = layoutMode === 'intro';
  const isIntroScroll = layoutMode === 'introScroll';
  const panelShadow = elevationShadow(ONBOARDING_FULL_BLEED.panelShadow);

  const headerBlock = renderHeader({
    headerContent,
    hasTitleHeader,
    title,
    titleTextStyle,
    description,
    descriptionTextStyle,
    descriptionMinHeight,
  });

  const bodyContent = (
    <>
      {headerBlock}
      {hasChildren ? (
        <View style={{ marginTop: hasHeader ? S.sectionGap : 0 }}>
          {children}
        </View>
      ) : null}
    </>
  );

  const compactBandStyle = illustrationMinHeight
    ? {
      minHeight: Math.min(
        illustrationMinHeight + padH * 2,
        ONBOARDING_FULL_BLEED.heroCompactMaxHeight,
      ),
    }
    : { minHeight: ONBOARDING_FULL_BLEED.heroCompactMinHeight };

  const scrollBandStyle = illustrationMinHeight
    ? { minHeight: illustrationMinHeight + padH * 2 }
    : { minHeight: ONBOARDING_FULL_BLEED.heroCompactMinHeight };

  /** Unified scroll — illustration + copy + fields + footer (consent, setup-mode). */
  if (isIntroScroll) {
    return (
      <ScrollView
        ref={scrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          ...(Platform.OS === 'web' ? { height: '100%' } : null),
        }}
        contentContainerStyle={{
          flexGrow: 1,
          ...(Platform.OS === 'web' ? { minHeight: '100%' } : null),
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={SHOW_SCROLL_INDICATOR}
      >
        {hasIllustration ? (
          <IllustrationBand
            illustration={illustration}
            padH={padH}
            bandStyle={scrollBandStyle}
          />
        ) : null}
        <View style={{
          flexGrow: 1,
          backgroundColor: C.surface,
          borderTopWidth: hasIllustration ? 1 : 0,
          borderTopColor: C.border,
          paddingHorizontal: padH,
          paddingTop: padH,
          paddingBottom: padH,
          ...(Platform.OS === 'web' && !hasIllustration ? { minHeight: '100%' } : null),
          ...panelShadow,
        }}
        >
          {bodyContent}
          {footer ? (
            <View style={{ marginTop: hasHeader || hasChildren ? S.sectionGap : 0 }}>
              {footer}
            </View>
          ) : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, width: '100%', minHeight: 0 }}>
      {hasIllustration && !isIntroScroll ? (
        <IllustrationBand
          illustration={illustration}
          padH={padH}
          bandStyle={isIntroPinned ? compactBandStyle : scrollBandStyle}
        />
      ) : null}

      <View style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: C.surface,
        borderTopWidth: hasIllustration ? 1 : 0,
        borderTopColor: C.border,
        ...panelShadow,
      }}
      >
        {isIntroPinned ? (
          <View style={{ flex: 1, minHeight: 0, paddingHorizontal: padH, paddingTop: padH }}>
            <ScrollView
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={SHOW_SCROLL_INDICATOR}
            >
              {bodyContent}
            </ScrollView>
            {footer ? (
              <View style={{ flexShrink: 0, paddingBottom: padH, paddingTop: S.sectionGap }}>
                {footer}
              </View>
            ) : null}
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: padH,
              paddingTop: padH,
              paddingBottom: padH,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={SHOW_SCROLL_INDICATOR}
          >
            {bodyContent}
            {footer ? (
              <View style={{ marginTop: hasHeader || hasChildren ? S.sectionGap : 0 }}>
                {footer}
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/**
 * Welcome/splash/question intro — card on tablet+ or full-bleed bands on phone.
 * @param {'card'|'fullBleed'} variant
 * @param {'intro'|'introScroll'|'form'} layoutMode
 *   intro — compact hero + pinned CTA (welcome, splashes)
 *   introScroll — illustration scrolls with body + footer (consent, setup-mode)
 *   form — question screens, no phone illustration
 */
export default function OnboardingIntroCardLayout({
  variant = 'card',
  layoutMode = 'form',
  contentPadH,
  illustration,
  illustrationMinHeight,
  title,
  titleTextStyle,
  description,
  descriptionTextStyle,
  descriptionMinHeight,
  headerContent,
  children,
  footer,
  scrollRef,
}) {
  const hasIllustration = Boolean(illustration);
  const hasTitleHeader = Boolean(title);
  const hasHeader = Boolean(headerContent) || hasTitleHeader;
  const hasChildren = children != null && children !== false;

  const shared = {
    illustration,
    illustrationMinHeight,
    hasIllustration,
    hasHeader,
    hasChildren,
    headerContent,
    hasTitleHeader,
    title,
    titleTextStyle,
    description,
    descriptionTextStyle,
    descriptionMinHeight,
    children,
    footer,
  };

  if (variant === 'fullBleed') {
    return (
      <FullBleedModeLayout
        {...shared}
        layoutMode={layoutMode}
        contentPadH={contentPadH}
        scrollRef={scrollRef}
      />
    );
  }

  return <CardModeLayout {...shared} />;
}
