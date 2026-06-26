import {
  resolveInitialIncomeStep,
  validateOtherIncomeContinue,
  getIncomeBackTarget,
  hasPriorSalaryIncome,
  resolveIncomeContinue,
} from '../../lib/incomeFlow';

describe('resolveInitialIncomeStep', () => {
  it('starts at partner income when user not working but partner is', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: true,
      userOccupation: 'notWorking',
      partnerOccupation: 'employee',
    })).toBe('partnerIncome');
  });

  it('starts at other income when both are not working', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: true,
      userOccupation: 'notWorking',
      partnerOccupation: 'notWorking',
    })).toBe('otherIncome');
  });

  it('starts at other income for solo not-working household', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: false,
      userOccupation: 'notWorking',
    })).toBe('otherIncome');
  });

  it('quick mode starts at your income for working solo user', () => {
    expect(resolveInitialIncomeStep({
      isEditMode: false,
      hasPartner: false,
      userOccupation: 'employee',
      quickMode: true,
    })).toBe('yourIncome');
  });
});

describe('validateOtherIncomeContinue', () => {
  const rows = [{ visible: true, amount: '5000', frequency: 'monthly', sourceKey: 'rentalIncome', customLabel: '' }];

  it('requires other income when no salary was entered', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: false,
      otherIncomeRows: [],
      phase: 'select',
    })).toBe('validationNoIncome');
  });

  it('requires amounts when fill step has empty amounts', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: false,
      otherIncomeRows: [{ visible: true, amount: '', sourceKey: 'rentalIncome', customLabel: '' }],
      phase: 'fill',
    })).toBe('validationOtherAmount');
  });

  it('requires a name for custom sources with amount', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: false,
      otherIncomeRows: [{ visible: true, amount: '5000', sourceKey: 'other', customLabel: '' }],
      phase: 'fill',
    })).toBe('validationOtherLabel');
  });

  it('allows skip when salary exists and no selections', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: true,
      otherIncomeRows: [],
      phase: 'select',
    })).toBeNull();
  });

  it('passes fill when rows are complete', () => {
    expect(validateOtherIncomeContinue({
      hasPriorSalary: false,
      otherIncomeRows: rows,
      phase: 'fill',
    })).toBeNull();
  });
});

describe('getIncomeBackTarget', () => {
  it('returns splash when backing out of skipped partner-income step', () => {
    expect(getIncomeBackTarget({
      step: 'partnerIncome',
      hasPartner: true,
      isNotWorking: true,
      partnerIsNotWorking: false,
    })).toBe('splash');
  });
});

describe('hasPriorSalaryIncome', () => {
  it('detects partner salary only', () => {
    expect(hasPriorSalaryIncome({
      isNotWorking: true,
      incomeAmount: '',
      hasPartner: true,
      partnerIsNotWorking: false,
      partnerIncomeAmount: '62000',
    })).toBe(true);
  });
});

describe('resolveIncomeContinue', () => {
  it('advances from yourIncome to otherIncome when solo', () => {
    const result = resolveIncomeContinue({
      step: 'yourIncome',
      isNotWorking: false,
      incomeAmount: '50000',
      hasPartner: false,
      partnerIsNotWorking: false,
      partnerIncomeAmount: '',
      otherIncomeStep: 'select',
      otherIncomeRows: [],
    });
    expect(result).toEqual({ type: 'nextStep', step: 'otherIncome' });
  });

  it('quick mode completes after partner income', () => {
    expect(resolveIncomeContinue({
      step: 'partnerIncome',
      partnerIncomeAmount: '50000',
      quickMode: true,
    })).toEqual({ type: 'complete' });
  });

  it('quick mode completes after your income when solo', () => {
    expect(resolveIncomeContinue({
      step: 'yourIncome',
      isNotWorking: false,
      incomeAmount: '50000',
      hasPartner: false,
      partnerIsNotWorking: false,
      quickMode: true,
    })).toEqual({ type: 'complete' });
  });
});
