import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { navigateBackToAppTab } from '../../lib/screenTransition';
import { getCurrencySymbol } from '../../lib/currency';
import { computeCostReduction } from '../../lib/costReductionProgress';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import { formatCurrency } from '../../lib/finance';
import InCardSectionHeader from './InCardSectionHeader';
import TabSectionStack from './TabSectionStack';
import TabBackLink from './TabBackLink';
import PrimaryButton from '../ui/PrimaryButton';

export default function ReduceCostsContent({ bundle }) {
  const { t } = useI18n();
  const router = useRouter();
  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const reduction = computeCostReduction(bundle.financials);
  const goToGoals = () => navigateBackToAppTab(router, 'goals');
  return (
    <TabSectionStack>
      <TabBackLink route="goals" labelKey="dashboard.reduceCostsScreen.back" />
      <Text
        accessibilityRole="header"
        style={{ ...T.questionTitle, fontSize: 28, marginBottom: 0 }}
      >
        {t('dashboard.reduceCostsScreen.title')}
      </Text>      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.reduceCostsScreen.baselineTitle')} />
        {reduction.hasBaseline ? (
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, ...tabularNums }}>
            {formatCurrency(reduction.baseline, currency)}
          </Text>
        ) : (
          <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, ...tabularNums }}>
            {t('dashboard.reduceCostsScreen.noBaseline')}
          </Text>
        )}
        <Text style={{ ...T.helper, marginTop: 8 }}>
          {t('dashboard.reduceCostsScreen.baselineHelper')}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.reduceCostsScreen.currentTitle')} />
        <Text style={{ fontSize: 28, fontWeight: '700', color: C.primary, ...tabularNums }}>
          {formatCurrency(reduction.current, currency)}
        </Text>
      </SurfaceCard>

      <SurfaceCard>
        <InCardSectionHeader title={t('dashboard.reduceCostsScreen.savedTitle')} />
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: reduction.reduced > 0 ? C.positive : C.primary,
            ...tabularNums,
          }}
        >
          {formatCurrency(reduction.reduced, currency)}
        </Text>
        <Text style={{ ...T.helper, marginTop: 8 }}>
          {t('dashboard.reduceCostsScreen.placeholder')}
        </Text>
      </SurfaceCard>

      <View>
        <PrimaryButton onPress={goToGoals}>          {t('dashboard.reduceCostsScreen.back')}
        </PrimaryButton>
      </View>
    </TabSectionStack>
  );
}
