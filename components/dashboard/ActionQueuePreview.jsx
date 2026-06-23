import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import { getAlertActionLabelKey } from '../../lib/dashboardAlerts';

const URGENCY_COLORS = {
  high: C.danger,
  medium: C.infoText,
  low: C.muted,
};

function AlertRow({ alert, message, actionLabel, onAction }) {
  return (
    <View style={{
      borderTopWidth: 1,
      borderTopColor: C.divider,
      paddingVertical: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: URGENCY_COLORS[alert.urgency] || C.muted,
          marginTop: 6,
        }} />
        <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: C.text }}>{message}</Text>
      </View>
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        style={({ pressed, hovered }) => ({
          alignSelf: 'flex-start',
          marginTop: 10,
          marginLeft: 18,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: R.button,
          backgroundColor: pressed
            ? C.pillSelectedPressed
            : hovered
              ? C.pillSelectedPressed
              : C.pillSelectedBg,
          minHeight: 36,
          justifyContent: 'center',
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function ActionQueuePreview({ title, alerts, t, viewAllLabel, onViewAll }) {
  const router = useRouter();

  if (!alerts.length) return null;

  const viewAllTrailing = onViewAll ? (
    <Pressable
      onPress={onViewAll}
      accessibilityRole="button"
      accessibilityLabel={viewAllLabel}
      style={({ pressed, hovered }) => ({
        opacity: pressed ? 0.7 : 1,
        minHeight: 36,
        justifyContent: 'center',
        paddingHorizontal: 4,
        backgroundColor: hovered ? C.overlayHover : 'transparent',
        borderRadius: 6,
      })}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>{viewAllLabel}</Text>
    </Pressable>
  ) : null;

  return (
    <SurfaceCard style={{ paddingTop: 4 }}>
      <InCardSectionHeader title={title} trailing={viewAllTrailing} />
      {alerts.map((alert) => (
        <AlertRow
          key={alert.id}
          alert={alert}
          message={t(alert.messageKey, alert.messageParams)}
          actionLabel={t(getAlertActionLabelKey(alert))}
          onAction={() => {
            if (alert.actionRoute) router.push(alert.actionRoute);
          }}
        />
      ))}
    </SurfaceCard>
  );
}
