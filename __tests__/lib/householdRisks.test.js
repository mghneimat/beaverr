import { collectVehicleInsuranceRisks, collectHouseholdRisks } from '../../lib/householdRisks';

const t = (key, params) => {
  const map = {
    'onboarding.transport.vehicleCounts.passenger': 'Passenger car',
    'onboarding.transport.vehicleCounts.motorcycle': 'Motorcycle',
    'dashboard.risks.vehicleTplLiability': `${params?.category} — third-party liability limit`,
    'dashboard.risks.vehicleTplLiabilityN': `Vehicle ${params?.n} (${params?.category}) — third-party liability limit`,
  };
  return map[key] || key;
};

describe('collectVehicleInsuranceRisks', () => {
  it('returns TPL liability exposure when set', () => {
    const risks = collectVehicleInsuranceRisks({
      hasVehicle: true,
      vehicles: [{
        category: 'passenger',
        hasInsurance: true,
        insuranceCoverageType: 'tpl',
        insuranceLiabilityAmount: 50000000,
      }],
    }, t);

    expect(risks).toHaveLength(1);
    expect(risks[0].exposureAmount).toBe(50000000);
    expect(risks[0].kind).toBe('vehicle_tpl_liability');
  });

  it('skips comprehensive coverage and missing liability amounts', () => {
    const risks = collectVehicleInsuranceRisks({
      hasVehicle: true,
      vehicles: [
        { category: 'passenger', hasInsurance: true, insuranceCoverageType: 'comprehensive', insurancePremium: 6000 },
        { category: 'motorcycle', hasInsurance: true, insuranceCoverageType: 'tpl', insuranceLiabilityAmount: '' },
      ],
    }, t);

    expect(risks).toHaveLength(0);
  });
});

describe('collectHouseholdRisks', () => {
  it('aggregates transport risks from sections', () => {
    const risks = collectHouseholdRisks({
      transport: {
        hasVehicle: true,
        vehicles: [{
          category: 'bicycle',
          hasInsurance: true,
          insuranceCoverageType: 'tpl',
          insuranceLiabilityAmount: 1000000,
        }],
      },
    }, t);

    expect(risks).toHaveLength(1);
    expect(risks[0].exposureAmount).toBe(1000000);
  });
});
