import { formatCurrency, parseMoneyAmount } from '../finance';
import { getResidencePermitLabel } from '../residencePermits';
import { formatDateDisplay } from '../datePicker';
import { childCostDisplayName } from '../childrenCostsCatalog';
import { subscriptionDisplayName } from '../subscriptionCatalog';
import { resolveDailySpendingDestination } from '../dailySpendingStrategy';
import {
  buildHealthSectionSubtitle,
  formatMonthly,
  formatRecurringAmount,
  healthMemberLabel,
  healthMemberStatus,
  incomeGoalsSummary,
  monthlyAmount,
  reviewReadOnly,
  reviewRow,
} from './reviewFormatters';

/**
 * Build one-line section subtitles shown under each card title.
 * @param {string} sectionId
 */
export function buildSectionSubtitle(sectionId, ctx) {
  const { allData, financials, t } = ctx;
  const { currency } = financials;
  const h = allData.beaverr_household;
  const loc = allData.beaverr_location;
  const occ = allData.beaverr_occupation;
  const inc = allData.beaverr_income;
  const budget = allData.beaverr_budget;
  const transport = allData.beaverr_transport;

  switch (sectionId) {
    case 'household': {
      const type = h?.type ? t(`onboarding.household.type.${h.type}`) : '—';
      const childCount = h?.children?.length || 0;
      if (childCount > 0) {
        return t('onboarding.review.review.subtitles.householdWithChildren', {
          type,
          childCount,
        });
      }
      return type;
    }
    case 'location': {
      const city = loc?.city || '—';
      const cur = loc?.currency || '—';
      const occLabel = occ?.user ? t(`onboarding.occupation.${occ.user}`) : '—';
      return `${city} · ${cur} · ${occLabel}`;
    }
    case 'budget': {
      const flex = budget?.monthlyFlexible;
      if (flex == null) return '—';
      let rolloverHint = '';
      if (budget.rolloverStrategy === 'reset' && budget.resetUnspentDestination === 'savings') {
        rolloverHint = t('onboarding.review.review.subtitles.unspentToSavings');
      } else if (budget.rolloverStrategy === 'free') {
        rolloverHint = t('onboarding.review.review.subtitles.unspentRollsOver');
      } else if (budget.rolloverStrategy === 'reset') {
        rolloverHint = t('onboarding.review.review.subtitles.unspentLooseCash');
      }
      const flexLabel = formatMonthly(flex, currency, t);
      return rolloverHint ? `${flexLabel} · ${rolloverHint}` : flexLabel;
    }
    case 'income': {
      if (financials.totalIncome <= 0) {
        return t('onboarding.review.review.subtitles.incomeNeedsReview', {
          amount: formatMonthly(0, currency, t),
        });
      }
      return formatMonthly(financials.totalIncome, currency, t);
    }
    case 'health':
      return buildHealthSectionSubtitle(financials, t);
    case 'transport': {
      if (!transport?.hasVehicle && !transport?.hasPublicTransport) {
        return t('onboarding.review.review.subtitles.noVehicle');
      }
      if (financials.transportMonthly > 0) {
        return formatMonthly(financials.transportMonthly, currency, t);
      }
      return t('onboarding.review.review.subtitles.noVehicle');
    }
    case 'childrenCosts':
      return financials.childrenMonthly > 0
        ? formatMonthly(financials.childrenMonthly, currency, t)
        : t('onboarding.review.review.labels.none');
    case 'subscriptions':
      return financials.subsMonthly > 0
        ? formatMonthly(financials.subsMonthly, currency, t)
        : t('onboarding.review.review.labels.none');
    case 'otherCosts':
      return financials.otherMonthly > 0
        ? formatMonthly(financials.otherMonthly, currency, t)
        : t('onboarding.review.review.labels.none');
    case 'debts':
      return financials.debtMinMonthly > 0
        ? t('onboarding.review.review.subtitles.debtMinPayment', {
          amount: formatCurrency(financials.debtMinMonthly, currency),
        })
        : t('onboarding.review.review.labels.none');
    case 'pets': {
      const pets = allData.beaverr_pets || [];
      const total = pets.reduce((sum, pet) => {
        const food = monthlyAmount(pet.foodAmount, pet.foodFrequency);
        const vet = monthlyAmount(pet.vetAmount, pet.vetFrequency);
        return sum + food + vet;
      }, 0);
      return total > 0 ? formatMonthly(total, currency, t) : t('onboarding.review.review.labels.none');
    }
    default:
      return '';
  }
}

