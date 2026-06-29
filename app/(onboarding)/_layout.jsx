import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { C, T, S } from '../../constants/onboarding-theme';
import { BUILD_STAMP } from '../../lib/buildStamp';
import OnboardingScreenShell from '../../components/onboarding/OnboardingScreenShell';
import SectionCardsSkeleton from '../../components/ui/SectionCardsSkeleton';
import { useI18n } from '../../lib/i18n';

/** Surfaces route render errors instead of a silent blank screen on mobile web. */
export function ErrorBoundary({ error, retry }) {
  const stackPreview = error?.stack?.split('\n').slice(0, 6).join('\n') || '';
  return (
    <OnboardingScreenShell>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: C.surface,
      }}
      >
        <Text style={{ ...T.questionTitle, marginBottom: 12 }}>
          Something went wrong
        </Text>
        <Text style={{ ...T.helper, color: C.danger, marginBottom: 20 }}>
          {error?.message || 'Unknown error'}
        </Text>
        {stackPreview ? (
          <Text
            selectable
            style={{
              ...T.helper,
              color: C.danger,
              marginBottom: 12,
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            {stackPreview}
          </Text>
        ) : null}
        <Text style={{ ...T.helper, color: C.muted, marginBottom: 20, fontSize: 11 }}>
          Build: {BUILD_STAMP}
        </Text>
        {retry ? (
          <Pressable onPress={retry} accessibilityRole="button">
            <Text style={{ ...T.helper, color: C.accent, fontWeight: '600' }}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    </OnboardingScreenShell>
  );
}

/** Shown while a child onboarding route chunk loads (prevents blank mobile-web transitions). */
export function SuspenseFallback() {
  const { t } = useI18n();
  return (
    <OnboardingScreenShell>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: C.surface,
        padding: S.pagePadH,
      }}
      >
        <SectionCardsSkeleton cards={2} accessibilityLabel={t('common.loading')} />
      </View>
    </OnboardingScreenShell>
  );
}

/**
 * Onboarding stack navigator.
 * Splash screens are named by the section they introduce (semantic naming),
 * not by a number — so inserting or reordering sections doesn't require
 * renaming every file downstream.
 *
 * Naming convention:
 *   splash-<section>  →  full-screen section intro
 *   <section>         →  question screen(s) for that section
 */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { flex: 1 } }}>
      {/* Entry points */}
      <Stack.Screen name="welcome" />
      <Stack.Screen name="setup-mode" />
      <Stack.Screen name="quick-housing" />

      {/* Section 1 — Household Setup */}
      <Stack.Screen name="splash-household" />
      <Stack.Screen name="household" />

      {/* Section 2 — Residence & Work */}
      <Stack.Screen name="splash-residence" />
      <Stack.Screen name="location" />
      <Stack.Screen name="citizenship" />
      <Stack.Screen name="residence-permit" />
      <Stack.Screen name="occupation" />

      {/* Section 3 — Income */}
      <Stack.Screen name="splash-income" />
      <Stack.Screen name="income" />

      {/* Section 3b — Strategy */}
      <Stack.Screen name="splash-strategy" />
      <Stack.Screen name="strategy" />

      {/* Section 4 — Housing */}
      <Stack.Screen name="splash-housing" />
      <Stack.Screen name="housing" />

      {/* Section 5 — Transport */}
      <Stack.Screen name="splash-transport" />
      <Stack.Screen name="transport" />

      {/* Section 6 — Health Insurance */}
      <Stack.Screen name="splash-health" />
      <Stack.Screen name="health" />

      {/* Section 7 — Children's Costs */}
      <Stack.Screen name="splash-children" />
      <Stack.Screen name="children-costs" />

      {/* Section 8 — Pets */}
      <Stack.Screen name="splash-pets" />
      <Stack.Screen name="pets" />

      {/* Section 9 — Subscriptions */}
      <Stack.Screen name="splash-subscriptions" />
      <Stack.Screen name="subscriptions" />

      {/* Section 10 — Other Regular Costs */}
      <Stack.Screen name="splash-other-costs" />
      <Stack.Screen name="other-costs" />

      {/* Section 11 — Debts */}
      <Stack.Screen name="splash-debts" />
      <Stack.Screen name="debts" />

      {/* Section 12 — Setup Budget */}
      <Stack.Screen name="splash-budget" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="budget-setup" />
      <Stack.Screen name="budget-rollover" />
      <Stack.Screen name="budget-spending-strategy" />

      {/* Section 13 — Review & Confirm */}
      <Stack.Screen name="splash-review" />
      <Stack.Screen name="review" />
      <Stack.Screen name="review-edit" options={{ presentation: 'card' }} />
    </Stack>
  );
}
