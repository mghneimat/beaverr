import {
  mergeVehiclesFromCounts,
  vehicleCountsMatch,
  hydrateTransportFormState,
  transportUiStepToSemantic,
  transportSemanticToUiStep,
} from '../../../lib/transport/transportFlow';

describe('transportFlow vehicle merge', () => {
  it('preserves fuel and insurance when counts are unchanged', () => {
    const existing = mergeVehiclesFromCounts({ passenger: 1, motorcycle: 0, bicycle: 0 });
    existing[0].fuelType = 'petrol';
    existing[0].fuelCost = '3500';
    existing[0].insurancePremium = '12000';

    const merged = mergeVehiclesFromCounts({ passenger: 1, motorcycle: 0, bicycle: 0 }, existing);
    expect(merged).toHaveLength(1);
    expect(merged[0].fuelType).toBe('petrol');
    expect(merged[0].fuelCost).toBe('3500');
    expect(merged[0].insurancePremium).toBe('12000');
  });

  it('detects when vehicle counts no longer match saved vehicles', () => {
    const vehicles = mergeVehiclesFromCounts({ passenger: 1, motorcycle: 0, bicycle: 0 });
    expect(vehicleCountsMatch({ passenger: 1, motorcycle: 0, bicycle: 0 }, vehicles)).toBe(true);
    expect(vehicleCountsMatch({ passenger: 2, motorcycle: 0, bicycle: 0 }, vehicles)).toBe(false);
  });
});

describe('transportFlow hydration', () => {
  it('restores public transport draft and onboarding step', () => {
    const state = hydrateTransportFormState({
      hasVehicle: false,
      hasPublicTransport: true,
      ptAmount: 550,
      ptFrequency: 'monthly',
      transportOnboardingStep: 'publicTransport',
    });

    expect(state.step).toBe('public-transport');
    expect(state.hasPublicTransport).toBe(true);
    expect(state.ptAmount).toBe('550');
  });

  it('maps semantic steps to UI step ids', () => {
    expect(transportSemanticToUiStep('vehicleFuel')).toBe('vehicle-fuel');
    expect(transportUiStepToSemantic('public-transport')).toBe('publicTransport');
  });
});
