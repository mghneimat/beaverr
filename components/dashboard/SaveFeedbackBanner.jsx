import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { getCurrencySymbol } from '../../lib/currency';
import { subscribeSaveFeedback, clearSaveFeedback } from '../../lib/dashboardSaveFeedback';
import { C, R, T } from '../../constants/onboarding-theme';

const DISMISS_MS = 6000;

function formatDelta(delta, currency) {
  if (!delta || Math.abs(delta) < 0.5) return null;
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${formatCurrency(Math.abs(delta), currency)}`;
}

export default function SaveFeedbackBanner() {
  const { t } = useI18n();
  const [payload, setPayload] = useState(null);

  useEffect(() => subscribeSaveFeedback((next) => {
    setPayload(next);
  }), []);

  useEffect(() => {
    if (!payload) return undefined;
    const timer = setTimeout(() => {
      setPayload(null);
      clearSaveFeedback();
    }, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [payload]);

  if (!payload) return null;

  const currency = getCurrencySymbol(payload.currencyCode);
  const amount = formatCurrency(payload.after, currency);
  const delta = formatDelta(payload.delta, currency);
  const message = delta
    ? t('dashboard.saveFeedback.updated', { amount, delta })
    : t('dashboard.saveFeedback.unchanged', { amount });

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: R.card,
        borderWidth: 1,
        borderColor: C.positive,
        backgroundColor: '#ECFDF5',
      }}
    >
      <Text style={{ ...T.body, color: C.primary, fontWeight: '500' }}>{message}</Text>
    </View>
  );
}
