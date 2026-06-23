import {
  isReminderEffectivelyEnabled,
  isReminderDateAllowed,
  getReminderMinSelectableDate,
  normalizeReminderTypes,
  resolveDraftReminderTypes,
  hasReminderPrefChanged,
  resolveReminderSaveToastKind,
} from '../../lib/reminderPreferences';

describe('isReminderEffectivelyEnabled', () => {
  it('is false without next payment date', () => {
    expect(isReminderEffectivelyEnabled({ enabled: true, reminderTypes: ['push'] }, { hasNextPayment: false })).toBe(false);
  });

  it('is false when reminder types are empty', () => {
    expect(isReminderEffectivelyEnabled({ enabled: true, reminderTypes: [] }, { hasNextPayment: true })).toBe(false);
  });

  it('is false when user disabled reminder', () => {
    expect(isReminderEffectivelyEnabled({ enabled: false, reminderTypes: ['push'] }, { hasNextPayment: true })).toBe(false);
  });

  it('is true when next payment, enabled, and type selected', () => {
    expect(isReminderEffectivelyEnabled({ enabled: true, reminderTypes: ['push'] }, { hasNextPayment: true })).toBe(true);
  });
});

describe('resolveDraftReminderTypes', () => {
  it('defaults to push when empty', () => {
    expect(resolveDraftReminderTypes([])).toEqual(['push']);
  });

  it('keeps stored types', () => {
    expect(resolveDraftReminderTypes(['email'])).toEqual(['email']);
  });
});

describe('normalizeReminderTypes', () => {
  it('filters unknown keys', () => {
    expect(normalizeReminderTypes(['push', 'sms'])).toEqual(['push']);
  });
});

describe('isReminderDateAllowed', () => {
  const now = new Date(2026, 5, 15);

  it('rejects today', () => {
    expect(isReminderDateAllowed('15/06/2026', now)).toBe(false);
  });

  it('rejects past dates', () => {
    expect(isReminderDateAllowed('14/06/2026', now)).toBe(false);
  });

  it('allows tomorrow', () => {
    expect(isReminderDateAllowed('16/06/2026', now)).toBe(true);
  });

  it('allows future dates', () => {
    expect(isReminderDateAllowed('01/07/2026', now)).toBe(true);
  });
});

describe('getReminderMinSelectableDate', () => {
  it('returns tomorrow at local midnight', () => {
    const now = new Date(2026, 5, 15, 23, 59);
    const min = getReminderMinSelectableDate(now);
    expect(min.getFullYear()).toBe(2026);
    expect(min.getMonth()).toBe(5);
    expect(min.getDate()).toBe(16);
  });
});

describe('hasReminderPrefChanged', () => {
  const base = {
    enabled: true,
    leadDays: 7,
    remindOnDate: '16/06/2026',
    reminderTypes: ['push'],
  };

  it('is false when nothing changed', () => {
    expect(hasReminderPrefChanged(base, { ...base })).toBe(false);
  });

  it('detects remind date change', () => {
    expect(hasReminderPrefChanged(base, { ...base, remindOnDate: '20/06/2026' })).toBe(true);
  });

  it('detects reminder type change', () => {
    expect(hasReminderPrefChanged(base, { ...base, reminderTypes: ['email'] })).toBe(true);
  });
});

describe('resolveReminderSaveToastKind', () => {
  const base = {
    enabled: true,
    leadDays: 7,
    remindOnDate: '16/06/2026',
    reminderTypes: ['push'],
  };

  it('returns null when unchanged', () => {
    expect(resolveReminderSaveToastKind(base, { ...base })).toBeNull();
  });

  it('returns reminderUpdated for date-only change', () => {
    expect(resolveReminderSaveToastKind(base, { ...base, remindOnDate: '20/06/2026' }))
      .toBe('reminderUpdated');
  });

  it('returns reminderActivated when turned on', () => {
    expect(resolveReminderSaveToastKind(
      { ...base, enabled: false, reminderTypes: [] },
      base,
    )).toBe('reminderActivated');
  });

  it('returns reminderDisabled when turned off', () => {
    expect(resolveReminderSaveToastKind(
      base,
      { ...base, enabled: false, reminderTypes: [] },
    )).toBe('reminderDisabled');
  });
});
