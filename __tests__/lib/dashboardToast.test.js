import {
  emitDashboardToast,
  emitDashboardToastAfterNavigation,
  subscribeDashboardToast,
} from '../../lib/dashboardToast';

describe('dashboardToast', () => {
  test('queues toast until a listener subscribes', () => {
    emitDashboardToast('questionnaireProgressSaved');

    const listener = jest.fn();
    const unsubscribe = subscribeDashboardToast(listener);

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'questionnaireProgressSaved',
    }));

    unsubscribe();
  });

  test('emitDashboardToastAfterNavigation delivers after animation frames', () => {
    jest.useFakeTimers();
    const raf = jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation((cb) => setTimeout(cb, 0));

    const listener = jest.fn();
    const unsubscribe = subscribeDashboardToast(listener);

    emitDashboardToastAfterNavigation('questionnaireProgressDeleted');

    expect(listener).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'questionnaireProgressDeleted',
    }));

    unsubscribe();
    raf.mockRestore();
    jest.useRealTimers();
  });
});
