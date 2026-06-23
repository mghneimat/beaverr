import { getData, setData } from '../storage';

export const GOALS_STORAGE_KEY = 'beaverr_goals';
export const GOALS_MIGRATED_KEY = 'beaverr_goals_migrated';

/**
 * @returns {Promise<import('../schema').Goal[]>}
 */
export async function loadGoals() {
  const raw = await getData(GOALS_STORAGE_KEY);
  return Array.isArray(raw) ? raw : [];
}

/**
 * @param {import('../schema').Goal[]} goals
 * @returns {Promise<void>}
 */
export async function saveGoals(goals) {
  await setData(GOALS_STORAGE_KEY, goals);
}

/**
 * @returns {Promise<boolean>}
 */
export async function isGoalsMigrated() {
  const flag = await getData(GOALS_MIGRATED_KEY);
  return flag === true;
}

/**
 * @returns {Promise<void>}
 */
export async function markGoalsMigrated() {
  await setData(GOALS_MIGRATED_KEY, true);
}
