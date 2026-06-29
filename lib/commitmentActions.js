import { asArray } from './asArray';
import { parseAlertDate } from './alertDates';
import { getCustomStashById, getCustomStashes } from './customStashes';
import { roundMoney } from './finance';
import { getData, setData } from './storage';
import { notifyDashboardRefresh } from './dashboardRefresh';
import { syncSinkingFundStashes } from './sinkingStashes';

/**
 * @param {Date} date
 * @returns {string}
 */
function formatDisplayDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

/**
 * @param {string|null|undefined} dateStr
 * @param {'annual'|'quarterly'} frequency
 * @returns {string|null}
 */
export function advanceDueDate(dateStr, frequency = 'annual') {
  const parsed = parseAlertDate(dateStr);
  if (!parsed) return dateStr || null;
  const months = frequency === 'quarterly' ? 3 : 12;
  const next = new Date(parsed.getFullYear(), parsed.getMonth() + months, parsed.getDate());
  return formatDisplayDate(next);
}

/**
 * @param {import('./schema').CustomStash} stash
 * @returns {{ percent: number, isComplete: boolean, balance: number, target: number, dueDate: string|null }}
 */
export function computeCommitmentProgress(stash) {
  const balance = roundMoney(Number(stash?.balance) || 0);
  const target = roundMoney(Number(stash?.sinkingTargetAmount) || 0);
  const dueDate = stash?.sinkingDueDate || null;
  if (target <= 0) {
    return { percent: 0, isComplete: false, balance, target, dueDate };
  }
  const percent = Math.min(100, Math.round((balance / target) * 100));
  return {
    percent,
    isComplete: balance >= target,
    balance,
    target,
    dueDate,
  };
}

/**
 * @param {string} sourceKey
 * @returns {{ type: string, parts: string[] }}
 */
function parseSourceKey(sourceKey) {
  const colon = sourceKey.indexOf(':');
  if (colon === -1) return { type: sourceKey, parts: [] };
  return {
    type: sourceKey.slice(0, colon),
    parts: sourceKey.slice(colon + 1).split(':'),
  };
}

/**
 * @param {import('./schema').CustomStash} stash
 * @param {Record<string, unknown>} sections
 * @returns {'annual'|'quarterly'}
 */
export function resolveCommitmentFrequency(stash, sections) {
  const sourceKey = stash.sinkingSourceKey;
  if (!sourceKey) return 'annual';
  const { type, parts } = parseSourceKey(sourceKey);

  if (type === 'subscription') {
    const sub = asArray(sections.subs).find((row) => row.id === parts[0]);
    return sub?.frequency === 'quarterly' ? 'quarterly' : 'annual';
  }
  if (type === 'pet_insurance') {
    const pet = asArray(sections.pets).find((row, index) => (row.id || String(index)) === parts[0]);
    return pet?.insuranceFrequency === 'quarterly' ? 'quarterly' : 'annual';
  }
  if (type === 'child_cost') {
    const [childKey, fieldKey] = parts;
    const field = sections.childrenCosts?.[childKey]?.[fieldKey];
    return field?.frequency === 'quarterly' ? 'quarterly' : 'annual';
  }
  return 'annual';
}

/**
 * @param {import('./schema').CustomStash} stash
 * @param {Record<string, unknown>} sections
 * @returns {{ sourceKey: string, frequency: 'annual'|'quarterly', canDelete: boolean, label: string }|null}
 */
export function resolveCommitmentSource(stash, sections) {
  const sourceKey = stash.sinkingSourceKey;
  if (!sourceKey) return null;
  return {
    sourceKey,
    frequency: resolveCommitmentFrequency(stash, sections),
    canDelete: true,
    label: stash.name,
  };
}

/**
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadRawSections() {
  const [
    location,
    household,
    housing,
    transport,
    health,
    childrenCosts,
    pets,
    subs,
    otherCosts,
  ] = await Promise.all([
    getData('beaverr_location'),
    getData('beaverr_household'),
    getData('beaverr_housing'),
    getData('beaverr_transport'),
    getData('beaverr_health'),
    getData('beaverr_children_costs'),
    getData('beaverr_pets'),
    getData('beaverr_subscriptions'),
    getData('beaverr_other_costs'),
  ]);

  return {
    location: location || {},
    household: household || null,
    housing: housing || {},
    transport: transport || {},
    health: health || {},
    childrenCosts: childrenCosts || {},
    pets: asArray(pets),
    subs: asArray(subs),
    otherCosts: asArray(otherCosts),
  };
}

/**
 * @param {Record<string, unknown>} sections
 */
