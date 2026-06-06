import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getData } from '../lib/storage';
import { View, ActivityIndicator } from 'react-native';
import { C } from '../constants/onboarding-theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const onboarding = await getData('pocketos_onboarding');
        const completed = onboarding?.completed === true;
        
        if (completed) {
          router.replace('/(app)/dashboard');
        } else {
          router.replace('/(onboarding)/welcome');
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        // Default to onboarding if error
        router.replace('/(onboarding)/welcome');
      }
    }

    checkOnboarding();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );
}
