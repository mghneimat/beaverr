import { loadHouseholdFinancials } from './householdBudget';
import { syncAlerts, getActiveAlerts } from './alerts';

/**
 * Lightweight header data for TabHeaderToolbar — avoids full dashboard bundle load.
 * @param {(key: string, params?: object) => string} [t]
 */
export async function loadHeaderToolbarData(t) {
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
    household: financials.sections?.household ?? null,
  };
}
