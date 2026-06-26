import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from './i18n';
import { getOnboardingState } from './onboardingProgress';
import { navigateBack } from './onboardingNavigation';
import { shouldConfirmLeaveToDashboard } from './onboardingLeave';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * Hook for onboarding entry screens — confirm before returning to dashboard.
 * @param {string} route
 */
export default function useLeaveToDashboardConfirm(route) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const requestLeave = async (action) => {
    const state = await getOnboardingState();
    if (shouldConfirmLeaveToDashboard(state, route)) {
      setPendingAction(() => action);
      setOpen(true);
      return;
    }
    action();
  };

  const handleBackWithConfirm = () => {
    requestLeave(() => navigateBack());
  };

  const handleLeaveToDashboard = () => {
    requestLeave(() => router.replace('/(app)/dashboard'));
  };

  const handleLeaveConfirm = () => {
    setOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action) action();
  };

  const dialog = (
    <ConfirmDialog
      visible={open}
      title={t('onboarding.leave.title')}
      message={t('onboarding.leave.message')}
      confirmLabel={t('onboarding.leave.confirm')}
      cancelLabel={t('common.cancel')}
      onConfirm={handleLeaveConfirm}
      onCancel={() => {
        setOpen(false);
        setPendingAction(null);
      }}
    />
  );

  return {
    requestLeave,
    handleBackWithConfirm,
    handleLeaveToDashboard,
    leaveDialog: dialog,
  };
}
