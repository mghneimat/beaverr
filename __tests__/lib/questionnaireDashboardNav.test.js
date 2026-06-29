import {
  resolveHouseholdReturnPoint,
} from '../../lib/householdOnboardingSave';
import {
  resolveOccupationReturnPoint,
} from '../../lib/occupationOnboardingSave';
import {
  resolveStartQuestionnaireRoute,
  resolveContinueQuestionnaireRoute,
} from '../../lib/questionnaireDashboardNav';

const mockGetData = jest.fn();
const mockSetData = jest.fn();

jest.mock('../../lib/storage', () => ({
  getData: (...args) => mockGetData(...args),
  setData: (...args) => mockSetData(...args),
}));

jest.mock('../../lib/onboardingProgress', () => ({
  FULL_QUESTIONNAIRE_START_ROUTE: '/(onboarding)/splash-household',
  QUESTIONNAIRE_WELCOME_ROUTE: '/(onboarding)/welcome',
  QUESTIONNAIRE_SETUP_MODE_ROUTE: '/(onboarding)/setup-mode',
  getOnboardingState: jest.fn(),
  getValidSavedResumeRoute: jest.fn(),
  isQuestionnaireComplete: jest.fn(),
  patchOnboardingState: jest.fn(),
}));

jest.mock('../../lib/onboardingNavigation', () => ({
  resetNavHistory: jest.fn(),
  restoreNavHistoryForResume: jest.fn(),
}));

jest.mock('../../lib/dashboardRefresh', () => ({
  notifyDashboardRefresh: jest.fn(),
}));

jest.mock('../../lib/cloud/syncHousehold', () => ({
  setHydratingFromCloud: jest.fn(),
}));

jest.mock('../../lib/onboardingStepRegistry', () => ({
  ONBOARDING_STEP_REGISTRY: {
    household: {
      routeName: 'household',
      storageKey: 'beaverr_household',
      stepField: 'householdOnboardingStep',
    },
  },
}));

jest.mock('../../lib/onboardingExit', () => ({
  clearQuestionnaireData: jest.fn(),
  snapshotQuestionnaireForRetake: jest.fn(),
}));

const {
  getOnboardingState,
  getValidSavedResumeRoute,
  isQuestionnaireComplete,
  patchOnboardingState,
} = require('../../lib/onboardingProgress');
const { resetNavHistory, restoreNavHistoryForResume } = require('../../lib/onboardingNavigation');
const {
  clearQuestionnaireData,
  snapshotQuestionnaireForRetake,
} = require('../../lib/onboardingExit');

describe('section resume return points', () => {
  test('household resume uses explicit step only — not quick-setup prefilled data', () => {
    expect(resolveHouseholdReturnPoint({
      type: 'partner',
      partnerName: 'Alex',
      hasChildren: false,
    })).toEqual({ step: 'type', childIndex: 0 });

    expect(resolveHouseholdReturnPoint({
      type: 'partner',
      partnerName: 'Alex',
      householdOnboardingStep: 'children',
    })).toEqual({ step: 'children', childIndex: 0 });
  });

  test('occupation resume uses explicit step only', () => {
    expect(resolveOccupationReturnPoint(
      { user: { status: 'employed' } },
      { type: 'partner', partnerName: 'Alex' },
    )).toEqual({ step: 'user' });

    expect(resolveOccupationReturnPoint(
      { occupationOnboardingStep: 'partner' },
      { type: 'partner', partnerName: 'Alex' },
    )).toEqual({ step: 'partner' });
  });
});

describe('resolveStartQuestionnaireRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockResolvedValue({
      householdOnboardingStep: 'children',
      householdOnboardingChildIndex: 1,
    });
    mockSetData.mockResolvedValue(undefined);
    patchOnboardingState.mockResolvedValue({});
    resetNavHistory.mockResolvedValue(undefined);
  });

  test('clears data and routes to setup-mode for a fresh start', async () => {
    getOnboardingState.mockResolvedValue({ dashboardUnlocked: true });
    isQuestionnaireComplete.mockReturnValue(false);

    const route = await resolveStartQuestionnaireRoute();

    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', expect.objectContaining({
      householdOnboardingStep: undefined,
      householdOnboardingChildIndex: undefined,
    }));
    expect(clearQuestionnaireData).toHaveBeenCalled();
    expect(snapshotQuestionnaireForRetake).not.toHaveBeenCalled();
    expect(patchOnboardingState).toHaveBeenCalledWith(expect.objectContaining({
      setupMode: null,
      currentStep: 'setup-mode',
      resumeRoute: null,
      navHistory: [],
      questionnaireEverCompleted: false,
      questionnaireRetakeInProgress: false,
    }));
    expect(route).toBe('/(onboarding)/setup-mode');
  });

  test('snapshots before clear when restarting after a prior submit', async () => {
    getOnboardingState.mockResolvedValue({
      dashboardUnlocked: true,
      questionnaireEverCompleted: true,
    });
    isQuestionnaireComplete.mockReturnValue(true);

    await resolveStartQuestionnaireRoute();

    expect(snapshotQuestionnaireForRetake).toHaveBeenCalled();
    expect(patchOnboardingState).toHaveBeenCalledWith(expect.objectContaining({
      questionnaireEverCompleted: true,
      questionnaireRetakeInProgress: true,
    }));
  });
});

describe('resolveContinueQuestionnaireRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreNavHistoryForResume.mockResolvedValue(undefined);
  });

  test('returns saved resume route and restores nav history', async () => {
    getOnboardingState.mockResolvedValue({
      resumeRoute: '/(onboarding)/income?step=savings',
      navHistory: [{ route: '/(onboarding)/income', params: { step: 'savings' } }],
    });
    getValidSavedResumeRoute.mockReturnValue('/(onboarding)/income?step=savings');

    const route = await resolveContinueQuestionnaireRoute();

    expect(route).toBe('/(onboarding)/income?step=savings');
    expect(restoreNavHistoryForResume).toHaveBeenCalledWith({
      resumeRoute: '/(onboarding)/income?step=savings',
      navHistory: [{ route: '/(onboarding)/income', params: { step: 'savings' } }],
    });
  });

  test('returns null when no valid saved resume route', async () => {
    getOnboardingState.mockResolvedValue({ resumeRoute: '/(onboarding)/deleted-screen' });
    getValidSavedResumeRoute.mockReturnValue(null);

    await expect(resolveContinueQuestionnaireRoute()).resolves.toBeNull();
  });
});
