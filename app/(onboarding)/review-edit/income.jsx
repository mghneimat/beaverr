import { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { loadDashboardBundle } from '../../../lib/dashboardData';
import {
  findIncomePanelByKey,
  INCOME_PRIMARY_KEY,
  INCOME_OTHER_KEY,
} from '../../../lib/incomePanels';
import { useDashboardFrequency } from '../../../lib/useDashboardFrequency';
import QuestionScreen from '../../../components/onboarding/QuestionScreen';
import IncomeCategoryPanel from '../../../components/dashboard/IncomeCategoryPanel';
import { getCurrencySymbol } from '../../../lib/currency';
import { C, T } from '../../../constants/onboarding-theme';

const DEFAULT_RETURN = '/(onboarding)/review';

export default function ReviewEditIncomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams();
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab || INCOME_PRIMARY_KEY;
  const sub = Array.isArray(params.sub) ? params.sub[0] : params.sub || 'user';
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
    if (!bundle) return null;
    const inc = bundle.financials.income || {};
    const household = bundle.financials.sections?.household || null;
    const primaryTab = tab === INCOME_OTHER_KEY ? 'other' : 'primary';
    return findIncomePanelByKey(inc, household, t, primaryTab, sub);
  }, [bundle, tab, sub, t]);

  const handleDone = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace(returnTo);
  };

  if (loading || !bundle) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...T.helper }}>{t('common.loading')}</Text>
      </View>
    );
  }

  const currency = getCurrencySymbol(bundle.financials.currencyCode);
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  return (
    <QuestionScreen
      chapter={t('onboarding.review.chapter')}
      title={panel?.label || t('dashboard.income')}
      helper={t('onboarding.review.review.editSubsectionHelper')}
      onContinue={handleDone}
      onBack={handleDone}
      continueLabel={t('common.done')}
      showExitActions={false}
      progress={99}
    >
      {panel ? (
        <IncomeCategoryPanel
          variant="detail"
          categoryLabel={panel.label}
          lineItems={panel.lineItems}
          currency={currency}
          currencyCode={bundle.financials.currencyCode}
          t={t}
          frequency={frequency}
          daysInMonth={daysInMonth}
          initialEditingRowId={editRow || undefined}
          emptyLabel={t('dashboard.incomeScreen.subtabEmpty', { type: panel.label })}
        />
      ) : (
        <Text style={{ ...T.helper, color: C.muted }}>{t('onboarding.review.review.editSubsectionEmpty')}</Text>
      )}
    </QuestionScreen>
  );
}
