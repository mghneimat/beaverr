import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../lib/finance';
import { formatSharePct } from '../../lib/formatSharePct';
import { navigateFromDashboardWithFocus } from '../../lib/screenTransition';
import { hasSavingsMonthEndRolloverHint } from '../../lib/savingsProjection';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import { useBreakdownTableColumns, useDashboardLayout } from '../../lib/dashboardLayout';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import TextLinkButton from '../ui/TextLinkButton';
import TableHorizontalScroll, { breakdownPillTableMinWidth } from './TableHorizontalScroll';
import { InfoIcon } from '../app/AppNavIcons';
import {
  BreakdownPillColumnHeaders,
  BreakdownPillRow,
} from './BreakdownTablePrimitives';

const INFO_SIZE = 16;
const INFO_HIT = 28;

const INFLOW_KEYS = {
  budgetShift: 'dashboard.savingsScreen.inflow.budgetShift',
  goalReserve: 'dashboard.savingsScreen.inflow.goalReserve',
  ongoingGoal: 'dashboard.savingsScreen.inflow.ongoingGoal',
};

const INFLOW_SECTION_KEYS = {
  budgetShift: 'primary',
  goalReserve: 'partner',
  ongoingGoal: 'other_income',
};

function SavingsMonthEndRolloverBanner() {
  const { t } = useI18n();
  const router = useRouter();

  const openRolloverStrategy = () => {
    navigateFromDashboardWithFocus(router, 'budget', null, 'rollover');
  };

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={t('dashboard.savingsScreen.monthlyPlanRolloverBanner.a11y')}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
        backgroundColor: C.surfaceTint,
        borderRadius: R.input,
        borderWidth: 1,
        borderColor: C.border,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }}
    >
      <View style={{
        width: INFO_HIT,
        height: INFO_HIT,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <InfoIcon color={C.muted} size={INFO_SIZE} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{
            ...T.caption,
            color: C.text,
            lineHeight: 18,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {t('dashboard.savingsScreen.monthlyPlanRolloverBanner.title')}
        </Text>
        <Text style={{ ...T.caption, color: C.muted, lineHeight: 16 }}>
          {t('dashboard.savingsScreen.monthlyPlanRolloverBanner.body')}
        </Text>
      </View>
      <TextLinkButton
        compact
        label={t('dashboard.savingsScreen.monthlyPlanRolloverBanner.link')}
        onPress={openRolloverStrategy}
        accessibilityLabel={t('dashboard.savingsScreen.monthlyPlanRolloverBanner.linkA11y')}
      />
    </View>
  );
}

/**
 * Planned monthly savings — hero total + dashboard pill breakdown table.
 */
export default function SavingsMonthlyPlanCard({ monthlyInflow, inflows, budget, currency }) {
  const { t } = useI18n();
  const { isPhone, isNarrow } = useDashboardLayout();
  const { amountColMinW, shareColMinW } = useBreakdownTableColumns();
  const compact = isPhone || isNarrow;
  const amountFontSize = compact ? 28 : 32;
  const amountLineHeight = compact ? 34 : 38;
  const shareBase = monthlyInflow > 0 ? monthlyInflow : 1;
  const fixedInflows = inflows.filter((row) => row.amount > 0);
  const showRolloverBanner = hasSavingsMonthEndRolloverHint(budget);

  return (
    <SurfaceCard>
      <InCardSectionHeader title={t('dashboard.savingsScreen.monthlyPlan')} />
      <Text style={{
        fontSize: amountFontSize,
        lineHeight: amountLineHeight,
        fontWeight: '700',
        color: C.text,
        ...tabularNums,
      }} numberOfLines={1}>
        {formatCurrency(monthlyInflow, currency)}
      </Text>
      <Text style={{
        ...T.caption,
        color: C.muted,
        marginTop: 6,
        marginBottom: fixedInflows.length > 0 ? 16 : 0,
      }}>
        {t('dashboard.savingsScreen.monthlyPlanHelper')}
      </Text>

      {fixedInflows.length > 0 ? (
        <View style={{ gap: 8, overflow: 'visible', width: '100%', alignSelf: 'stretch' }}>
          <TableHorizontalScroll minWidth={breakdownPillTableMinWidth(amountColMinW, shareColMinW)}>
            <BreakdownPillColumnHeaders
              nameLabel={t('dashboard.incomeScreen.table.source')}
              amountLabel={t('common.monthly')}
              shareLabel={t('dashboard.incomeScreen.table.share')}
              amountColMinW={amountColMinW}
              shareColMinW={shareColMinW}
              scrollLayout={isPhone}
            />
            {fixedInflows.map((row, idx) => (
              <BreakdownPillRow
                key={row.key}
                sectionKey={INFLOW_SECTION_KEYS[row.key] || 'other'}
                scope="income"
                label={t(INFLOW_KEYS[row.key] || row.key)}
                amount={formatCurrency(row.amount, currency)}
                share={formatSharePct(row.amount, shareBase)}
                index={idx}
                amountColMinW={amountColMinW}
                shareColMinW={shareColMinW}
                scrollLayout={isPhone}
              />
            ))}
          </TableHorizontalScroll>
        </View>
      ) : (
        !showRolloverBanner ? (
          <Text style={{ ...T.helper, color: C.muted, marginTop: 12 }}>
            {t('dashboard.savingsScreen.noInflows')}
          </Text>
        ) : null
      )}

      {showRolloverBanner ? <SavingsMonthEndRolloverBanner /> : null}
    </SurfaceCard>
  );
}
