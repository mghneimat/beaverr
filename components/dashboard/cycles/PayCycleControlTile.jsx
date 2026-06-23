import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { C, T, SHADOW } from '../../../constants/onboarding-theme';
import CycleControlButtonIcon from './CycleControlButtonIcon';
import { CYCLE_CONTROL_PILL_BUTTON } from './cycleControlPill';

/** Snackbar success / error tones (matches dashboard toast reference) */
const CYCLE_START_GREEN = '#317325';
const CYCLE_START_GREEN_HOVER = '#3A872C';
const CYCLE_START_GREEN_PRESSED = '#26561C';
const CYCLE_END_RED = '#C02B33';
const CYCLE_END_RED_HOVER = '#D1353D';
const CYCLE_END_RED_PRESSED = '#9A2329';

/**
 * Square pay-cycle card content — title, helper, and Start / End button.
 */
export default function PayCycleControlTile({
  activeCycle,
  onStartPress,
  onEndPress,
}) {
  const { t } = useI18n();
  const ending = Boolean(activeCycle);
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const label = ending ? t('dashboard.cycles.endCycle.cta') : t('dashboard.cycles.noActive.cta');
  const a11y = ending
    ? t('dashboard.cycles.endCycle.ctaA11y')
    : t('dashboard.cycles.noActive.ctaA11y');

  const buttonBg = ending
    ? (pressed ? CYCLE_END_RED_PRESSED : hovered ? CYCLE_END_RED_HOVER : CYCLE_END_RED)
    : (pressed ? CYCLE_START_GREEN_PRESSED : hovered ? CYCLE_START_GREEN_HOVER : CYCLE_START_GREEN);

  return (
    <View style={{ flex: 1, flexDirection: 'column', padding: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }} numberOfLines={2}>
        {t('dashboard.cycles.budgetCard.title')}
      </Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 6, flex: 1 }} numberOfLines={3}>
        {t('dashboard.cycles.budgetCard.helper')}
      </Text>
      <Pressable
        onPress={ending ? onEndPress : onStartPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{
          marginTop: 'auto',
          ...CYCLE_CONTROL_PILL_BUTTON,
          backgroundColor: buttonBg,
          ...SHADOW.button,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <CycleControlButtonIcon ending={ending} />
          <Text style={{ fontSize: 14, fontWeight: '600', lineHeight: 16, color: C.pillSelectedText }}>
            {label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
