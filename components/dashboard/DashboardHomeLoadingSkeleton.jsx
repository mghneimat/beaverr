import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { C, R, S } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { webScrollBottomPadding } from '../../lib/safeAreaWeb';
import SkeletonBlock from '../ui/SkeletonBlock';
import SkeletonLine from '../ui/SkeletonLine';

const MAX_WIDTH = 900;

function SkeletonCard({ children }) {
  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: R.card,
      padding: S.cardPad,
      borderWidth: 1,
      borderColor: C.border,
      gap: 12,
    }}>
      {children}
    </View>
  );
}

/**
 * Loading skeleton shaped like DashboardHome — plan overview, tracker, actions.
 */
export default function DashboardHomeLoadingSkeleton() {
  const { t } = useI18n();
  const { pagePadH, titleFontSize } = useDashboardLayout();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={t('dashboard.home.loading')}
      style={{
        flex: 1,
        backgroundColor: C.bg,
        paddingHorizontal: pagePadH,
        paddingTop: S.pagePadV,
        paddingBottom: webScrollBottomPadding(S.pagePadV),
        maxWidth: MAX_WIDTH,
        width: '100%',
        alignSelf: 'center',
      }}
    >
      <SkeletonLine width="36%" height={titleFontSize} style={{ marginBottom: 8 }} />
      <SkeletonLine width="58%" height={14} style={{ marginBottom: S.tabContentGap }} />

      <View style={{ gap: S.tabSectionGap }}>
        <SkeletonCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonLine width="44%" height={16} />
            <SkeletonBlock width={72} height={32} borderRadius={R.pill} />
          </View>
          <SkeletonBlock width="100%" height={14} borderRadius={R.pill} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <SkeletonLine width="22%" height={12} />
            <SkeletonLine width="18%" height={12} />
            <SkeletonLine width="24%" height={12} />
            <SkeletonLine width="20%" height={12} />
          </View>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
            <SkeletonLine width="38%" height={32} />
            <SkeletonLine width="32%" height={32} />
          </View>
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonLine width="30%" height={16} />
          <SkeletonLine width="100%" height={14} />
          <SkeletonBlock width={120} height={36} borderRadius={R.button} />
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonLine width="36%" height={16} />
          <SkeletonLine width="100%" height={14} />
          <SkeletonLine width="92%" height={14} />
          <SkeletonLine width="28%" height={14} />
        </SkeletonCard>
      </View>
    </View>
  );
}
