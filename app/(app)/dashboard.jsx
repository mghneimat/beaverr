import { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import DashboardHome from '../../components/dashboard/DashboardHome';
import DashboardErrorBoundary from '../../components/dashboard/DashboardErrorBoundary';
import AppScreenShell from '../../components/app/AppScreenShell';

export default function DashboardScreen() {
  const { t } = useI18n();
  const [resetKey, setResetKey] = useState(0);

  return (
    <DashboardErrorBoundary
      title={t('dashboard.errorBoundary.title')}
      body={t('dashboard.errorBoundary.body')}
      retryLabel={t('common.retry')}
      onReset={() => setResetKey((k) => k + 1)}
    >
      <AppScreenShell variant="dashboard">
        <DashboardHome key={resetKey} />
      </AppScreenShell>
    </DashboardErrorBoundary>
  );
}
