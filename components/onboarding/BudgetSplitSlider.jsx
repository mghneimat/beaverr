import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, PanResponder, Platform, TextInput } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { formatCurrency, sanitizeAmountInput, formatAmountInput, roundMoney } from '../../lib/finance';
import {
  clampBudgetSpendingRatio,
  clampSplitSpending,
  ratioToSnappedSpending,
} from '../../lib/budgetSplit';
import { parseAmount } from '../../lib/sectionEditStorage';
import {
  DASHBOARD_MOTION_DURATION_FAST,
  DASHBOARD_MOTION_EASE,
} from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { C, T, tabularNums, R } from '../../constants/onboarding-theme';
const THUMB_SIZE = 24;
const TRACK_HEIGHT = 8;
const AMOUNT_INPUT_WIDTH = 122;

function ratioFromLocationX(x, trackWidthPx) {
  const usable = Math.max(1, trackWidthPx - THUMB_SIZE);
  const adjusted = Math.max(0, Math.min(usable, x - THUMB_SIZE / 2));
  return clampBudgetSpendingRatio(adjusted / usable);
}

function spendingFromRatio(ratio, base) {
  if (base <= 0) return 0;
  return ratioToSnappedSpending(base, ratio);
}

function SplitAmountInput({
  label,
  amount,
  draft,
  focused,
  onFocus,
  onChangeDraft,
  onBlur,
  currency,
  disabled,
  a11yLabel,
  errorText,
}) {
  const formattedAmount = formatAmountInput(Math.max(0, Number(amount) || 0));
  const displayValue = focused ? draft : formattedAmount;

  return (
    <View style={{ alignItems: 'center', flexShrink: 0 }}>
      <Text style={{ ...T.caption, fontWeight: '600', color: C.muted, marginBottom: 4 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          width: AMOUNT_INPUT_WIDTH,
          borderWidth: 1.5,
          borderColor: errorText ? C.danger : focused ? C.accent : C.border,
          borderRadius: R.input,
          backgroundColor: C.surface,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      >
        <TextInput
          value={displayValue}
          onChangeText={onChangeDraft}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          keyboardType={Platform.OS === 'web' ? 'numeric' : 'decimal-pad'}
          inputMode="decimal"
          accessibilityLabel={a11yLabel}
          placeholder="0"
          placeholderTextColor={C.muted}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 16,
            fontWeight: '700',
            color: C.text,
            textAlign: 'center',
            padding: 0,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
            ...tabularNums,
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.muted, ...tabularNums }}>
          {currency}
        </Text>
      </View>
      {errorText ? (
        <Text style={{ ...T.caption, color: C.danger, marginTop: 4, textAlign: 'center' }}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
function BudgetSplitSliderTrack({ ratioProgress, disabled, panHandlers, onTrackLayout }) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${ratioProgress.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${ratioProgress.value * 100}%`,
  }));

  return (
    <View
      onLayout={onTrackLayout}
      style={{
        height: THUMB_SIZE + 12,
        justifyContent: 'center',
        ...(Platform.OS === 'web' ? { touchAction: 'none', cursor: disabled ? 'default' : 'pointer' } : {}),
      }}
      {...panHandlers}
    >
      <View
        style={{
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          overflow: 'hidden',
          backgroundColor: C.border,
        }}
      >
        <Animated.View
          style={[
            {
              height: '100%',
              backgroundColor: C.primary,
            },
            fillStyle,
          ]}
        />
      </View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            marginLeft: -THUMB_SIZE / 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: C.primary,
            borderWidth: 2,
            borderColor: C.surface,
            ...(Platform.OS === 'web' ? { cursor: disabled ? 'default' : 'grab' } : {}),
          },
          thumbStyle,
        ]}
      />
    </View>
  );
}

/**
 * Slide toward savings (left) or spending (right) as a 0–1 spending ratio.
 * Drag is continuous; values round to whole currency units on save.
 */
export default function BudgetSplitSlider({
  value = 1,
  onChange,
  onPreviewChange,
  totalAvailable = 0,
  currency = 'Kč',
  disabled = false,
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const trackWidth = useRef(0);
  const onChangeRef = useRef(onChange);
  const onPreviewRef = useRef(onPreviewChange);
  const baseRef = useRef(0);
  const activeSpendingRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [focusedField, setFocusedField] = useState(null);
  const [savingsDraft, setSavingsDraft] = useState('');
  const [spendingDraft, setSpendingDraft] = useState('');
  const [amountError, setAmountError] = useState(null);

  const base = Math.max(0, Number(totalAvailable) || 0);
  baseRef.current = base;
  onChangeRef.current = onChange;
  onPreviewRef.current = onPreviewChange;

  const committedSpending = spendingFromRatio(value, base);
  const committedRatio = base > 0 ? committedSpending / base : clampBudgetSpendingRatio(value);

  const [activeSpending, setActiveSpending] = useState(committedSpending);
  const ratioProgress = useSharedValue(committedRatio);

  activeSpendingRef.current = activeSpending;

  const applySpending = useCallback((spending, { preview = false, commit = false, animate = false, continuous = false } = {}) => {
    const avail = baseRef.current;
    if (avail <= 0) return;

    const clamped = clampSplitSpending(avail, spending);
    const ratio = clamped / avail;

    if (continuous) {
      activeSpendingRef.current = clamped;
      setActiveSpending(clamped);
      cancelAnimation(ratioProgress);
      ratioProgress.value = ratio;
      if (preview) onPreviewRef.current?.(ratio);
      return;
    }

    if (clamped === activeSpendingRef.current && !commit) return;

    activeSpendingRef.current = clamped;
    setActiveSpending(clamped);

    cancelAnimation(ratioProgress);
    if (animate && !reduceMotion) {
      ratioProgress.value = withTiming(ratio, {
        duration: DASHBOARD_MOTION_DURATION_FAST,
        easing: DASHBOARD_MOTION_EASE,
      });
    } else {
      ratioProgress.value = ratio;
    }

    if (preview) onPreviewRef.current?.(ratio);
    if (commit) onChangeRef.current?.(ratio);
  }, [ratioProgress, reduceMotion]);

  const applyRatio = useCallback((ratio, options = {}) => {
    const avail = baseRef.current;
    if (avail <= 0) return;
    const spending = spendingFromRatio(ratio, avail);
    applySpending(spending, options);
  }, [applySpending]);

  useEffect(() => {
    if (isDraggingRef.current) return;
    applyRatio(committedRatio, { animate: true });
  }, [committedRatio, applyRatio]);

  const savingsShift = Math.max(0, roundMoney(base) - roundMoney(activeSpending));
  const displayRatio = base > 0 ? activeSpending / base : clampBudgetSpendingRatio(value);
  const maxAmountLabel = formatCurrency(base, currency);

  useEffect(() => {
    if (focusedField !== 'savings') {
      setSavingsDraft(formatAmountInput(savingsShift));
    }
    if (focusedField !== 'spending') {
      setSpendingDraft(formatAmountInput(activeSpending));
    }
  }, [savingsShift, activeSpending, focusedField]);

  const commitAmount = useCallback((field) => {
    const avail = baseRef.current;
    if (avail <= 0) return;

    const draft = field === 'savings' ? savingsDraft : spendingDraft;
    const parsed = parseAmount(draft);

    if (parsed == null) {
      setAmountError(t('dashboard.budgetScreen.unallocatedSlider.amountInvalid', { amount: maxAmountLabel }));
      if (field === 'savings') setSavingsDraft(formatAmountInput(savingsShift));
      else setSpendingDraft(formatAmountInput(activeSpending));
      return;
    }

    if (parsed < 0 || parsed > avail) {
      setAmountError(t('dashboard.budgetScreen.unallocatedSlider.amountInvalid', { amount: maxAmountLabel }));
    } else {
      setAmountError(null);
    }

    const spending = field === 'savings'
      ? clampSplitSpending(avail, avail - parsed)
      : clampSplitSpending(avail, parsed);

    applySpending(spending, { commit: true, animate: true });
    setFocusedField(null);
  }, [
    savingsDraft,
    spendingDraft,
    savingsShift,
    activeSpending,
    applySpending,
    maxAmountLabel,
    t,
  ]);

  const applyLocationX = useCallback((x, { preview }) => {
    const track = trackWidth.current;
    if (track <= 0 || baseRef.current <= 0) return;
    applyRatio(ratioFromLocationX(x, track), { preview, continuous: true });
  }, [applyRatio]);

  const finishDrag = useCallback(() => {
    isDraggingRef.current = false;
    applyRatio(ratioProgress.value, { commit: true, animate: false });
    onPreviewRef.current?.(null);
  }, [applyRatio, ratioProgress]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        if (disabled || trackWidth.current <= 0 || baseRef.current <= 0) return;
        isDraggingRef.current = true;
        applyLocationX(evt.nativeEvent.locationX, { preview: true });
      },
      onPanResponderMove: (evt) => {
        if (disabled || !isDraggingRef.current) return;
        applyLocationX(evt.nativeEvent.locationX, { preview: true });
      },
      onPanResponderRelease: () => {
        finishDrag();
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        onPreviewRef.current?.(null);
      },
    }),
    [disabled, applyLocationX, finishDrag],
  );

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={t('dashboard.budgetScreen.unallocatedSlider.a11y')}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(displayRatio * 100),
        text: `${Math.round(displayRatio * 100)}%`,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, gap: 12 }}>
        <SplitAmountInput
          label={t('dashboard.budgetScreen.unallocatedSlider.toSavings')}
          amount={savingsShift}
          draft={savingsDraft}
          focused={focusedField === 'savings'}
          onFocus={() => {
            setAmountError(null);
            setFocusedField('savings');
            setSavingsDraft(formatAmountInput(savingsShift));
          }}
          onChangeDraft={(text) => setSavingsDraft(sanitizeAmountInput(text))}
          onBlur={() => commitAmount('savings')}
          currency={currency}
          disabled={disabled || base <= 0}
          a11yLabel={t('dashboard.budgetScreen.unallocatedSlider.savingsAmountA11y')}
          errorText={focusedField === 'savings' ? amountError : null}
        />
        <SplitAmountInput
          label={t('dashboard.budgetScreen.unallocatedSlider.toSpend')}
          amount={roundMoney(activeSpending)}
          draft={spendingDraft}
          focused={focusedField === 'spending'}
          onFocus={() => {
            setAmountError(null);
            setFocusedField('spending');
            setSpendingDraft(formatAmountInput(activeSpending));
          }}
          onChangeDraft={(text) => setSpendingDraft(sanitizeAmountInput(text))}
          onBlur={() => commitAmount('spending')}
          currency={currency}
          disabled={disabled || base <= 0}
          a11yLabel={t('dashboard.budgetScreen.unallocatedSlider.spendingAmountA11y')}
          errorText={focusedField === 'spending' ? amountError : null}
        />
      </View>
      <BudgetSplitSliderTrack
        ratioProgress={ratioProgress}
        disabled={disabled}
        panHandlers={panResponder.panHandlers}
        onTrackLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={{ ...T.caption, color: C.muted }}>
          {t('dashboard.budgetScreen.unallocatedSlider.moreSavings')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted }}>
          {t('dashboard.budgetScreen.unallocatedSlider.moreSpending')}
        </Text>
      </View>
    </View>
  );
}