export function sectionHasWarning(sectionId, financials) {
  if (sectionId === 'income' && financials.totalIncome <= 0) return true;
  if (sectionId === 'health' && financials.unconfirmedHealth.length > 0) return true;
  return false;
}

/**
 * Row builders for expanded section bodies.
 * @returns {{ label: string, value: string }[]}
 */
export function buildSectionRows(sectionId, ctx) {
  const { allData, financials, t } = ctx;
  const { currency } = financials;
  const h = allData.beaverr_household;
  const loc = allData.beaverr_location;
  const occ = allData.beaverr_occupation;
  const inc = allData.beaverr_income;
  const transport = allData.beaverr_transport;
  const health = allData.beaverr_health;
  const budget = allData.beaverr_budget;
  const debts = allData.beaverr_debts || [];
  const subs = allData.beaverr_subscriptions || [];
  const otherCosts = allData.beaverr_other_costs || [];
  const pets = allData.beaverr_pets || [];

  switch (sectionId) {
    case 'household':
      return [
        reviewRow('household', 'type', t('onboarding.review.review.labels.type'), h?.type ? t(`onboarding.household.type.${h.type}`) : '—'),
        reviewRow('household', 'partner', t('onboarding.review.review.labels.partner'), h?.partnerName || '—'),
        reviewRow(
          'household',
          'children',
          t('onboarding.review.review.labels.children'),
          h?.children?.length
            ? h.children.map((c) => c.displayName || '—').join(', ')
            : t('common.no'),
        ),
      ];

    case 'location': {
      const rows = [
        reviewRow('location', 'country', t('onboarding.review.review.labels.country'), loc?.country || '—'),
        reviewRow('location', 'city', t('onboarding.review.review.labels.city'), loc?.city || '—'),
        reviewRow('location', 'currency', t('onboarding.review.review.labels.currency'), loc?.currency || '—'),
      ];
      if (loc?.isCzCitizen != null) {
        rows.push(reviewRow(
          'location',
          'citizenship',
          t('onboarding.review.review.labels.czCitizen'),
          loc.isCzCitizen ? t('common.yes') : t('common.no'),
        ));
      }
      if (occ?.user) {
        rows.push(reviewRow(
          'location',
          'occupation',
          t('onboarding.review.review.labels.occupation'),
          t(`onboarding.occupation.${occ.user}`),
        ));
      }
      if (occ?.partner) {
        rows.push(reviewRow(
          'location',
          'partnerOccupation',
          t('onboarding.review.review.labels.partnerOccupation'),
          t(`onboarding.occupation.${occ.partner}`),
        ));
      }
      if (loc?.residencePermit) {
        rows.push(reviewRow(
          'location',
          'residencePermit',
          t('onboarding.review.review.labels.residencePermit'),
          getResidencePermitLabel(loc.residencePermit.type, t),
        ));
        rows.push(reviewRow(
          'location',
          'residencePermit',
          t('onboarding.review.review.labels.permitEnd'),
          loc.residencePermit.endDate
            ? formatDateDisplay(loc.residencePermit.endDate, true, t)
            : '—',
          { key: 'location:residencePermitEnd' },
        ));
      }
      return rows;
    }

    case 'budget': {
      const rows = [
        reviewRow(
          'budget',
          'monthlyBudget',
          t('onboarding.review.review.labels.monthlyBudget'),
          budget?.monthlyFlexible != null
            ? formatMonthly(budget.monthlyFlexible, currency, t)
            : '—',
        ),
        reviewRow(
          'budget',
          'rollover',
          t('onboarding.review.review.labels.rollover'),
          budget?.rolloverStrategy
            ? t(`onboarding.budget.rollover.${budget.rolloverStrategy}`)
            : '—',
        ),
        reviewRow(
          'budget',
          'dailySpending',
          t('onboarding.review.review.labels.dailySpending'),
          budget?.dailyJarDestination
            ? t(`onboarding.budget.spendingStrategy.${budget.dailyJarDestination}`)
            : t(`onboarding.budget.spendingStrategy.${resolveDailySpendingDestination(budget)}`),
        ),
      ];
      if (budget?.rolloverStrategy === 'reset' && budget?.resetUnspentDestination) {
        const dest = budget.resetUnspentDestination === 'otherGoal'
          ? (budget.resetOtherGoalNote || t('onboarding.budget.rollover.resetToOtherGoal'))
          : budget.resetUnspentDestination === 'savings'
            ? t('onboarding.budget.rollover.resetToSavings')
            : t('onboarding.budget.rollover.resetPiggyBank');
        rows.push(reviewRow('budget', 'resetDestination', t('onboarding.review.review.labels.resetDestination'), dest));
      }
      return rows;
    }

    case 'income': {
      const rows = [];
      const userM = monthlyAmount(inc?.amount, inc?.frequency);
      const partnerM = monthlyAmount(inc?.partnerAmount, inc?.partnerFrequency);
      const incomeLines = [];

      if (userM > 0) {
        incomeLines.push(reviewRow(
          'income',
          'userIncome',
          t('onboarding.review.review.labels.yourIncome'),
          formatMonthly(userM, currency, t),
        ));
      }
      if (partnerM > 0) {
        incomeLines.push(reviewRow(
          'income',
          'partnerIncome',
          t('onboarding.review.review.labels.partnerIncome'),
          formatMonthly(partnerM, currency, t),
        ));
      }
      (inc?.otherIncomeRows || []).forEach((s, i) => {
        if (s?.amount == null || s.amount === '') return;
        incomeLines.push(reviewRow(
          'income',
          `otherIncome-${i}`,
          s.label || `${t('onboarding.review.review.labels.otherIncome')} ${i + 1}`,
          formatRecurringAmount(s.amount, currency, s.frequency, t),
        ));
      });

      rows.push(...incomeLines);

      if (incomeLines.length > 1 || incomeLines.length === 0) {
        rows.push(reviewReadOnly(
          'income',
          'totalIncome',
          t('onboarding.review.review.labels.totalIncome'),
          formatMonthly(financials.totalIncome, currency, t),
        ));
      }

      const savingsRaw = inc?.savingsBalance;
      const savingsValue = savingsRaw != null && savingsRaw !== ''
        ? formatCurrency(parseMoneyAmount(savingsRaw), currency)
        : '—';
      rows.push(reviewRow(
        'income',
        'savingsBalance',
        t('onboarding.review.review.labels.savingsBalance'),
        savingsValue,
      ));

      rows.push(reviewRow(
        'income',
        'goals',
        t('onboarding.review.review.labels.goalIntent'),
        incomeGoalsSummary(inc, t),
      ));
      return rows;
    }

    case 'health':
      if (!health || typeof health !== 'object') {
        return [reviewReadOnly('health', 'none', '—', t('onboarding.review.review.labels.none'))];
      }
      return Object.entries(health).map(([key, val]) => reviewRow(
        'health',
        key,
        healthMemberLabel(key, h, t),
        healthMemberStatus(val, currency, t),
        { warn: !val?.confirmed },
      ));

    case 'transport': {
      const rows = [];
      if (transport?.hasVehicle) {
        if (transport.fuelCost) {
          rows.push(reviewRow(
            'transport',
            'fuel',
            t('onboarding.review.review.labels.fuel'),
            formatMonthly(transport.fuelCost, currency, t),
          ));
        } else {
          rows.push(reviewRow(
            'transport',
            'fuel',
            t('onboarding.review.review.labels.fuel'),
            t('onboarding.review.review.subtitles.noVehicle'),
          ));
        }
        if (transport.hasInsurance && transport.insurancePremium) {
          rows.push(reviewRow(
            'transport',
            'insurance',
            t('onboarding.review.review.labels.insurance'),
            formatRecurringAmount(transport.insurancePremium, currency, transport.insuranceFrequency, t),
          ));
        }
      } else {
        rows.push(reviewRow(
          'transport',
          'fuel',
          t('onboarding.review.review.labels.fuel'),
          t('onboarding.review.review.subtitles.noVehicle'),
        ));
      }
      if (transport?.hasPublicTransport && transport.ptAmount) {
        rows.push(reviewRow(
          'transport',
          'publicTransport',
          t('onboarding.review.review.labels.publicTransport'),
          formatRecurringAmount(transport.ptAmount, currency, transport.ptFrequency, t),
        ));
      } else if (transport?.hasPublicTransport) {
        rows.push(reviewRow(
          'transport',
          'publicTransport',
          t('onboarding.review.review.labels.publicTransport'),
          '—',
        ));
      }
      return rows;
    }

    case 'subscriptions':
      return subs.map((sub, i) => reviewRow(
        'subscriptions',
        `sub-${i}`,
        subscriptionDisplayName(sub, t),
        sub.cost
          ? formatRecurringAmount(sub.cost, currency, sub.frequency, t)
          : '—',
      ));

    case 'otherCosts':
      return otherCosts.map((c, i) => reviewRow(
        'otherCosts',
        `other-${i}`,
        t(`onboarding.otherCosts.costSelection.costs.${c.name}`),
        c.amount
          ? formatRecurringAmount(c.amount, currency, c.frequency, t)
          : '—',
      ));

    default:
      return [];
  }
}

