import { useEffect, useMemo, useState } from 'react';
import { View, Pressable, ScrollView, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import {
  WalletCardsIcon,
  PiggyBankIcon,
  SavingsIcon,
} from '../app/AppNavIcons';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { CHEVRON_RIGHT_NODES } from '../app/lucidePaths';
import AnimatedCollapse from './AnimatedCollapse';
import JarsAnimatedCell from './JarsAnimatedCell';

const ICON_SIZE = 18;
const CHEVRON_SIZE = 18;

/** @typedef {{ id: string, label: string, balance: number }} StashTabOption */

function stashIconForRef(ref) {
  if (ref === 'looseCash') return PiggyBankIcon;
  if (ref === 'savings') return SavingsIcon;
  return WalletCardsIcon;
}

function ChevronRightIcon({ color, rotated = false }) {
  return (
    <View style={{ transform: [{ rotate: rotated ? '90deg' : '0deg' }] }}>
      <LucideStrokeIcon nodes={CHEVRON_RIGHT_NODES} color={color} size={CHEVRON_SIZE} />
    </View>
  );
}

function StashTabSelectRow({
  option,
  currency,
  selected,
  onPress,
  index,
  animationKey,
}) {
  const Icon = stashIconForRef(option.id);
  const { t } = useI18n();

  return (
    <JarsAnimatedCell
      animationKey={animationKey}
      index={index}
      motion="full"
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={t('dashboard.budgetScreen.jars.transferSheet.tabOptionA11y', {
          name: option.label,
          amount: formatCurrency(option.balance, currency),
        })}
        style={({ pressed, hovered }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: R.input,
          borderWidth: 1,
          borderColor: selected ? C.pillSelectedBg : C.border,
          backgroundColor: selected
            ? C.surfaceTint
            : pressed || hovered
              ? C.bg
              : C.surface,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <View style={{
          width: 36,
          height: 36,
          borderRadius: R.input,
          backgroundColor: C.bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.border,
        }}
        >
          <Icon color={C.muted} size={ICON_SIZE} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ ...T.helper, fontWeight: '600', color: C.text }} numberOfLines={1}>
            {option.label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 2 }}>
            <Text style={{ ...T.caption, color: C.muted }}>
              {t('dashboard.budgetScreen.jars.transferSheet.balanceLabel', { amount: '' }).replace('{{amount}}', '').trimEnd()}
              {' '}
            </Text>
            <Text style={{ ...T.caption, color: C.muted, ...tabularNums }}>
              {formatCurrency(option.balance, currency)}
            </Text>
          </View>
        </View>
      </Pressable>
    </JarsAnimatedCell>
  );
}

/**
 * Tappable destination field — expands an animated list of stash tabs.
 */
export default function StashTabSelectField({
  label,
  options,
  selectedId,
  onSelect,
  currency,
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [listOpen, setListOpen] = useState(false);
  const [listAnimationKey, setListAnimationKey] = useState(0);
  const chevronProgress = useSharedValue(0);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === selectedId) ?? null,
    [options, selectedId],
  );

  useEffect(() => {
    chevronProgress.value = reduceMotion
      ? (listOpen ? 1 : 0)
      : withTiming(listOpen ? 1 : 0, {
        duration: DASHBOARD_MOTION_DURATION,
        easing: DASHBOARD_MOTION_EASE,
      });
  }, [listOpen, chevronProgress, reduceMotion]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(chevronProgress.value, [0, 1], [0, 90])}deg` }],
  }));

  const toggleList = () => {
    setListOpen((open) => {
      if (!open) {
        setListAnimationKey((key) => key + 1);
      }
      return !open;
    });
  };

  const handleSelect = (id) => {
    onSelect(id);
    setListOpen(false);
  };

  const TriggerIcon = selectedOption
    ? stashIconForRef(selectedOption.id)
    : WalletCardsIcon;

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ ...T.fieldLabel }}>{label}</Text>

      <Pressable
        onPress={toggleList}
        accessibilityRole="button"
        accessibilityState={{ expanded: listOpen }}
        accessibilityLabel={selectedOption
          ? t('dashboard.budgetScreen.jars.transferSheet.destinationSelectedA11y', {
            name: selectedOption.label,
          })
          : t('dashboard.budgetScreen.jars.transferSheet.selectTabA11y')}
        style={({ pressed, hovered }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 14,
          borderRadius: R.input,
          borderWidth: 1,
          borderColor: listOpen ? C.pillSelectedBg : C.border,
          backgroundColor: pressed || hovered ? C.bg : C.surface,
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <View style={{
          width: 40,
          height: 40,
          borderRadius: R.input,
          backgroundColor: C.bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.border,
        }}
        >
          <TriggerIcon color={C.muted} size={ICON_SIZE} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          {selectedOption ? (
            <>
              <Text style={{ ...T.helper, fontWeight: '600', color: C.text }} numberOfLines={1}>
                {selectedOption.label}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 2 }}>
                <Text style={{ ...T.caption, color: C.muted }}>
                  {t('dashboard.budgetScreen.jars.transferSheet.balanceLabel', { amount: '' }).replace('{{amount}}', '').trimEnd()}
                  {' '}
                </Text>
                <Text style={{ ...T.caption, color: C.muted, ...tabularNums }}>
                  {formatCurrency(selectedOption.balance, currency)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ ...T.helper, color: C.muted }}>
              {t('dashboard.budgetScreen.jars.transferSheet.selectTab')}
            </Text>
          )}
        </View>

        {reduceMotion ? (
          <ChevronRightIcon color={C.muted} rotated={listOpen} />
        ) : (
          <Animated.View style={chevronStyle}>
            <ChevronRightIcon color={C.muted} />
          </Animated.View>
        )}
      </Pressable>

      <AnimatedCollapse visible={listOpen} style={{ marginTop: 0 }}>
        <ScrollView
          style={{ maxHeight: 240 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={{ gap: 8, paddingTop: 4, paddingBottom: 2 }}>
            {options.map((option, index) => (
              <StashTabSelectRow
                key={option.id}
                option={option}
                currency={currency}
                selected={selectedId === option.id}
                onPress={() => handleSelect(option.id)}
                index={index}
                animationKey={listOpen ? `stash-list-${listAnimationKey}` : null}
              />
            ))}
          </View>
        </ScrollView>
      </AnimatedCollapse>
    </View>
  );
}
