import {
  monthsRemainingUntil,
  computeRenewalSavingsPlan,
  getHealthMemberBudgetLine,
  getHealthMemberMonthlyAmount,
  getVehicleInsuranceBudgetLine,
  getVehicleInsuranceMonthlyAmount,
  isPrepaidFixedContract,
} from '../../lib/healthInsuranceBudget';

describe('monthsRemainingUntil', () => {
  it('counts calendar months inclusively from today through end month', () => {
    const from = new Date(2026, 5, 8); // June 2026
    expect(monthsRemainingUntil('08/2026', from)).toBe(3); // Jun, Jul, Aug
  });

  it('returns 0 when end date is in the past', () => {
    const from = new Date(2026, 8, 1); // Sep 2026
    expect(monthsRemainingUntil('06/2026', from)).toBe(0);
  });
});

describe('computeRenewalSavingsPlan', () => {
  it('splits lump premium over months remaining', () => {
    const from = new Date(2026, 5, 8);
    const plan = computeRenewalSavingsPlan({
      premium: 12000,
      endDate: '08/2026',
      savingsBalance: 0,
      now: from,
    });
    expect(plan.monthsRemaining).toBe(3);
    expect(plan.suggestedMonthly).toBe(4000);
    expect(plan.isTight).toBe(true);
  });

  it('parses comma-formatted premium strings from amount inputs', () => {
    const from = new Date(2026, 5, 8);
    const plan = computeRenewalSavingsPlan({
      premium: '22500,00',
      endDate: '08/2026',
      savingsBalance: 0,
      now: from,
    });
    expect(plan.totalNeeded).toBe(22500);
    expect(plan.monthsRemaining).toBe(3);
    expect(plan.suggestedMonthly).toBe(7500);
  });
});

describe('getHealthMemberBudgetLine', () => {
  const base = {
    confirmed: true,
    coverage: 'private',
    premium: 12000,
    frequency: 'annual',
    endDateType: 'fixed',
    endDate: '08/2026',
    premiumPaidInFull: true,
    renewalPlan: 'renew',
    budgetForRenewal: true,
    renewalBudgetMode: 'suggested',
  };

  it('returns no line for prepaid renew when budgeting is skipped', () => {
    expect(getHealthMemberBudgetLine({
      ...base,
      budgetForRenewal: false,
      renewalBudgetMode: 'skip',
    })).toBeNull();
  });

  it('amortizes prepaid renewal over months remaining, not annual frequency', () => {
    const line = getHealthMemberBudgetLine(base);
    expect(line).toEqual({ amount: 4000, frequency: 'monthly' });
  });

  it('uses custom monthly reserve when selected', () => {
    const line = getHealthMemberBudgetLine({
      ...base,
      renewalBudgetMode: 'custom',
      renewalCustomMonthly: 1500,
    });
    expect(line).toEqual({ amount: 1500, frequency: 'monthly' });
  });

  it('amortizes prepaid switch premium over months remaining, not payment frequency', () => {
    const line = getHealthMemberBudgetLine({
      ...base,
      renewalPlan: 'switch',
      budgetForSwitch: true,
      switchPremiumAmount: 12000,
      switchPremiumFrequency: 'monthly',
    });
    expect(line).toEqual({ amount: 4000, frequency: 'monthly' });
  });

  it('uses custom monthly reserve for prepaid switch plan', () => {
    const line = getHealthMemberBudgetLine({
      ...base,
      renewalPlan: 'switch',
      budgetForSwitch: true,
      switchPremiumAmount: 12000,
      renewalBudgetMode: 'custom',
      renewalCustomMonthly: 1800,
    });
    expect(line).toEqual({ amount: 1800, frequency: 'monthly' });
  });

  it('keeps standard frequency conversion when not prepaid', () => {
    const line = getHealthMemberBudgetLine({
      confirmed: true,
      coverage: 'private',
      premium: 12000,
      frequency: 'annual',
    });
    expect(line).toEqual({ amount: 12000, frequency: 'annual' });
  });
});

describe('getHealthMemberMonthlyAmount', () => {
  it('converts prepaid renewal reserve to monthly amount', () => {
    const monthly = getHealthMemberMonthlyAmount({
      confirmed: true,
      coverage: 'private',
      premium: 9000,
      frequency: 'annual',
      endDateType: 'fixed',
      endDate: '09/2026',
      premiumPaidInFull: true,
      renewalPlan: 'renew',
      budgetForRenewal: true,
      renewalBudgetMode: 'custom',
      renewalCustomMonthly: 2000,
    });
    expect(monthly).toBe(2000);
  });
});

describe('isPrepaidFixedContract', () => {
  it('detects prepaid fixed contracts', () => {
    expect(isPrepaidFixedContract({ endDateType: 'fixed', premiumPaidInFull: true })).toBe(true);
    expect(isPrepaidFixedContract({ endDateType: 'fixed', premiumPaidInFull: false })).toBe(false);
  });
});

describe('getVehicleInsuranceBudgetLine', () => {
  const prepaidVehicle = {
    hasInsurance: true,
    insurancePremium: 22500,
    insuranceFrequency: 'annual',
    insuranceEndDateType: 'fixed',
    insuranceEndDate: '08/2026',
    insurancePremiumPaidInFull: true,
    insuranceRenewalPlan: 'renew',
    insuranceBudgetForRenewal: true,
    insuranceRenewalBudgetMode: 'custom',
    insuranceRenewalCustomMonthly: 1875,
  };

  it('uses monthly renewal reserve for prepaid fixed vehicle contracts', () => {
    expect(getVehicleInsuranceBudgetLine(prepaidVehicle)).toEqual({
      amount: 1875,
      frequency: 'monthly',
    });
  });

  it('excludes prepaid vehicle premium when renewal budgeting is skipped', () => {
    expect(getVehicleInsuranceBudgetLine({
      ...prepaidVehicle,
      insuranceBudgetForRenewal: false,
      insuranceRenewalBudgetMode: 'skip',
    })).toBeNull();
  });

  it('keeps standard frequency conversion when vehicle contract is not prepaid', () => {
    expect(getVehicleInsuranceBudgetLine({
      hasInsurance: true,
      insurancePremium: 12000,
      insuranceFrequency: 'annual',
    })).toEqual({ amount: 12000, frequency: 'annual' });
  });
});

describe('getVehicleInsuranceMonthlyAmount', () => {
  it('returns the monthly reserve amount directly for prepaid renewals', () => {
    expect(getVehicleInsuranceMonthlyAmount({
      hasInsurance: true,
      insurancePremium: 22500,
      insuranceFrequency: 'annual',
      insuranceEndDateType: 'fixed',
      insuranceEndDate: '08/2026',
      insurancePremiumPaidInFull: true,
      insuranceRenewalPlan: 'renew',
      insuranceBudgetForRenewal: true,
      insuranceRenewalBudgetMode: 'custom',
      insuranceRenewalCustomMonthly: 1875,
    })).toBe(1875);
  });
});