/** @returns {{ name: string, displayName: string, total: number, rows: { label: string, value: string }[] }[]} */
export function buildChildrenBlocks(ctx) {
  const { financials, t, allData } = ctx;
  const { currency } = financials;

  return financials.childTotals.map((child, idx) => {
    const rows = [];
    if (child.fields && typeof child.fields === 'object' && !Array.isArray(child.fields)) {
      Object.entries(child.fields).forEach(([field, val]) => {
        if (!val?.amount) return;
        rows.push({
          label: childCostDisplayName(field, val.customLabel, t),
          value: formatRecurringAmount(val.amount, currency, val.frequency, t),
          sectionId: 'childrenCosts',
          editKey: `child-${idx}`,
          editable: true,
          key: `childrenCosts:child-${idx}:${field}`,
        });
      });
    }
    return {
      name: child.name,
      displayName: child.displayName,
      total: child.total,
      totalLabel: t('onboarding.review.review.labels.childSubtotal', { name: child.displayName }),
      totalFormatted: formatMonthly(child.total, currency, t),
      sectionId: 'childrenCosts',
      editKey: `child-${idx}`,
      editable: true,
      editLabel: child.displayName,
      rows,
    };
  });
}

export function buildDebtBlocks(ctx) {
  const { allData, t, financials } = ctx;
  const { currency } = financials;
  const debts = allData.beaverr_debts || [];

  return debts.map((d, i) => ({
    key: `debt-${i}`,
    sectionId: 'debts',
    editKey: `debt-${i}`,
    editable: true,
    editLabel: `${t(`onboarding.debts.debtDetails.${d.type}`)} — ${formatCurrency(d.balance, currency)}`,
    title: `${t(`onboarding.debts.debtDetails.${d.type}`)} — ${formatCurrency(d.balance, currency)}`,
    rows: [
      {
        label: t('onboarding.review.review.labels.minPayment'),
        value: formatMonthly(d.minPayment || 0, currency, t),
        sectionId: 'debts',
        editKey: `debt-${i}`,
        editable: true,
        key: `debts:debt-${i}:minPayment`,
      },
      ...(d.apr > 0 ? [{
        label: t('onboarding.review.review.labels.apr'),
        value: `${d.apr}%`,
        sectionId: 'debts',
        editKey: `debt-${i}`,
        editable: true,
        key: `debts:debt-${i}:apr`,
      }] : []),
    ],
  }));
}

