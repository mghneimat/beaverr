import { resolveProfileMenuName } from '../../lib/profileDisplay';

const t = (key) => (key === 'dashboard.headerToolbar.defaultDisplayName' ? 'Account' : key);

describe('resolveProfileMenuName', () => {
  it('joins explicit first and last name from account fields', () => {
    expect(resolveProfileMenuName(
      { displayName: 'Account 1' },
      t,
      null,
      { firstName: 'Test', lastName: 'Account 1', username: 'tester1' },
    )).toBe('Test Account 1');
  });

  it('uses household display name when account fields are missing', () => {
    expect(resolveProfileMenuName(
      { displayName: 'Test Account 1' },
      t,
      null,
      null,
    )).toBe('Test Account 1');
  });

  it('merges auth given and family names before fallback', () => {
    expect(resolveProfileMenuName(
      null,
      t,
      { user_metadata: { given_name: 'Test', family_name: 'Account 1' } },
      null,
    )).toBe('Test Account 1');
  });
});
