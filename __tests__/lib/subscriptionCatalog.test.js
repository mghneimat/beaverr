import {
  getSubscriptionCatalog,
  getSubscriptionCategoryOrder,
  GLOBAL_SUBSCRIPTION_CATALOG,
} from '../../lib/subscriptionCatalog';

describe('getSubscriptionCatalog', () => {
  it('returns global catalog for non-CZ countries', () => {
    const catalog = getSubscriptionCatalog('DE');
    expect(catalog.entertainmentStreaming).not.toContain('oneplay');
    expect(catalog.healthWellbeing).not.toContain('multisport');
    expect(catalog.telecomsUtilities).toContain('mobilePhone');
  });

  it('merges CZ-specific services onto global catalog', () => {
    const catalog = getSubscriptionCatalog('CZ');
    expect(catalog.entertainmentStreaming).toContain('oneplay');
    expect(catalog.entertainmentStreaming).toContain('netflix');
    expect(catalog.healthWellbeing).toContain('multisport');
    expect(catalog.newsReading).toContain('denikN');
    expect(catalog.foodDelivery).toContain('rohlikXtra');
    expect(catalog.travelTransport).toContain('pidLitacka');
    expect(catalog.telecomsUtilities).toContain('o2');
    expect(catalog.telecomsUtilities).not.toContain('mobilePhone');
  });

  it('does not include groceries or personalCare category', () => {
    const order = getSubscriptionCategoryOrder('CZ');
    expect(order).not.toContain('personalCare');
    Object.values(getSubscriptionCatalog('CZ')).forEach((services) => {
      expect(services).not.toContain('groceries');
      expect(services).not.toContain('hairSalon');
    });
  });

  it('keeps other as the last service in every category', () => {
    Object.values(getSubscriptionCatalog('CZ')).forEach((services) => {
      expect(services[services.length - 1]).toBe('other');
    });
  });

  it('includes global productivity and education updates', () => {
    expect(GLOBAL_SUBSCRIPTION_CATALOG.education).toContain('duolingo');
    expect(GLOBAL_SUBSCRIPTION_CATALOG.education).toContain('linkedinLearning');
    expect(GLOBAL_SUBSCRIPTION_CATALOG.itTech).toContain('aiAssistant');
    expect(GLOBAL_SUBSCRIPTION_CATALOG.productivity).toContain('todoist');
    expect(GLOBAL_SUBSCRIPTION_CATALOG.foodDelivery).not.toContain('groceries');
  });
});