export function buildPetBlocks(ctx) {
  const { allData, t, financials } = ctx;
  const { currency } = financials;
  const pets = allData.beaverr_pets || [];

  return pets.map((pet, i) => ({
    key: `pet-${i}`,
    sectionId: 'pets',
    editKey: `pet-${i}`,
    editable: true,
    editLabel: pet.name || `${t('onboarding.pets.petDetails.petLabel')} ${i + 1}`,
    title: pet.name || `${t('onboarding.pets.petDetails.petLabel')} ${i + 1}`,
    rows: [
      ...(pet.foodAmount ? [{
        label: t('onboarding.review.review.labels.food'),
        value: formatRecurringAmount(pet.foodAmount, currency, pet.foodFrequency, t),
        sectionId: 'pets',
        editKey: `pet-${i}`,
        editable: true,
        key: `pets:pet-${i}:food`,
      }] : []),
      ...(pet.vetAmount ? [{
        label: t('onboarding.review.review.labels.vet'),
        value: formatRecurringAmount(pet.vetAmount, currency, pet.vetFrequency, t),
        sectionId: 'pets',
        editKey: `pet-${i}`,
        editable: true,
        key: `pets:pet-${i}:vet`,
      }] : []),
    ],
  }));
}

export const REVIEW_SECTION_META = [
  { id: 'household', titleKey: 'onboarding.review.review.sections.household', iconEmoji: '👫' },
  { id: 'location', titleKey: 'onboarding.review.review.sections.location', iconEmoji: '📍' },
  { id: 'budget', titleKey: 'onboarding.review.review.sections.budget', sectionKey: 'primary', scope: 'income' },
  { id: 'income', titleKey: 'onboarding.review.review.sections.income', sectionKey: 'primary', scope: 'income' },
  { id: 'health', titleKey: 'onboarding.review.review.sections.health', sectionKey: 'health', scope: 'expense' },
  { id: 'transport', titleKey: 'onboarding.review.review.sections.transport', sectionKey: 'transport', scope: 'expense' },
  { id: 'childrenCosts', titleKey: 'onboarding.review.review.sections.childrenCosts', sectionKey: 'children', scope: 'expense', requiresChildren: true },
  { id: 'subscriptions', titleKey: 'onboarding.review.review.sections.subscriptions', sectionKey: 'subscriptions', scope: 'expense', requiresSubs: true },
  { id: 'otherCosts', titleKey: 'onboarding.review.review.sections.otherCosts', sectionKey: 'other', scope: 'expense', requiresOther: true },
  { id: 'pets', titleKey: 'onboarding.review.review.sections.pets', sectionKey: 'pets', scope: 'expense', requiresPets: true },
  { id: 'debts', titleKey: 'onboarding.review.review.sections.debts', sectionKey: 'debts', scope: 'expense', requiresDebts: true },
];

