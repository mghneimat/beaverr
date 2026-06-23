import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../../lib/i18n';
import { getClosedCycles } from '../../../lib/budgetCycle';
import { C, T, tabularNums } from '../../../constants/onboarding-theme';
import SurfaceCard from '../../ui/SurfaceCard';
import { formatCurrency } from '../../../lib/finance';

function formatRange(cycle, locale) {
  const tag = locale === 'cs' ? 'cs-CZ' : 'en-GB';
  const start = new Date(
    Number(cycle.startedAt.slice(0, 4)),
    Number(cycle.startedAt.slice(5, 7)) - 1,
    Number(cycle.startedAt.slice(8, 10)),
  );
  const end = cycle.closedAt
    ? new Date(
      Number(cycle.closedAt.slice(0, 4)),
      Number(cycle.closedAt.slice(5, 7)) - 1,
      Number(cycle.closedAt.slice(8, 10)),
    )
    : start;
  const fmt = (d) => d.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

const amountStyle = { ...T.helper, fontWeight: '600', ...tabularNums };
const captionStyle = { ...T.caption, ...tabularNums };

export default function CycleHistoryList({ cycleStore, currency, showEmpty = false }) {
  const { t, locale } = useI18n();
  const closed = getClosedCycles(cycleStore || { cycles: [], activeCycleId: null });

  if (closed.length === 0) {
    if (!showEmpty) return null;
    return (
      <SurfaceCard>
        <Text style={{ ...T.cardTitle }}>{t('dashboard.cycles.history.title')}</Text>
        <Text style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
          {t('dashboard.cycles.history.empty')}
        </Text>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard>
      <Text style={{ ...T.cardTitle }}>{t('dashboard.cycles.history.title')}</Text>
      <Text style={{ ...T.caption, color: C.muted, marginTop: 4, marginBottom: 12 }}>
        {t('dashboard.cycles.history.helper')}
      </Text>
      <View style={{ gap: 12 }}>
        {closed.map((cycle) => (
          <View
            key={cycle.id}
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
              <Text style={{ ...T.helper, fontWeight: '600' }}>{formatRange(cycle, locale)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2, gap: 4 }}>
                <Text style={{ ...T.caption, color: C.muted }}>
                  {t('dashboard.cycles.history.spent')}:
                </Text>
                <Text style={{ ...captionStyle, color: C.muted }}>
                  {formatCurrency(cycle.spentTotal, currency)}
                </Text>
              </View>
              {cycle.surplus > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2, gap: 4 }}>
                  <Text style={{ ...T.caption, color: C.positive }}>
                    {t('dashboard.cycles.history.surplus')}:
                  </Text>
                  <Text style={{ ...captionStyle, color: C.positive }}>
                    {formatCurrency(cycle.surplus, currency)}
                  </Text>
                </View>
              ) : null}
              {cycle.deficit > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 2, gap: 4 }}>
                  <Text style={{ ...T.caption, color: C.danger }}>
                    {t('dashboard.cycles.history.deficit')}:
                  </Text>
                  <Text style={{ ...captionStyle, color: C.danger }}>
                    {formatCurrency(cycle.deficit, currency)}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={{ ...amountStyle, color: C.primary }}>
              {formatCurrency(cycle.budgetAmount, currency)}
            </Text>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}
