import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, S } from '../../constants/onboarding-theme';
import OnboardingIllustrationFrame from './OnboardingIllustrationFrame';
import OnboardingIntroCard from './OnboardingIntroCard';

/**
 * Welcome/splash/question intro card — illustration band, divider, copy, children, in-card actions.
 */
export default function OnboardingIntroCardLayout({
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
}) {
  const hasIllustration = Boolean(illustration);
  const hasTitleHeader = Boolean(title);
  const hasHeader = Boolean(headerContent) || hasTitleHeader;
  const hasChildren = children != null && children !== false;

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
        }}>
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
      }}>
        {headerContent ?? (hasTitleHeader ? (
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
              ]}>
                {description}
              </Text>
            ) : null}
          </>
        ) : null)}

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