export async function persistRawSections(sections) {
  await Promise.all([
    setData('beaverr_location', sections.location || {}),
    setData('beaverr_household', sections.household || null),
    setData('beaverr_housing', sections.housing || {}),
    setData('beaverr_transport', sections.transport || {}),
    setData('beaverr_health', sections.health || {}),
    setData('beaverr_children_costs', sections.childrenCosts || {}),
    setData('beaverr_pets', sections.pets || []),
    setData('beaverr_subscriptions', sections.subs || []),
    setData('beaverr_other_costs', sections.otherCosts || []),
  ]);
}

/**
 * @param {Record<string, unknown>} transport
 * @param {string} vehicleId
 * @returns {{ vehicles: object[], index: number }|null}
 */
function findVehicleSlot(transport, vehicleId) {
  const vehicles = [...asArray(transport?.vehicles)];
  const index = vehicles.findIndex((vehicle, idx) => (vehicle.id || `vehicle_${idx}`) === vehicleId);
  if (index < 0) return null;
  return { vehicles, index };
}

/**
 * @param {Record<string, unknown>} sections
 * @param {string} sourceKey
 * @param {'annual'|'quarterly'} frequency
 * @returns {boolean}
 */
export function applyRenewToSections(sections, sourceKey, frequency) {
  const { type, parts } = parseSourceKey(sourceKey);
  const advance = (date) => advanceDueDate(date, frequency);

  if (type === 'subscription') {
    const subs = [...asArray(sections.subs)];
    const index = subs.findIndex((row) => row.id === parts[0]);
    if (index < 0) return false;
    const sub = { ...subs[index] };
    const nextDate = advance(sub.endDate || sub.renewalDate || sub.dueDate);
    if (sub.endDate) sub.endDate = nextDate;
    if (sub.renewalDate) sub.renewalDate = nextDate;
    if (sub.dueDate) sub.dueDate = nextDate;
    subs[index] = sub;
    sections.subs = subs;
    return true;
  }

  if (type === 'pet_insurance') {
    const pets = [...asArray(sections.pets)];
    const index = pets.findIndex((row, idx) => (row.id || String(idx)) === parts[0]);
    if (index < 0) return false;
    pets[index] = {
      ...pets[index],
      insuranceRenewalDate: advance(pets[index].insuranceRenewalDate),
    };
    sections.pets = pets;
    return true;
  }

  if (type === 'health_insurance') {
    const memberKey = parts[0];
    const health = { ...(sections.health || {}) };
    const member = { ...(health[memberKey] || {}) };
    member.endDate = advance(member.endDate);
    health[memberKey] = member;
    sections.health = health;
    return true;
  }

  if (type === 'vehicle_insurance' || type === 'vehicle_mot' || type === 'vehicle_parking' || type === 'vehicle_vignette') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    if (!slot) return false;
    const vehicle = { ...slot.vehicles[slot.index] };
    if (type === 'vehicle_insurance') {
      vehicle.insuranceEndDate = advance(vehicle.insuranceEndDate);
    } else if (type === 'vehicle_mot') {
      vehicle.motNextDate = advance(vehicle.motNextDate || vehicle.motDate);
    } else if (type === 'vehicle_parking') {
      vehicle.parkingEndDate = advance(vehicle.parkingEndDate || vehicle.parkingDueDate);
    } else {
      vehicle.vignetteValidUntil = advance(vehicle.vignetteValidUntil);
    }
    slot.vehicles[slot.index] = vehicle;
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'vehicle_maintenance') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    const itemIndex = Number(parts[1]);
    if (!slot || Number.isNaN(itemIndex)) return false;
    const vehicle = { ...slot.vehicles[slot.index] };
    const items = [...asArray(vehicle.maintenanceItems)];
    if (!items[itemIndex]) return false;
    items[itemIndex] = { ...items[itemIndex], date: advance(items[itemIndex].date) };
    vehicle.maintenanceItems = items;
    slot.vehicles[slot.index] = vehicle;
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'residence_permit') {
    const location = { ...(sections.location || {}) };
    const key = parts[0];
    if (key === 'user' && location.residencePermit) {
      location.residencePermit = {
        ...location.residencePermit,
        endDate: advance(location.residencePermit.endDate),
      };
    } else if (key === 'partner' && location.partnerResidencePermit) {
      location.partnerResidencePermit = {
        ...location.partnerResidencePermit,
        endDate: advance(location.partnerResidencePermit.endDate),
      };
    } else if (key.startsWith('child_')) {
      const childIndex = Number(key.replace('child_', ''));
      const entries = [...asArray(location.childrenCitizenship)];
      if (entries[childIndex]?.residencePermit) {
        entries[childIndex] = {
          ...entries[childIndex],
          residencePermit: {
            ...entries[childIndex].residencePermit,
            endDate: advance(entries[childIndex].residencePermit.endDate),
          },
        };
        location.childrenCitizenship = entries;
      }
    }
    sections.location = location;
    return true;
  }

  if (type === 'govt_tax') {
    return true;
  }

  if (type === 'housing_other') {
    const housing = { ...(sections.housing || {}) };
    const rows = [...asArray(housing.otherCostRows)];
    const index = rows.findIndex((row, idx) => (row.id || String(idx)) === parts[0]);
    if (index < 0) return false;
    rows[index] = { ...rows[index], dueDate: advance(rows[index].dueDate) };
    housing.otherCostRows = rows;
    sections.housing = housing;
    return true;
  }

  if (type === 'child_cost') {
    const [childKey, fieldKey] = parts;
    const childrenCosts = { ...(sections.childrenCosts || {}) };
    const fields = { ...(childrenCosts[childKey] || {}) };
    const field = { ...(fields[fieldKey] || {}) };
    const nextDate = advance(field.endDate || field.dueDate);
    field.endDate = nextDate;
    field.dueDate = nextDate;
    fields[fieldKey] = field;
    childrenCosts[childKey] = fields;
    sections.childrenCosts = childrenCosts;
    return true;
  }

  return false;
}

