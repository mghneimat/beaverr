/** All persisted keys that hold questionnaire / household financial profile data. */
import { STORAGE_KEYS } from './beaverrConstants';

export const QUESTIONNAIRE_DATA_KEYS = [
  STORAGE_KEYS.household,
  STORAGE_KEYS.location,
  STORAGE_KEYS.occupation,
  STORAGE_KEYS.income,
  STORAGE_KEYS.housing,
  STORAGE_KEYS.costs,
  STORAGE_KEYS.transport,
  STORAGE_KEYS.health,
  STORAGE_KEYS.childrenCosts,
  STORAGE_KEYS.pets,
  STORAGE_KEYS.subscriptions,
  STORAGE_KEYS.otherCosts,
  STORAGE_KEYS.debts,
  STORAGE_KEYS.budget,
];

/** Keys written during quick setup — preserved when discarding full questionnaire progress. */
export const QUICK_SETUP_DATA_KEYS = [
  STORAGE_KEYS.household,
  STORAGE_KEYS.location,
  STORAGE_KEYS.occupation,
  STORAGE_KEYS.housing,
];

export const QUICK_SETUP_SNAPSHOT_KEY = STORAGE_KEYS.quickSetupSnapshot;

export const QUESTIONNAIRE_SNAPSHOT_KEY = STORAGE_KEYS.questionnaireSnapshot;
