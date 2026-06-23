# Expo SDK 56 + Router — Examples

## Minimal root layout

```jsx
// app/_layout.jsx
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
```

## Launch redirect screen

```jsx
// app/index.jsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getData } from '../lib/storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      const onboarding = await getData('beaverr_onboarding');
      if (onboarding?.completed) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    }
    route();
  }, []);

  return null; // or loading spinner
}
```

## Onboarding splash screen

```jsx
// app/(onboarding)/splash-housing.jsx
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import SplashScreen from '../../components/onboarding/SplashScreen';

export default function SplashHousing() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SplashScreen
      heading={t('onboarding.s4.heading')}
      onContinue={() => router.replace('/(onboarding)/housing')}
      onBack={() => router.replace('/(onboarding)/income')}
    />
  );
}
```

## Question screen with storage + navigation

```jsx
// app/(onboarding)/location.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { getData, setData } from '../../lib/storage';
import QuestionScreen from '../../components/onboarding/QuestionScreen';

export default function LocationScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [city, setCity] = useState('');

  useEffect(() => {
    getData('beaverr_location').then((data) => {
      if (data?.city) setCity(data.city);
    });
  }, []);

  async function handleContinue() {
    await setData('beaverr_location', { city });
    router.replace('/(onboarding)/occupation');
  }

  return (
    <QuestionScreen
      title={t('onboarding.location.title')}
      onContinue={handleContinue}
      onBack={() => router.replace('/(onboarding)/splash-location')}
    />
  );
}
```

## Register route in group layout

```jsx
// app/(onboarding)/_layout.jsx — excerpt
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="splash-housing" />
  <Stack.Screen name="housing" />
  {/* insert new screens in flow order */}
</Stack>
```

## Custom tab bar (PocketOS pattern)

```jsx
// app/(app)/_layout.jsx — excerpt
import { Tabs, useSegments, useRouter } from 'expo-router';

export default function AppLayout() {
  const router = useRouter();
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={() => (
        <View>
          {TABS.map(({ name, labelKey }) => (
            <Pressable
              key={name}
              onPress={() => router.push(`/(app)/${name}`)}
            >
              <Text>{t(labelKey)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="alerts" options={{ href: null }} />
    </Tabs>
  );
}
```

## Declarative link

```jsx
import { Link } from 'expo-router';

<Link href="/(onboarding)/welcome">{t('common.getStarted')}</Link>
```

## Params navigation

```jsx
router.push({
  pathname: '/(app)/alerts',
  params: { source: 'budget' },
});

// In alerts.jsx
const { source } = useLocalSearchParams();
```

## Install a new Expo SDK 56 package

```bash
npx expo install expo-camera
npx expo start --clear
```

Never `npm install expo-camera@latest` without `expo install` — versions must match SDK 56.