function parseReviewAmount(value) {
  return parseFloat(value) || 0;
}

/**
 * Whether a review section has user-entered data worth showing (not empty placeholders).
 * @param {string} sectionId
 * @param {{ allData: Record<string, unknown>, financials: ReturnType<typeof buildReviewFinancials> }} ctx
 */
export function sectionHasEnteredData(sectionId, ctx) {
  const { allData, financials } = ctx;
  const h = allData.beaverr_household;
  const loc = allData.beaverr_location;
  const budget = allData.beaverr_budget;
  const inc = allData.beaverr_income;
  const health = allData.beaverr_health;
  const transport = allData.beaverr_transport;
  const subs = allData.beaverr_subscriptions || [];
  const otherCosts = allData.beaverr_other_costs || [];
  const pets = allData.beaverr_pets || [];
  const debts = allData.beaverr_debts || [];

  switch (sectionId) {
    case 'household':
      return Boolean(h?.type);
    case 'location':
      return Boolean(loc?.country || loc?.city || loc?.currency);
    case 'budget':
      return budget?.monthlyFlexible != null && budget.monthlyFlexible !== '';
    case 'income': {
      if (!inc) return false;
      if (inc.amount != null && inc.amount !== '') return true;
      if (inc.partnerAmount != null && inc.partnerAmount !== '') return true;
      if (inc.savingsBalance != null && inc.savingsBalance !== '') return true;
      return (inc.otherIncomeRows || []).some((row) => row.amount != null && row.amount !== '');
    }
    case 'health':
      return Boolean(health && typeof health === 'object' && Object.keys(health).length > 0);
    case 'transport': {
      if (!transport) return false;
      if (financials.transportMonthly > 0) return true;
      if (transport.hasVehicle) {
        if (parseReviewAmount(transport.fuelCost) > 0) return true;
        if (transport.hasInsurance && parseReviewAmount(transport.insurancePremium) > 0) return true;
        if (transport.hasParking && parseReviewAmount(transport.parkingAmount) > 0) return true;
      }
      if (transport.hasPublicTransport && parseReviewAmount(transport.ptAmount) > 0) return true;
      return false;
    }
    case 'childrenCosts':
      return financials.childTotals.some((child) => child.total > 0);
    case 'subscriptions':
      return subs.some((sub) => parseReviewAmount(sub.cost) > 0);
    case 'otherCosts':
      return otherCosts.some((cost) => parseReviewAmount(cost.amount) > 0);
    case 'pets':
      return pets.some(
        (pet) => parseReviewAmount(pet.foodAmount) > 0 || parseReviewAmount(pet.vetAmount) > 0,
      );
    case 'debts':
      return debts.length > 0;
    default:
      return false;
  }
}

export function filterVisibleReviewSections(allData, ctx) {
  return REVIEW_SECTION_META.filter((section) => sectionHasEnteredData(section.id, ctx));
}
