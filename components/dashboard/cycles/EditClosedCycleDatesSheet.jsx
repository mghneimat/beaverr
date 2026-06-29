import DashboardScrollSheet from '../DashboardScrollSheet';
import CycleDatesEditForm from './CycleDatesEditForm';

export default function EditClosedCycleDatesSheet({
  visible,
  onClose,
  cycle,
  budget,
  dailyLogs = [],
  cycleAdjustments = [],
}) {
  const { t } = useI18n();

  if (!cycle) return null;

  return (
    <DashboardScrollSheet
      visible={visible}
      onClose={onClose}
      closeA11yLabel={t('dashboard.cycles.editDates.closeA11y')}
    >
      <CycleDatesEditForm
        cycle={cycle}
        budget={budget}
        dailyLogs={dailyLogs}
        cycleAdjustments={cycleAdjustments}
        onDone={onClose}
        onCancel={onClose}
        showIntro
      />
    </DashboardScrollSheet>
  );
}