/**
 * @param {Record<string, unknown>} sections
 * @param {string} sourceKey
 * @returns {boolean}
 */
export function applyDeleteToSections(sections, sourceKey) {
  const { type, parts } = parseSourceKey(sourceKey);

  if (type === 'subscription') {
    sections.subs = asArray(sections.subs).filter((row) => row.id !== parts[0]);
    return true;
  }

  if (type === 'pet_insurance') {
    const pets = [...asArray(sections.pets)];
    const index = pets.findIndex((row, idx) => (row.id || String(idx)) === parts[0]);
    if (index < 0) return false;
    pets[index] = {
      ...pets[index],
      hasInsurance: false,
      insurancePremium: '',
      insuranceRenewalDate: null,
    };
    sections.pets = pets;
    return true;
  }

  if (type === 'health_insurance') {
    const health = { ...(sections.health || {}) };
    const memberKey = parts[0];
    const member = { ...(health[memberKey] || {}) };
    member.renewalPlan = 'end';
    member.insuranceBudgetForRenewal = false;
    health[memberKey] = member;
    sections.health = health;
    return true;
  }

  if (type === 'vehicle_insurance') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    if (!slot) return false;
    const vehicle = { ...slot.vehicles[slot.index], insuranceRenewalPlan: 'end', insuranceBudgetForRenewal: false };
    slot.vehicles[slot.index] = vehicle;
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'vehicle_mot') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    if (!slot) return false;
    slot.vehicles[slot.index] = {
      ...slot.vehicles[slot.index],
      motInspectionCost: '',
      motNextDate: null,
      motDate: null,
    };
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'vehicle_parking') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    if (!slot) return false;
    slot.vehicles[slot.index] = {
      ...slot.vehicles[slot.index],
      hasParking: false,
      parkingAmount: '',
      parkingEndDate: null,
      parkingDueDate: null,
    };
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'vehicle_vignette') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    if (!slot) return false;
    slot.vehicles[slot.index] = {
      ...slot.vehicles[slot.index],
      hasVignette: false,
      vignetteAmount: '',
      vignetteValidUntil: null,
    };
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'vehicle_maintenance') {
    const transport = { ...(sections.transport || {}) };
    const slot = findVehicleSlot(transport, parts[0]);
    const itemIndex = Number(parts[1]);
    if (!slot || Number.isNaN(itemIndex)) return false;
    const vehicle = { ...slot.vehicles[slot.index] };
    vehicle.maintenanceItems = asArray(vehicle.maintenanceItems).filter((_, idx) => idx !== itemIndex);
    slot.vehicles[slot.index] = vehicle;
    transport.vehicles = slot.vehicles;
    sections.transport = transport;
    return true;
  }

  if (type === 'residence_permit') {
    const location = { ...(sections.location || {}) };
    const key = parts[0];
    if (key === 'user') {
      location.residencePermit = { ...location.residencePermit, renewalCost: '', endDate: null };
    } else if (key === 'partner') {
      location.partnerResidencePermit = { ...location.partnerResidencePermit, renewalCost: '', endDate: null };
    } else if (key.startsWith('child_')) {
      const childIndex = Number(key.replace('child_', ''));
      const entries = [...asArray(location.childrenCitizenship)];
      if (entries[childIndex]?.residencePermit) {
        entries[childIndex] = {
          ...entries[childIndex],
          residencePermit: { ...entries[childIndex].residencePermit, renewalCost: '', endDate: null },
        };
        location.childrenCitizenship = entries;
      }
    }
    sections.location = location;
    return true;
  }

  if (type === 'govt_tax') {
    const housing = { ...(sections.housing || {}) };
    const gt = { ...(housing.govtTaxes || {}) };
    const taxKey = parts[0];
    if (taxKey === 'waste') {
      gt.wasteTax = false;
      gt.wasteTaxAmount = '';
    } else if (taxKey === 'tv') {
      gt.tvLicence = false;
      gt.tvLicenceAmount = '';
    } else if (taxKey === 'radio') {
      gt.radioLicence = false;
      gt.radioLicenceAmount = '';
    } else if (taxKey.startsWith('custom_')) {
      const index = Number(taxKey.replace('custom_', ''));
      gt.customItems = asArray(gt.customItems).filter((_, idx) => idx !== index);
    }
    housing.govtTaxes = gt;
    sections.housing = housing;
    return true;
  }

  if (type === 'housing_other') {
    const housing = { ...(sections.housing || {}) };
    housing.otherCostRows = asArray(housing.otherCostRows).filter(
      (row, idx) => (row.id || String(idx)) !== parts[0],
    );
    sections.housing = housing;
    return true;
  }

  if (type === 'child_cost') {
    const [childKey, fieldKey] = parts;
    const childrenCosts = { ...(sections.childrenCosts || {}) };
    const fields = { ...(childrenCosts[childKey] || {}) };
    delete fields[fieldKey];
    childrenCosts[childKey] = fields;
    sections.childrenCosts = childrenCosts;
    return true;
  }

  return false;
}

