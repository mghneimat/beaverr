import { useState, useCallback, useRef } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import { patchOnboardingState } from '../../lib/onboardingProgress';
import { navigateBack, navigateForward } from '../../lib/onboardingNavigation';
import { notifyDashboardRefresh } from '../../lib/dashboardRefresh';
import { committedMonthlyLoad } from '../../lib/finance';
import { loadHouseholdFinancials } from '../../lib/householdBudget';
import { snapshotCommittedBaseline } from '../../lib/costReductionProgress';
import QuestionScreen from '../../components/onboarding/QuestionScreen';
import ConfirmedAmicoIllustration from '../../components/onboarding/ConfirmedAmicoIllustration';
import { useOnboardingLayout } from '../../lib/onboardingLayout';
import ReviewSummaryBar from '../../components/onboarding/review/ReviewSummaryBar';
import ReviewAlertBanner from '../../components/onboarding/review/ReviewAlertBanner';
import ReviewSectionCard from '../../components/onboarding/review/ReviewSectionCard';
import { C, T } from '../../constants/onboarding-theme';
import SectionCardsSkeleton from '../../components/ui/SectionCardsSkeleton';
import {
  buildReviewFinancials,
  buildReviewAlerts,
  buildSectionSubtitle,
  buildSectionRows,
  buildChildrenBlocks,
  buildDebtBlocks,
  buildPetBlocks,
  filterVisibleReviewSections,
  sectionHasWarning,
} from '../../lib/reviewOnboardingData';
import { clearReviewUiState } from '../../lib/reviewUiState';

const STORAGE_KEYS = [
  'beaverr_household', 'beaverr_location', 'beaverr_occupation',
  'beaverr_income', 'beaverr_housing', 'beaverr_transport',
  'beaverr_health', 'beaverr_children_costs', 'beaverr_pets',
  'beaverr_subscriptions', 'beaverr_other_costs', 'beaverr_debts',
  'beaverr_budget',
];

async function loadAllReviewData() {
  const data = {};
  for (const key of STORAGE_KEYS) {
    data[key] = await getData(key);
  }
  return data;
}

export default function ReviewScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();

  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const reload = useCallback(async () => {
    if (!hasLoadedRef.current) setLoading(true);
    const data = await loadAllReviewData();
    setAllData(data);
    hasLoadedRef.current = true;
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleBack = () => {
    clearReviewUiState();
    navigateBack();
  };

  const handleComplete = async () => {
    clearReviewUiState();
    const financials = await loadHouseholdFinancials(t);
    await snapshotCommittedBaseline(committedMonthlyLoad(financials));

    await patchOnboardingState({
      completed: true,
      dashboardUnlocked: true,
      questionnaireComplete: true,
      questionnaireEverCompleted: true,
      currentStep: 'review',
      percentComplete: 100,
      resumeRoute: null,
      navHistory: [],
    });

    router.replace('/(app)/dashboard');
    notifyDashboardRefresh();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: 'center' }}>
        <SectionCardsSkeleton cards={3} accessibilityLabel={t('common.loading')} />
      </View>
    );
  }

  const financials = buildReviewFinancials(allData, t);
  const alerts = buildReviewAlerts(allData, financials, t);
  const ctx = { allData, financials, t };
  const sections = filterVisibleReviewSections(allData, ctx);

  return (
    <QuestionScreen
      illustration={(
        <ConfirmedAmicoIllustration
          width={layout.illustrationWidth}
          a11yKey="onboarding.review.formIllustrationA11y"
        />
      )}
      chapter={t('onboarding.review.chapter')}
      title={t('onboarding.review.review.title')}
      helper={t('onboarding.review.review.helper')}
      onContinue={handleComplete}
      onBack={handleBack}
      continueDisabled={false}
      continueLabel={t('onboarding.review.review.cta')}
      animationKey="review"
      resumeRoute="/(onboarding)/review"
      exitPatch={{ currentStep: 'review', percentComplete: 99 }}
    >
      <View>
        {alerts.map((alert) => (
          <ReviewAlertBanner
            key={alert.id}
            message={alert.message}
            editLabel={alert.editLabel}
            editRoute={alert.editRoute}
          />
        ))}

        <ReviewSummaryBar
          totalIncome={financials.totalIncome}
          totalExpenses={financials.totalExpenses}
          monthlyBalance={financials.monthlyBalance}
          currency={financials.currency}
          t={t}
        />

        {sections.map((section) => {
          const subtitle = buildSectionSubtitle(section.id, ctx);
          const warning = sectionHasWarning(section.id, financials);
          const rows = section.id === 'childrenCosts' ? [] : buildSectionRows(section.id, ctx);
          const childBlocks = section.id === 'childrenCosts' ? buildChildrenBlocks(ctx) : [];
          const debtBlocks = section.id === 'debts' ? buildDebtBlocks(ctx) : [];
          const petBlocks = section.id === 'pets' ? buildPetBlocks(ctx) : [];

          return (
            <ReviewSectionCard
              key={section.id}
              title={t(section.titleKey)}
              subtitle={subtitle}
              sectionId={section.id}
              sectionKey={section.sectionKey}
              scope={section.scope}
              iconEmoji={section.iconEmoji}
              warning={warning}
              defaultOpen={false}
              rows={rows}
              childBlocks={childBlocks}
              debtBlocks={debtBlocks}
              petBlocks={petBlocks}
            />
          );
        })}
      </View>
    </QuestionScreen>
  );
}
