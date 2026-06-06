/**
 * Storage abstraction layer
 * Phase 1: localStorage for web, AsyncStorage for native
 * Phase 2+: Supabase
 */

import { Platform } from 'react-native';

/**
 * @typedef {Object} StorageAdapter
 * @property {(key: string) => Promise<string|null>} getItem
 * @property {(key: string, value: string) => Promise<void>} setItem
 * @property {(key: string) => Promise<void>} removeItem
 */

let storage;

if (Platform.OS === 'web') {
  storage = {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
    removeItem: async (key) => localStorage.removeItem(key),
  };
} else {
  // For native, AsyncStorage will be needed in Phase 2
  // For now, use a simple in-memory storage for native platforms
  const memoryStorage = {};
  storage = {
    getItem: async (key) => memoryStorage[key] || null,
    setItem: async (key, value) => { memoryStorage[key] = value; },
    removeItem: async (key) => { delete memoryStorage[key]; },
  };
}

/**
 * Get data from storage
 * @param {string} key - Storage key
 * @returns {Promise<any|null>} Parsed data or null
 */
export async function getData(key) {
  try {
    const value = await storage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return null;
  }
}

/**
 * Save data to storage
 * @param {string} key - Storage key
 * @param {any} value - Data to store
 * @returns {Promise<void>}
 */
export async function setData(key, value) {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
    throw error;
  }
}

/**
 * Remove data from storage
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeData(key) {
  try {
    await storage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
    throw error;
  }
}

/**
 * Clear all app data from storage
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  const keys = [
    'pocketos_onboarding',
    'pocketos_household',
    'pocketos_location',
    'pocketos_occupation',
    'pocketos_income',
    'pocketos_costs',
    'pocketos_debts',
    'pocketos_budget',
    'pocketos_daily_log',
    'pocketos_alerts',
    'pocketos_settings',
  ];
  
  try {
    await Promise.all(keys.map(key => removeData(key)));
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}
