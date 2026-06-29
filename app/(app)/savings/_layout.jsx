import { Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme';
import { C } from '../../../constants/onboarding-theme';

export default function SavingsLayout() {
  useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        contentStyle: { flex: 1, backgroundColor: C.bg },
      }}
    />
  );
}
