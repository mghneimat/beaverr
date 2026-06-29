import { getData } from './storage.js';
import { loadHouseholdFinancials } from './householdBudget';
import { syncAlerts, getActiveAlerts } from './alerts';
import { loadAccountRegistrationFields } from './account/registrationProfile';

/**
 * Lightweight header data for TabHeaderToolbar — avoids full dashboard bundle load.
 * @param {(key: string, params?: object) => string} [t]
 * @param {string} [userId]
 */
export async function loadHeaderToolbarData(t, userId) {
  const household = (await getData('beaverr_household')) || null;
  const accountFields = await loadAccountRegistrationFields(userId);

  try {
    const financials = await loadHouseholdFinancials(t);
    const alerts = await syncAlerts({
      subs: financials.sections.subs,
      health: financials.sections.health,
      debts: financials.debts,
      transport: financials.sections.transport,
      sections: financials.sections,
    }, t);

    return {
      alertCount: getActiveAlerts(alerts).length,
      household: financials.sections?.household ?? household,
      accountFields,
    };
  } catch {
    return {
      alertCount: 0,
      household,
      accountFields,
    };
  }
}