/**
 * @param {import('./schema').Budget} budget
 * @param {string} stashId
 * @returns {import('./schema').Budget}
 */
function zeroStashBalance(budget, stashId) {
  const stashes = getCustomStashes(budget).map((stash) => (
    stash.id === stashId ? { ...stash, balance: 0 } : stash
  ));
  return { ...budget, customStashes: stashes };
}

/**
 * @param {{
 *   stashId: string,
 *   t: (key: string, params?: Record<string, string|number>) => string,
 *   formatCurrency: (amount: number) => string,
 *   now?: Date,
 * }} params
 */
export async function renewCommitmentStash({ stashId, t, formatCurrency, now = new Date() }) {
  const budget = (await getData('beaverr_budget')) || {};
  const stash = getCustomStashById(budget, stashId);
  if (!stash?.sinkingSourceKey) return { error: 'notFound' };

  const sections = await loadRawSections();
  const frequency = resolveCommitmentFrequency(stash, sections);
  const renewed = applyRenewToSections(sections, stash.sinkingSourceKey, frequency);
  if (!renewed) return { error: 'sourceNotFound' };

  await persistRawSections(sections);

  let nextBudget = zeroStashBalance(budget, stashId);
  const sync = syncSinkingFundStashes(nextBudget, sections, t, formatCurrency, now);
  nextBudget = sync.budget;

  await setData('beaverr_budget', nextBudget);
  notifyDashboardRefresh();
  return { error: null, name: stash.name };
}

/**
 * @param {import('./schema').CustomStash} stash
 */
export async function deleteCommitmentSource(stash) {
  if (!stash?.sinkingSourceKey) return { error: 'notFound' };

  const sections = await loadRawSections();
  const deleted = applyDeleteToSections(sections, stash.sinkingSourceKey);
  if (!deleted) return { error: 'sourceNotFound' };

  await persistRawSections(sections);
  notifyDashboardRefresh();
  return { error: null };
}
