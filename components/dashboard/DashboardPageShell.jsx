import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { loadDashboardBundle } from '../../lib/dashboardData';
import { subscribeDashboardRefresh } from '../../lib/dashboardRefresh';
import {
  DashboardScrollContext,
  createDashboardScrollToAnchor,
  createDashboardScrollCompleteRegistry,
} from '../../lib/dashboardScroll';
import { C, S, T } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { webScrollBottomPadding } from '../../lib/safeAreaWeb';
import PrimaryButton from '../ui/PrimaryButton';
import AppScreenShell from '../app/AppScreenShell';
import SaveFeedbackBanner from './SaveFeedbackBanner';
import PillSnackbar from './PillSnackbar';

const MAX_WIDTH = 900;

export default function DashboardPageShell({ titleKey, roleHintKey, subheader, children }) {
  const { t } = useI18n();
  const { pagePadH, titleFontSize } = useDashboardLayout();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const scrollCompleteRegistry = useRef(createDashboardScrollCompleteRegistry()).current;

  const scrollToAnchor = useCallback(
    createDashboardScrollToAnchor(
      scrollRef,
      contentRef,
      scrollCompleteRegistry.register.bind(scrollCompleteRegistry),
    ),
    [scrollCompleteRegistry],
  );

  const notifyScrollComplete = useCallback(
    () => scrollCompleteRegistry.notify(),
    [scrollCompleteRegistry],
  );

  useEffect(() => () => scrollCompleteRegistry.cleanup(), [scrollCompleteRegistry]);

  const scrollContextValue = useMemo(
    () => ({ scrollRef, contentRef, scrollToAnchor, notifyScrollComplete }),
    [scrollToAnchor, notifyScrollComplete],
  );

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await loadDashboardBundle(t);
      setBundle(data);
    } catch {
      setError(t('dashboard.home.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeDashboardRefresh(load), [load]);

  const viewKey = loading ? 'loading' : error ? 'error' : 'content';

  return (
    <AppScreenShell variant="tab" settleKey={viewKey}>
        {loading ? (
          <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
            <Text style={{ ...T.helper }}>{t('dashboard.home.loading')}</Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: S.pagePadH }}>
            <Text style={{ ...T.helper, textAlign: 'center', marginBottom: 24, color: C.danger }}>{error}</Text>
            <PrimaryButton onPress={load}>{t('common.retry')}</PrimaryButton>
          </View>
        ) : (
          <DashboardScrollContext.Provider value={scrollContextValue}>
            <View style={{ flex: 1 }}>
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1, backgroundColor: C.bg, width: '100%', maxWidth: '100%' }}
                onMomentumScrollEnd={notifyScrollComplete}
                onScrollEndDrag={notifyScrollComplete}
                contentContainerStyle={{
                  paddingHorizontal: pagePadH,
                  paddingVertical: S.pagePadV,
                  paddingBottom: webScrollBottomPadding(S.pagePadV),
                  maxWidth: MAX_WIDTH,
                  width: '100%',
                  alignSelf: 'center',
                }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />
                }
              >
                {titleKey ? (
                  <Text
                    accessibilityRole="header"
                    style={{ ...T.questionTitle, fontSize: titleFontSize, marginBottom: roleHintKey ? 8 : 0 }}
                  >
                    {t(titleKey)}
                  </Text>
                ) : null}
                {roleHintKey ? (
                  <Text style={{ ...T.helper, marginBottom: subheader ? 12 : 0 }}>{t(roleHintKey)}</Text>
                ) : null}
                {subheader}
                <View
                  ref={contentRef}
                  collapsable={false}
                  style={{ marginTop: titleKey || roleHintKey || subheader ? S.tabContentGap : 0, gap: S.tabSectionGap }}
                >
                  <SaveFeedbackBanner />
                  {children(bundle)}
                </View>
              </ScrollView>
              <PillSnackbar />
            </View>
          </DashboardScrollContext.Provider>
        )}
    </AppScreenShell>
  );
}
