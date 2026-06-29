import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';
import { OutlineButton } from '../ui/OutlineButton';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

/**
 * Empty breakdown panel with optional primary/secondary actions.
 */
export default function BreakdownEmptyState({
  message,
  hint,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <View style={{ marginTop: 24, alignItems: 'stretch', gap: 12 }}>
      <DashboardSectionEmptyMessage message={message} variant="centered" />
      {hint ? (
        <Text style={{ ...T.helper, color: C.muted, textAlign: 'center' }}>{hint}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton onPress={onAction} fullWidth={false} style={{ alignSelf: 'stretch' }}>
          {actionLabel}
        </PrimaryButton>
      ) : null}
      {secondaryLabel && onSecondary ? (
        <OutlineButton onPress={onSecondary} style={{ alignSelf: 'stretch' }}>
          {secondaryLabel}
        </OutlineButton>
      ) : null}
    </View>
  );
}
