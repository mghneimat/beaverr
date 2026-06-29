import {
  hasEverSubmittedQuestionnaire,
  discardOnboardingProgress,
  saveOnboardingForLater,
  snapshotHasRestorableData,
} from '../../lib/onboardingExit';

const mockGetData = jest.fn();
const mockSetData = jest.fn();
const mockRemoveData = jest.fn();

jest.mock('../../lib/storage', () => ({
  getData: (...args) => mockGetData(...args),
  setData: (...args) => mockSetData(...args),
  removeData: (...args) => mockRemoveData(...args),
}));

jest.mock('../../lib/dashboardRefresh', () => ({
  notifyDashboardRefresh: jest.fn(),
}));

jest.mock('../../lib/onboardingNavigation', () => ({
  getNavHistory: jest.fn(() => []),
  parseHref: jest.fn((href) => ({ route: href, params: {} })),
  resetNavHistory: jest.fn(),
}));

jest.mock('../../lib/cloud/syncHousehold', () => ({
  setHydratingFromCloud: jest.fn(),
  pushCloudHousehold: jest.fn().mockResolvedValue({ ok: true }),
}));

const { pushCloudHousehold } = require('../../lib/cloud/syncHousehold');

describe('onboardingExit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockResolvedValue(null);
    mockSetData.mockResolvedValue(undefined);
    mockRemoveData.mockResolvedValue(undefined);
  });

  test('hasEverSubmittedQuestionnaire reads questionnaireEverCompleted', () => {
    expect(hasEverSubmittedQuestionnaire({ questionnaireEverCompleted: true })).toBe(true);
    expect(hasEverSubmittedQuestionnaire({ completed: true })).toBe(false);
  });

  test('snapshotHasRestorableData requires at least one questionnaire key', () => {
    expect(snapshotHasRestorableData(null)).toBe(false);
    expect(snapshotHasRestorableData({ beaverr_income: null })).toBe(false);
    expect(snapshotHasRestorableData({ beaverr_income: { user: { amount: 1 } } })).toBe(true);
  });

  test('saveOnboardingForLater unlocks dashboard and stores resume route', async () => {
    mockGetData.mockResolvedValue({ setupMode: 'full', percentComplete: 40 });

    await saveOnboardingForLater({
      resumeRoute: '/(onboarding)/income',
      patch: { currentStep: 'income' },
    });

    expect(mockSetData).toHaveBeenCalledWith('beaverr_onboarding', expect.objectContaining({
      dashboardUnlocked: true,
      questionnaireComplete: false,
      resumeRoute: '/(onboarding)/income',
      currentStep: 'income',
    }));
  });

  test('discard restores questionnaire snapshot after a prior full submit', async () => {
    const savedIncome = { user: { amount: 50000, frequency: 'monthly' } };
    const savedOnboarding = {
      setupMode: 'full',
      dashboardUnlocked: true,
      questionnaireEverCompleted: true,
      questionnaireComplete: true,
      completed: true,
      percentComplete: 100,
    };
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') {
        return {
          setupMode: 'full',
          dashboardUnlocked: true,
          questionnaireRetakeInProgress: true,
          questionnaireComplete: false,
          resumeRoute: '/(onboarding)/income',
        };
      }
      if (key === 'beaverr_questionnaire_snapshot') {
        return {
          beaverr_income: savedIncome,
          beaverr_onboarding: savedOnboarding,
        };
      }
      return null;
    });

    await discardOnboardingProgress();

    expect(mockSetData).toHaveBeenCalledWith('beaverr_income', savedIncome);
    expect(mockRemoveData).not.toHaveBeenCalledWith('beaverr_income');
    expect(mockSetData).toHaveBeenCalledWith('beaverr_onboarding', expect.objectContaining({
      completed: true,
      questionnaireComplete: true,
      questionnaireEverCompleted: true,
      questionnaireRetakeInProgress: false,
      percentComplete: 100,
      resumeRoute: null,
      currentStep: 'review',
      setupMode: 'full',
    }));
    expect(pushCloudHousehold).toHaveBeenCalled();
  });

  test('discard restores from snapshot even when questionnaireEverCompleted flag was lost', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') {
        return { questionnaireRetakeInProgress: true, setupMode: 'full' };
      }
      if (key === 'beaverr_questionnaire_snapshot') {
        return { beaverr_household: { type: 'solo' } };
      }
      return null;
    });

    await discardOnboardingProgress();

    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', { type: 'solo' });
    expect(mockRemoveData).not.toHaveBeenCalledWith('beaverr_household');
  });

  test('discard clears questionnaire keys for first-time in-progress users', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') {
        return {
          setupMode: 'quick',
          dashboardUnlocked: true,
          percentComplete: 55,
          resumeRoute: '/(onboarding)/income',
        };
      }
      return null;
    });

    await discardOnboardingProgress();

    expect(mockRemoveData).toHaveBeenCalledWith('beaverr_income');
    expect(mockRemoveData).toHaveBeenCalledWith('beaverr_household');
    expect(mockSetData).toHaveBeenCalledWith('beaverr_onboarding', expect.objectContaining({
      dashboardUnlocked: true,
      questionnaireComplete: false,
      questionnaireEverCompleted: false,
      setupMode: null,
      percentComplete: 0,
      resumeRoute: null,
      currentStep: 'discarded',
    }));
    expect(mockSetData).not.toHaveBeenCalledWith('beaverr_household', expect.anything());
  });
});
