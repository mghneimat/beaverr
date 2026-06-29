import { useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { loadDashboardBundle } from '../../../lib/dashboardData';
import { findExpensePanelByKey } from '../../../lib/expensePanels';
import { useDashboardFrequency } from '../../../lib/useDashboardFrequency';
import QuestionScreen from '../../../components/onboarding/QuestionScreen';
import ExpensesCategoryPanel from '../../../components/dashboard/ExpensesCategoryPanel';
import { getCurrencySymbol } from '../../../lib/currency';
import { C, T } from '../../../constants/onboarding-theme';
import SectionCardsSkeleton from '../../../components/ui/SectionCardsSkeleton';
import { useState } from 'react';

const DEFAULT_RETURN = '/(onboarding)/review';

export default function ReviewEditExpensesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams();
  const primary = Array.isArray(params.primary) ? params.primary[0] : params.primary || 'recurring';
  const sub = Array.isArray(params.sub) ? params.sub[0] : params.sub || '';
  const editRow = Array.isArray(params.editRow) ? params.editRow[0] : params.editRow || '';
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo || DEFAULT_RETURN;

  const { frequency } = useDashboardFrequency('monthly');
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadDashboardBundle(t);
      setBundle(data);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const panel = useMemo(() => {
    if (!bundle || !sub) return null;
    const { financials } = bundle;
    const sections = financials.sections || {};
    const household = sections.household || null;
    return findExpensePanelByKey(
      sections,
      financials.debts || [],
      household,
      t,
      primary === 'fixed' ? 'fixed' : 'recurring',
      sub,
    );
  }, [bundle, sub, primary, t]);

  const handleDone = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace(returnTo);
  };

  if (loading || !bundle) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: 'center' }}>
        <SectionCardsSkeleton cards={1} accessibilityLabel={t('common.loading')} />
      </View>
    );
  }

  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  return (
    <QuestionScreen
      chapter={t('onboarding.review.chapter')}
      title={panel?.label || t('dashboard.expenses')}
      helper={t('onboarding.review.review.editSubsectionHelper')}
      onContinue={handleDone}
      onBack={handleDone}
      continueLabel={t('common.done')}
      showExitActions={false}
      progress={99}
    >
      {panel ? (
        <ExpensesCategoryPanel
          variant="detail"
          categoryLabel={panel.label}
          categoryKey={panel.key}
          lineItems={panel.lineItems}
          sectionId={panel.sectionId}
          currency={currency}
          currencyCode={bundle.financials.currencyCode}
          t={t}
          frequency={frequency}
          daysInMonth={daysInMonth}
          initialEditingRowId={editRow || undefined}
          emptyLabel={t('dashboard.expensesScreen.subtabEmpty', { type: panel.label })}
        />
      ) : (
        <Text style={{ ...T.helper, color: C.muted }}>{t('onboarding.review.review.editSubsectionEmpty')}</Text>
      )}
    </QuestionScreen>
  );
}
