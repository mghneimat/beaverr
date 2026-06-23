import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import SettleCrossfade from '../ui/SettleCrossfade';

const HERO_TONES = {
  income: {
    cardBg: C.heroIncomeBg,
    cardBorder: C.heroIncomeBorder,
    valueColor: C.heroIncomeValue,
    badgeBg: C.heroIncomeBadge,
    badgeText: '#FFFFFF',
  },
  expense: {
    cardBg: C.heroExpenseBg,
    cardBorder: C.heroExpenseBorder,
    valueColor: C.heroExpenseValue,
    badgeBg: C.heroExpenseBadge,
    badgeText: '#FFFFFF',
  },
};

/**
 * Tab-level hero metric — tinted card with section title.
 * @param {'income'|'expense'|undefined} tone
 */
export default function TabHeroMetric({
  label,
  value,
  animationKey,
  periodLabel,
  secondaryLabel,
  tertiaryLabel,
  tone,
  trailing,
  frequencyCaption,
  style,
  children,
}) {
  const palette = tone ? HERO_TONES[tone] : null;

  return (
    <SurfaceCard style={{
      backgroundColor: palette?.cardBg ?? C.surface,
      borderWidth: palette ? 1 : 0,
      borderColor: palette?.cardBorder ?? 'transparent',
      ...style,
    }}
    >
      <InCardSectionHeader
        title={label}
        trailing={trailing}
        style={{ marginBottom: frequencyCaption ? 8 : 12 }}
      />
      {frequencyCaption ? (
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 12 }}>{frequencyCaption}</Text>
      ) : null}
      {animationKey != null ? (
        <SettleCrossfade animationKey={animationKey} slide={false}>
          <Text style={{
            fontSize: 40,
            lineHeight: 46,
            fontWeight: '700',
            color: palette?.valueColor ?? C.primary,
            letterSpacing: -0.02,
            ...tabularNums,
          }}>
            {value}
          </Text>
        </SettleCrossfade>
      ) : (
        <Text style={{
          fontSize: 40,
          lineHeight: 46,
          fontWeight: '700',
          color: palette?.valueColor ?? C.primary,
          letterSpacing: -0.02,
          ...tabularNums,
        }}>
          {value}
        </Text>
      )}
      {periodLabel ? (
        <View style={{
          alignSelf: 'flex-start',
          marginTop: 10,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: R.pill,
          backgroundColor: palette?.badgeBg ?? C.tableHeaderBg,
        }}>
          <Text style={{
            ...T.caption,
            fontWeight: '600',
            color: palette?.badgeText ?? C.muted,
          }}>
            {periodLabel}
          </Text>
        </View>
      ) : null}
      {secondaryLabel ? (
        <Text style={{ ...T.helper, color: C.muted, marginTop: 10 }}>{secondaryLabel}</Text>
      ) : null}
      {tertiaryLabel ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{tertiaryLabel}</Text>
      ) : null}
      {children}
    </SurfaceCard>
  );
}
