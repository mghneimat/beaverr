import { getDashboardLayout, ledgerColumnMinWidth } from '../../lib/dashboardLayout';
import { PHONE_MAX, DASHBOARD_WIDE_BREAKPOINT } from '../../lib/layoutBreakpoints';

describe('getDashboardLayout', () => {
  it('returns card table layout below phone breakpoint', () => {
    expect(getDashboardLayout(375)).toMatchObject({
      isPhone: true,
      isNarrow: true,
      tableLayout: 'card',
      pagePadH: 16,
      titleFontSize: 24,
    });
  });

  it('returns table layout at tablet width', () => {
    expect(getDashboardLayout(767)).toMatchObject({
      isPhone: false,
      isNarrow: true,
      tableLayout: 'table',
    });
    expect(getDashboardLayout(768).isNarrow).toBe(false);
  });

  it('returns wide layout at desktop width', () => {
    expect(getDashboardLayout(1024)).toMatchObject({
      isPhone: false,
      isNarrow: false,
      tableLayout: 'table',
      pagePadH: 20,
      titleFontSize: 28,
    });
  });

  it('uses shared breakpoint constants', () => {
    expect(getDashboardLayout(PHONE_MAX - 1).isPhone).toBe(true);
    expect(getDashboardLayout(PHONE_MAX).isPhone).toBe(false);
    expect(getDashboardLayout(DASHBOARD_WIDE_BREAKPOINT - 1).isNarrow).toBe(true);
    expect(getDashboardLayout(DASHBOARD_WIDE_BREAKPOINT).isNarrow).toBe(false);
  });
});

describe('ledgerColumnMinWidth', () => {
  it('keeps amount column mins in table mode', () => {
    expect(ledgerColumnMinWidth('amount', false)).toBe(76);
    expect(ledgerColumnMinWidth('amount', true)).toBe(68);
  });
});
