import {
  isDashboardUnlocked,
  isQuestionnaireComplete,
  isQuickSetupIncomplete,
  isTabLockedForQuickSetup,
  shouldShowQuestionnaireBanners,
  shouldShowQuestionnaireEstimateWarning,
  shouldShowQuestionnaireContinueSoft,
  shouldShowRetakeQuestionnaire,
  shouldShowContinueQuestionnaire,
  shouldShowStartQuestionnaire,
  getSavedResumeRoute,
  getValidSavedResumeRoute,
  normalizeResumeRoute,
  resolveBootResumeRoute,
  getQuestionnaireStartRoute,
  getQuestionnaireNavigationRoute,
  getWelcomeContinueRoute,
  getQuestionnairePercent,
  repairOnboardingState,
  QUICK_LOCKED_TAB_ROUTES,
  QUICK_RESUME_ROUTE,
  FULL_QUESTIONNAIRE_START_ROUTE,
} from '../../lib/onboardingProgress';

describe('onboardingProgress', () => {
  test('dashboard unlocked after quick setup or full complete', () => {
    expect(isDashboardUnlocked({ dashboardUnlocked: true, completed: false })).toBe(true);
    expect(isDashboardUnlocked({ completed: true })).toBe(true);
    expect(isDashboardUnlocked({ completed: false })).toBe(false);
  });

  test('quick setup locks expense tabs only', () => {
    const state = { setupMode: 'quick', completed: false, dashboardUnlocked: true };
    expect(isTabLockedForQuickSetup(state, 'costs')).toBe(true);
    expect(isTabLockedForQuickSetup(state, 'budget')).toBe(true);
    expect(isTabLockedForQuickSetup(state, 'tracker')).toBe(false);
    expect(isTabLockedForQuickSetup(state, 'income')).toBe(false);
    expect(isTabLockedForQuickSetup(state, 'dashboard')).toBe(false);
  });

  test('banners show when dashboard unlocked but questionnaire incomplete', () => {
    expect(shouldShowQuestionnaireBanners({
      dashboardUnlocked: true,
      setupMode: 'quick',
      completed: false,
    })).toBe(true);
    expect(shouldShowQuestionnaireBanners({ completed: true, dashboardUnlocked: true })).toBe(false);
    expect(shouldShowQuestionnaireBanners({
      dashboardUnlocked: true,
      completed: false,
      questionnaireEverCompleted: true,
    })).toBe(false);
    expect(shouldShowQuestionnaireContinueSoft({
      dashboardUnlocked: true,
      completed: false,
      questionnaireEverCompleted: true,
    })).toBe(true);
    expect(shouldShowQuestionnaireEstimateWarning({
      dashboardUnlocked: true,
      completed: false,
      questionnaireEverCompleted: true,
    })).toBe(false);
  });

  test('questionnaire percent caps below 100 until complete', () => {
    expect(getQuestionnairePercent({ percentComplete: 25, completed: false })).toBe(25);
    expect(getQuestionnairePercent({ percentComplete: 25, completed: true })).toBe(100);
  });

  test('isQuickSetupIncomplete', () => {
    expect(isQuickSetupIncomplete({ dashboardUnlocked: true, completed: false })).toBe(true);
    expect(isQuickSetupIncomplete({ dashboardUnlocked: false, completed: false })).toBe(false);
    expect(isQuickSetupIncomplete({ dashboardUnlocked: true, completed: true })).toBe(false);
  });

  test('locked tab list includes reminders but not tracker', () => {
    expect(QUICK_LOCKED_TAB_ROUTES).toContain('alerts');
    expect(QUICK_LOCKED_TAB_ROUTES).not.toContain('tracker');
  });

  test('retake shows only after prior full submit when questionnaire complete', () => {
    expect(shouldShowRetakeQuestionnaire({
      questionnaireEverCompleted: true,
      completed: true,
      dashboardUnlocked: true,
    })).toBe(true);
    expect(shouldShowRetakeQuestionnaire({
      completed: true,
      dashboardUnlocked: true,
    })).toBe(true);
    expect(shouldShowRetakeQuestionnaire({
      questionnaireEverCompleted: true,
      completed: false,
      dashboardUnlocked: true,
    })).toBe(false);
    expect(shouldShowRetakeQuestionnaire({
      questionnaireEverCompleted: false,
      completed: false,
      dashboardUnlocked: true,
    })).toBe(false);
  });

  test('repairOnboardingState restores flags lost by full-state overwrite', () => {
    expect(repairOnboardingState({
      completed: false,
      currentStep: 'subscriptions',
      percentComplete: 85,
    })).toEqual({
      completed: false,
      currentStep: 'subscriptions',
      percentComplete: 85,
      dashboardUnlocked: true,
      questionnaireComplete: false,
      setupMode: 'full',
    });
    expect(repairOnboardingState({
      completed: false,
      currentStep: 'quick-housing',
      percentComplete: 8,
      dashboardUnlocked: true,
    })).toMatchObject({
      setupMode: 'quick',
    });
    expect(repairOnboardingState({
      completed: true,
      dashboardUnlocked: true,
    })).toEqual({
      completed: true,
      dashboardUnlocked: true,
      questionnaireEverCompleted: true,
      questionnaireComplete: true,
      setupMode: 'full',
    });
  });

  test('repairOnboardingState migrates legacy onboarding budget resume route', () => {
    expect(repairOnboardingState({
      completed: false,
      dashboardUnlocked: true,
      resumeRoute: '/(onboarding)/budget',
    }).resumeRoute).toBe('/(onboarding)/budget-setup');
  });

  test('repairOnboardingState migrates deleted quick-setup resume route and step', () => {
    expect(repairOnboardingState({
      completed: false,
      dashboardUnlocked: true,
      setupMode: 'quick',
      currentStep: 'quick-setup',
      resumeRoute: '/(onboarding)/quick-setup',
      navHistory: [{ route: '/(onboarding)/quick-setup' }],
    })).toEqual({
      completed: false,
      dashboardUnlocked: true,
      questionnaireComplete: false,
      setupMode: 'quick',
      currentStep: 'quick-housing',
      resumeRoute: '/(onboarding)/quick-housing',
      navHistory: [{ route: '/(onboarding)/quick-housing' }],
    });
  });

  test('normalizeResumeRoute maps legacy aliases and rejects unknown routes', () => {
    expect(normalizeResumeRoute('/(onboarding)/quick-setup')).toBe('/(onboarding)/quick-housing');
    expect(normalizeResumeRoute('/(onboarding)/income')).toBe('/(onboarding)/income');
    expect(normalizeResumeRoute('/(onboarding)/income?step=savings')).toBe('/(onboarding)/income?step=savings');
    expect(normalizeResumeRoute('/(onboarding)/residence-permit?subject=partner&childIndex=1'))
      .toBe('/(onboarding)/residence-permit?subject=partner&childIndex=1');
    expect(normalizeResumeRoute('/(onboarding)/missing-screen')).toBeNull();
  });

  test('resolveBootResumeRoute returns null for unknown saved routes', () => {
    expect(resolveBootResumeRoute({
      resumeRoute: '/(onboarding)/quick-setup',
    })).toBe('/(onboarding)/quick-housing');
    expect(resolveBootResumeRoute({
      resumeRoute: '/(onboarding)/deleted-route',
    })).toBeNull();
  });

  test('continue vs start questionnaire tools depend on saved resume route', () => {
    const inProgress = {
      dashboardUnlocked: true,
      completed: false,
      resumeRoute: '/(onboarding)/income',
    };
    const afterDiscard = {
      setupMode: 'quick',
      dashboardUnlocked: true,
      completed: false,
      resumeRoute: null,
      percentComplete: 25,
    };

    expect(shouldShowContinueQuestionnaire(inProgress)).toBe(true);
    expect(shouldShowStartQuestionnaire(inProgress)).toBe(false);
    expect(shouldShowContinueQuestionnaire(afterDiscard)).toBe(false);
    expect(shouldShowStartQuestionnaire(afterDiscard)).toBe(true);
    expect(getSavedResumeRoute(afterDiscard)).toBeNull();
    expect(getQuestionnaireStartRoute(afterDiscard)).toBe('/(onboarding)/setup-mode');
    expect(getQuestionnaireNavigationRoute(afterDiscard)).toBe(QUICK_RESUME_ROUTE);
    expect(getQuestionnaireNavigationRoute({
      dashboardUnlocked: true,
      completed: false,
      questionnaireEverCompleted: true,
      resumeRoute: null,
    })).toBe(QUICK_RESUME_ROUTE);
  });

  test('welcome continue routes incomplete quick-setup users into full questionnaire', () => {
    const afterQuickSetup = {
      setupMode: 'quick',
      dashboardUnlocked: true,
      completed: false,
      resumeRoute: null,
      percentComplete: 26,
    };

    expect(getWelcomeContinueRoute(afterQuickSetup)).toBe(QUICK_RESUME_ROUTE);
  });

  test('welcome continue resumes saved progress when dashboard unlocked', () => {
    const inProgress = {
      dashboardUnlocked: true,
      completed: false,
      resumeRoute: '/(onboarding)/housing',
      setupMode: 'full',
    };

    expect(getWelcomeContinueRoute(inProgress)).toBe('/(onboarding)/housing');
  });

  test('welcome continue returns dashboard only when questionnaire complete', () => {
    expect(getWelcomeContinueRoute({
      dashboardUnlocked: true,
      completed: true,
    })).toBe('/(app)/dashboard');
  });

  test('welcome continue starts full questionnaire for unlocked full-mode users without resume', () => {
    expect(getWelcomeContinueRoute({
      dashboardUnlocked: true,
      completed: false,
      setupMode: 'full',
      resumeRoute: null,
    })).toBe(FULL_QUESTIONNAIRE_START_ROUTE);
  });

  test('getSectionProgress increases within income section', () => {
    const { getSectionProgress } = require('../../lib/onboardingProgress');
    const splash = getSectionProgress({ routeName: 'splash-income' });
    const first = getSectionProgress({ routeName: 'income', step: 'yourIncome' });
    const last = getSectionProgress({ routeName: 'income', step: 'savings' });
    expect(first).toBeGreaterThanOrEqual(splash);
    expect(last).toBeGreaterThanOrEqual(first);
  });

  test('getSectionProgress merges stored percent upward', () => {
    const { getSectionProgress } = require('../../lib/onboardingProgress');
    expect(getSectionProgress({
      routeName: 'splash-household',
      storedPercent: 50,
    })).toBeGreaterThanOrEqual(50);
  });
});
