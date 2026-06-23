import { useI18n } from '../../lib/i18n';
import SubscriptionCategoryIcon from './SubscriptionCategoryIcon';
import OnboardingCategoryAccordion from './OnboardingCategoryAccordion';

/**
 * Subscription category accordion — wraps shared picker with subscription icons.
 */
export default function SubscriptionCategoryAccordion(props) {
  const { t } = useI18n();
  const {
    services,
    serviceLabel,
    isSelected,
    onToggleService,
    ...rest
  } = props;

  return (
    <OnboardingCategoryAccordion
      {...rest}
      itemKeys={services.filter((k) => k !== 'other')}
      itemLabel={serviceLabel}
      isItemSelected={isSelected}
      onToggleItem={onToggleService}
      customPlaceholder={t('onboarding.subscriptions.serviceSelection.customPlaceholder')}
      customAccessibilityLabel={t('onboarding.subscriptions.serviceSelection.customLabel')}
      cancelAccessibilityLabel={t('common.cancel')}
      renderIcon={(id) => <SubscriptionCategoryIcon categoryId={id} size={40} />}
    />
  );
}
