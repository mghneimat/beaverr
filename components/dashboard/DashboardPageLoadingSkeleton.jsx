import { View } from 'react-native';
import { useI18n } from '../../lib/i18n';
import { C, R, S } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { webScrollBottomPadding } from '../../lib/safeAreaWeb';
import SkeletonBlock from '../ui/SkeletonBlock';
import SkeletonLine from '../ui/SkeletonLine';

const MAX_WIDTH = 900;

function SkeletonCard({ children, style }) {
  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: R.card,
      padding: S.cardPad,
      borderWidth: 1,
      borderColor: C.border,
      gap: 12,
      ...style,
    }}>
      {children}
    </View>
  );
}

/**
 * Shared loading skeleton for dashboard tab pages — matches DashboardPageShell layout.
 */
export default function DashboardPageLoadingSkeleton({
  showTitle = true,
  showSubtitle = true,
  accessibilityLabel,
}) {
  const { t } = useI18n();
  const { pagePadH, titleFontSize } = useDashboardLayout();
  const a11y = accessibilityLabel ?? t('dashboard.home.loading');

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={a11y}
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
      {showTitle ? (
        <SkeletonLine
          width="42%"
          height={titleFontSize}
          style={{ marginBottom: showSubtitle ? 8 : S.tabContentGap }}
        />
      ) : null}
      {showSubtitle ? (
        <SkeletonLine
          width="72%"
          height={14}
          style={{ marginBottom: S.tabContentGap }}
        />
      ) : null}
      {!showTitle && !showSubtitle ? (
        <View style={{ marginBottom: S.tabContentGap }} />
      ) : null}

      <View style={{ gap: S.tabSectionGap }}>
        <SkeletonCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <SkeletonLine width="38%" height={16} />
            <SkeletonBlock width={88} height={32} borderRadius={R.pill} />
          </View>
          <SkeletonBlock width="100%" height={12} borderRadius={R.pill} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <SkeletonLine width="28%" height={28} />
            <SkeletonLine width="28%" height={28} />
          </View>
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonLine width="34%" height={16} />
          <SkeletonLine width="100%" height={14} />
          <SkeletonLine width="88%" height={14} />
          <SkeletonLine width="64%" height={14} />
        </SkeletonCard>

        <SkeletonCard>
          <SkeletonLine width="40%" height={16} />
          <SkeletonLine width="100%" height={14} />
          <SkeletonLine width="76%" height={14} />
        </SkeletonCard>
      </View>
    </View>
  );
}
