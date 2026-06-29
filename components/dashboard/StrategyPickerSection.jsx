import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';
import StrategySectionIntro from './StrategySectionIntro';

/**
 * Unified section shell for budget strategy pickers (rollover + daily spending).
 * @param {{
 *   sectionLabel: string,
 *   helper: string,
 *   footnote?: string|null,
 *   a11yLabel?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export default function StrategyPickerSection({
  sectionLabel,
  helper,
  footnote,
  a11yLabel,
  children,
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={a11yLabel || sectionLabel}
    >
      <StrategySectionIntro sectionLabel={sectionLabel} helper={helper} />
      <View style={{ gap: 8 }}>{children}</View>
      {footnote ? (
        <Text
          style={{
            ...T.caption,
            color: C.muted,
            marginTop: 12,
            lineHeight: 18,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: C.border,
            opacity: 0.9,
          }}
        >
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}
