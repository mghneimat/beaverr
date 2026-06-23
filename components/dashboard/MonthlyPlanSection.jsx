import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import HouseholdLedgerStrip from './HouseholdLedgerStrip';

/** Dashboard top block — monthly plan title + ledger cascade. */
export default function MonthlyPlanSection({ financials, currency, insights }) {
  const { t } = useI18n();

  return (
    <SurfaceCard style={{ marginBottom: 20 }}>
      <InCardSectionHeader title={t('dashboard.home.monthlyPlan.title')} />
      <Text style={{ ...T.helper, color: C.muted, marginBottom: 4 }}>
        {t('dashboard.home.monthlyPlan.helper')}
      </Text>
      <View style={{
        marginTop: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.tableRowBorder,
      }}>
        <HouseholdLedgerStrip financials={financials} currency={currency} insights={insights} />
      </View>
    </SurfaceCard>
  );
}
