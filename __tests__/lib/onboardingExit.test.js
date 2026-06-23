import {
  hasEverSubmittedQuestionnaire,
  discardOnboardingProgress,
  saveOnboardingForLater,
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

  test('discard first-time clears questionnaire keys', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') {
        return { setupMode: 'full', dashboardUnlocked: false };
      }
      return null;
    });

    await discardOnboardingProgress();

    expect(mockRemoveData).toHaveBeenCalled();
    expect(mockSetData).toHaveBeenCalledWith('beaverr_onboarding', expect.objectContaining({
      dashboardUnlocked: true,
      questionnaireComplete: false,
      percentComplete: 0,
      resumeRoute: null,
    }));
  });

  test('discard after quick setup restores baseline and clears extended keys only', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') {
        return { setupMode: 'quick', dashboardUnlocked: true, percentComplete: 55, resumeRoute: '/(onboarding)/income' };
      }
      if (key === 'beaverr_quick_setup_snapshot') {
        return {
          beaverr_household: { type: 'solo', displayName: 'Alex' },
          beaverr_housing: { type: 'renting', rent: 12000 },
        };
      }
      return null;
    });

    await discardOnboardingProgress();

    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', { type: 'solo', displayName: 'Alex' });
    expect(mockSetData).toHaveBeenCalledWith('beaverr_onboarding', expect.objectContaining({
      setupMode: 'quick',
      percentComplete: 0,
      resumeRoute: null,
      currentStep: 'questionnaire-discarded',
    }));
    expect(mockRemoveData).toHaveBeenCalledWith('beaverr_income');
  });

  test('discard after prior submit restores snapshot state', async () => {
    mockGetData.mockImplementation(async (key) => {
      if (key === 'beaverr_onboarding') {
        return { questionnaireEverCompleted: true };
      }
      if (key === 'beaverr_questionnaire_snapshot') {
        return { beaverr_household: { type: 'solo' } };
      }
      return null;
    });

    await discardOnboardingProgress();

    expect(mockSetData).toHaveBeenCalledWith('beaverr_household', { type: 'solo' });
    expect(mockSetData).toHaveBeenCalledWith('beaverr_onboarding', expect.objectContaining({
      questionnaireComplete: true,
      completed: true,
    }));
  });
});
