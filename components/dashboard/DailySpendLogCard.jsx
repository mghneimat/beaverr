import { useState, useEffect, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import {
  isoDateKey,
  loadDailyLogs,
  saveDailyLogs,
  sumSpentOnDate,
  upsertDailyLog,
} from '../../lib/dailyLog';
import { parseAmount, amountToString } from '../../lib/sectionEditStorage';
import { buildTrackerPreviews } from '../../lib/trackerPreview';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { emitDashboardToast } from '../../lib/dashboardToast';
import * as Theme from '../../constants/onboarding-theme';

const { C, R, T } = Theme;
const TABULAR_NUMS = Theme.tabularNums;
import SurfaceCard from '../ui/SurfaceCard';
import AnimatedCollapse from './AnimatedCollapse';
import FormInput from '../ui/FormInput';
import PrimaryButton from '../ui/PrimaryButton';

const QUICK_ADD_AMOUNTS = [50, 100, 200, 500];
const FORM_COLLAPSE_FALLBACK = 320;

function formatTodayHeading(date, locale) {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  return date.toLocaleDateString(tag, { weekday: 'long', day: 'numeric', month: 'long' });
}

function QuickAddChip({ label, onPress, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => ({
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: R.pill,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: pressed ? C.overlayPressed : hovered ? C.overlayHover : C.pillUnselectedBg,
      })}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, ...TABULAR_NUMS }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function DailySpendLogCard({ financials, currency }) {
  const { t, locale } = useI18n();
  const today = isoDateKey();
  const dailyLogs = financials?.dailyLogs || [];
  const spentToday = sumSpentOnDate(dailyLogs, today);

  const previews = useMemo(() => buildTrackerPreviews({
    budget: financials?.budget,
    effectiveMonthlyFlexible: financials?.effectiveMonthlyFlexible ?? financials?.monthlyFlexible,
    dailyLogs,
    activeCycle: financials?.activeCycle,
    cycleAdjustments: financials?.cycleAdjustments || [],
  }), [financials, dailyLogs]);

  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    if (!expanded && !focused) {
      setInputValue(spentToday > 0 ? amountToString(spentToday) : '');
    }
  }, [spentToday, expanded, focused]);

  const daily = previews.daily;
  const paceColor = previews.mode === 'cycle' && daily.paceColor
    ? daily.paceColor
    : (daily.status === 'over' ? C.danger : daily.status === 'under' ? C.positive : C.primary);
  const paceNote = daily.over > 0
    ? t('dashboard.home.dailySpend.over', { amount: formatCurrency(daily.over, currency) })
    : t('dashboard.home.dailySpend.remaining', {
      amount: formatCurrency(daily.remaining, currency),
    });

  const openFormLabel = spentToday > 0
    ? t('dashboard.home.dailySpend.openFormEdit')
    : t('dashboard.home.dailySpend.openForm');

  const handleOpenForm = () => {
    setInputValue(spentToday > 0 ? amountToString(spentToday) : '');
    setErrorText('');
    setExpanded(true);
  };

  const handleCloseForm = () => {
    setExpanded(false);
    setFocused(false);
    setErrorText('');
    setInputValue(spentToday > 0 ? amountToString(spentToday) : '');
  };

  const handleQuickAdd = (increment) => {
    const current = parseAmount(inputValue) || 0;
    const next = current + increment;
    setInputValue(amountToString(next));
    setErrorText('');
  };

  const handleSave = async () => {
    const amount = parseAmount(inputValue);
    if (amount == null || amount < 0) {
      setErrorText(t('dashboard.home.dailySpend.validation'));
      return;
    }

    setSaving(true);
    setErrorText('');
    try {
      const logs = await loadDailyLogs();
      const next = upsertDailyLog(logs, today, amount, {
        cycleId: financials?.activeCycle?.id,
        confirmZero: amount === 0,
      });
      await saveDailyLogs(next);
      notifyDashboardRefresh();
      emitDashboardToast('spendingSaved');
      setFocused(false);
      setExpanded(false);
    } catch {
      setErrorText(t('dashboard.home.dailySpend.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (spentToday <= 0 && !inputValue) return;
    setSaving(true);
    setErrorText('');
    try {
      const logs = await loadDailyLogs();
      const next = upsertDailyLog(logs, today, 0);
      await saveDailyLogs(next);
      setInputValue('');
      notifyDashboardRefresh();
      setExpanded(false);
    } catch {
      setErrorText(t('dashboard.home.dailySpend.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const canClear = spentToday > 0 || (parseAmount(inputValue) || 0) > 0;

  return (
    <View>
      <SurfaceCard>
        <Text style={{ ...T.cardTitle, marginBottom: 12 }}>
          {t('dashboard.home.dailySpend.title')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, marginBottom: 4 }}>
          {formatTodayHeading(new Date(), locale)}
        </Text>
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 14 }}>
          {t('dashboard.home.dailySpend.helper')}
        </Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 12,
        }}>
          <Text style={{ ...T.caption, color: C.muted }}>
            {t('dashboard.trackerScreen.daily.title')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: paceColor, ...TABULAR_NUMS }} numberOfLines={1}>
              {formatCurrency(daily.spent, currency)}
            </Text>
            <Text style={{ fontWeight: '500', color: C.muted }}>
              {' / '}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: C.muted, ...TABULAR_NUMS }} numberOfLines={1}>
              {formatCurrency(daily.allowance, currency)}
            </Text>
          </View>
        </View>
        <Text style={{ ...T.caption, color: paceColor, marginBottom: 16, fontWeight: '600' }}>
          {paceNote}
        </Text>

        <AnimatedCollapse visible={!expanded} fallbackHeight={52}>
          <PrimaryButton
            onPress={handleOpenForm}
            accessibilityLabel={t('dashboard.home.dailySpend.openFormA11y')}
          >
            {openFormLabel}
          </PrimaryButton>
        </AnimatedCollapse>

        <AnimatedCollapse visible={expanded} fallbackHeight={FORM_COLLAPSE_FALLBACK}>
          <FormInput
            label={t('dashboard.home.dailySpend.inputLabel')}
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              setErrorText('');
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t('dashboard.home.dailySpend.placeholder')}
            numeric
            large
            currency={currency}
            errorText={errorText}
            disabled={saving}
            accessibilityLabel={t('dashboard.home.dailySpend.a11y')}
            containerStyle={{ marginBottom: 12 }}
          />

          <Text style={{ ...T.caption, color: C.muted, marginBottom: 8 }}>
            {t('dashboard.home.dailySpend.quickAdd')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {QUICK_ADD_AMOUNTS.map((amount) => (
              <QuickAddChip
                key={amount}
                label={`+${formatCurrency(amount, '')}`}
                onPress={() => handleQuickAdd(amount)}
                accessibilityLabel={t('dashboard.home.dailySpend.quickAddA11y', {
                  amount: formatCurrency(amount, currency),
                })}
              />
            ))}
          </View>

          <PrimaryButton
            onPress={handleSave}
            disabled={saving}
            accessibilityState={{ busy: saving }}
          >
            {saving ? t('dashboard.home.dailySpend.saving') : t('dashboard.home.dailySpend.save')}
          </PrimaryButton>

          <AnimatedCollapse visible={canClear} fallbackHeight={44}>
            <Pressable
              onPress={handleClear}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.home.dailySpend.clear')}
              style={({ pressed }) => ({
                marginTop: 12,
                alignSelf: 'center',
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 4,
                paddingHorizontal: 8,
              })}
            >
              <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
                {t('dashboard.home.dailySpend.clear')}
              </Text>
            </Pressable>
          </AnimatedCollapse>

          <Pressable
            onPress={handleCloseForm}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.home.dailySpend.cancel')}
            style={({ pressed }) => ({
              marginTop: 12,
              alignSelf: 'center',
              opacity: pressed ? 0.7 : 1,
              paddingVertical: 4,
              paddingHorizontal: 8,
            })}
          >
            <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
              {t('dashboard.home.dailySpend.cancel')}
            </Text>
          </Pressable>
        </AnimatedCollapse>
      </SurfaceCard>
    </View>
  );
}
