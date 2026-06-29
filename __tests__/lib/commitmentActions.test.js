import {
  advanceDueDate,
  applyDeleteToSections,
  applyRenewToSections,
  computeCommitmentProgress,
  resolveCommitmentFrequency,
  resolveCommitmentSource,
} from '../../lib/commitmentActions';

describe('computeCommitmentProgress', () => {
  it('caps percent at 100 and marks complete when balance meets target', () => {
    const progress = computeCommitmentProgress({
      balance: 3000,
      sinkingTargetAmount: 3000,
      sinkingDueDate: '01/12/2026',
    });
    expect(progress.percent).toBe(100);
    expect(progress.isComplete).toBe(true);
  });

  it('computes partial progress below target', () => {
    const progress = computeCommitmentProgress({
      balance: 750,
      sinkingTargetAmount: 3000,
      sinkingDueDate: '01/12/2026',
    });
    expect(progress.percent).toBe(25);
    expect(progress.isComplete).toBe(false);
  });
});

describe('advanceDueDate', () => {
  it('advances annual dates by one year', () => {
    expect(advanceDueDate('01/06/2026', 'annual')).toBe('01/06/2027');
  });

  it('advances quarterly dates by three months', () => {
    expect(advanceDueDate('01/06/2026', 'quarterly')).toBe('01/09/2026');
  });
});

describe('resolveCommitmentSource', () => {
  it('maps subscription source keys to annual frequency', () => {
    const resolved = resolveCommitmentSource({
      name: 'Alza Plus renewal',
      sinkingSourceKey: 'subscription:sub1',
    }, {
      subs: [{ id: 'sub1', frequency: 'annual' }],
    });
    expect(resolved?.sourceKey).toBe('subscription:sub1');
    expect(resolved?.frequency).toBe('annual');
    expect(resolved?.canDelete).toBe(true);
  });
});

describe('applyRenewToSections', () => {
  it('advances subscription renewal dates', () => {
    const sections = {
      subs: [{
        id: 'sub1',
        cost: 3000,
        frequency: 'annual',
        endDate: '01/06/2026',
      }],
    };
    expect(applyRenewToSections(sections, 'subscription:sub1', 'annual')).toBe(true);
    expect(sections.subs[0].endDate).toBe('01/06/2027');
  });
});

describe('applyDeleteToSections', () => {
  it('removes subscription rows', () => {
    const sections = {
      subs: [{ id: 'sub1' }, { id: 'sub2' }],
    };
    expect(applyDeleteToSections(sections, 'subscription:sub1')).toBe(true);
    expect(sections.subs).toHaveLength(1);
    expect(sections.subs[0].id).toBe('sub2');
  });
});

describe('resolveCommitmentFrequency', () => {
  it('reads quarterly frequency from child cost fields', () => {
    const frequency = resolveCommitmentFrequency({
      sinkingSourceKey: 'child_cost:child_0:school',
    }, {
      childrenCosts: {
        child_0: {
          school: { frequency: 'quarterly' },
        },
      },
    });
    expect(frequency).toBe('quarterly');
  });
});
