import { Platform, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, S, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import SettleCrossfade from '../ui/SettleCrossfade';
import { getHeroTabCardTone } from './dashboardCardTones';

const FLAT_CARD_SHADOW = Platform.OS === 'web'
  ? { boxShadow: 'none' }
  : {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  };

/**
 * Tab-level hero metric — tinted card with section title.
 * Income/expense tones match Budget tab summary cards (green / red accent).
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
  const heroTone = tone === 'income' || tone === 'expense' ? getHeroTabCardTone(tone) : null;

  const cardStyle = heroTone
    ? {
      backgroundColor: heroTone.cardStyle.backgroundColor,
      borderRadius: R.card,
      padding: S.cardPad,
      ...heroTone.cardStyle,
      ...FLAT_CARD_SHADOW,
      ...style,
    }
    : {
      ...style,
    };

  const Wrapper = heroTone ? View : SurfaceCard;
  const wrapperProps = heroTone
    ? { style: cardStyle }
    : { style: cardStyle };

  const titleStyle = heroTone
    ? { ...T.fieldLabel, color: C.muted, fontWeight: '500' }
    : undefined;

  const valueColor = heroTone?.valueColor ?? C.text;

  return (
    <Wrapper {...wrapperProps}>
      <InCardSectionHeader
        title={label}
        trailing={trailing}
        titleStyle={titleStyle}
        style={{ marginBottom: frequencyCaption ? 8 : heroTone ? 10 : 12 }}
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
            color: valueColor,
            letterSpacing: -0.02,
            ...tabularNums,
          }}
          >
            {value}
          </Text>
        </SettleCrossfade>
      ) : (
        <Text style={{
          fontSize: 40,
          lineHeight: 46,
          fontWeight: '700',
          color: valueColor,
          letterSpacing: -0.02,
          ...tabularNums,
        }}
        >
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
          backgroundColor: heroTone?.accent ?? C.tableHeaderBg,
        }}
        >
          <Text style={{
            ...T.caption,
            fontWeight: '600',
            color: heroTone ? C.bg : C.muted,
          }}
          >
            {periodLabel}
          </Text>
        </View>
      ) : null}
      {secondaryLabel ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 10 }}>{secondaryLabel}</Text>
      ) : null}
      {tertiaryLabel ? (
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>{tertiaryLabel}</Text>
      ) : null}
      {children}
    </Wrapper>
  );
}
