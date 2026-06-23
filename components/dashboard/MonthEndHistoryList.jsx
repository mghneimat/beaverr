import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';

const DEST_KEYS = {
  rollover: 'dashboard.monthEndHistory.rollover',
  savings: 'dashboard.monthEndHistory.savings',
  looseMoney: 'dashboard.monthEndHistory.looseMoney',
  otherGoal: 'dashboard.monthEndHistory.otherGoal',
};

export default function MonthEndHistoryList({ budget, currency }) {
  const { t } = useI18n();
  const history = [...(budget?.monthEndHistory || [])].reverse();

  if (history.length === 0) return null;

  return (
    <SurfaceCard>
      <Text style={{ ...T.cardTitle }}>{t('dashboard.monthEndHistory.title')}</Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4, marginBottom: 12 }}>
        {t('dashboard.monthEndHistory.helper')}
      </Text>
      <View style={{ gap: 12 }}>
        {history.map((entry) => (
          <View
            key={entry.period}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ ...T.helper, fontWeight: '600' }}>{entry.period}</Text>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
                {t(DEST_KEYS[entry.destination] || entry.destination)}
              </Text>
              {entry.excessToLoose ? (
                <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }}>
                  {t('dashboard.monthEndHistory.excessLoose', {
                    amount: formatCurrency(entry.excessToLoose, currency),
                  })}
                </Text>
              ) : null}
            </View>
            <Text style={{ ...T.helper, fontWeight: '600', ...tabularNums }}>
              {formatCurrency(entry.amount, currency)}
            </Text>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
