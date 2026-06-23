import { Platform, Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { navigateFromDashboard, navigateToCostsSubtab } from '../../../lib/screenTransition';
import { IncomeIcon, CostsIcon } from '../../app/AppNavIcons';
import LucideStrokeIcon from '../../app/LucideStrokeIcon';
import { CHEVRON_RIGHT_NODES } from '../../app/lucidePaths';
import { C, R, S, T } from '../../../constants/onboarding-theme';
import SurfaceCard from '../../ui/SurfaceCard';

const ICON_BOX = 40;
const GLYPH_SIZE = 20;
const ROW_GAP = 6;

function TabIconBox({ variant = 'income' }) {
  const isIncome = variant === 'income';
  const Icon = isIncome ? IncomeIcon : CostsIcon;
  const color = isIncome ? C.heroIncomeValue : C.heroExpenseValue;
  return (
    <View
      style={{
        width: ICON_BOX,
        height: ICON_BOX,
        borderRadius: ICON_BOX / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isIncome ? C.heroIncomeBg : C.heroExpenseBg,
        borderWidth: 1,
        borderColor: isIncome ? C.heroIncomeBorder : C.heroExpenseBorder,
        flexShrink: 0,
      }}
    >
      <Icon color={color} size={GLYPH_SIZE} />
    </View>
  );
}

function pillRowBg({ pressed, hovered }) {
  if (pressed || hovered) return C.breakdownRowHover;
  return 'transparent';
}

function QuickLinkRow({ title, subtitle, variant, onPress, a11y }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={a11y}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: R.pill,
        backgroundColor: pillRowBg({
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        }),
        opacity: pressed ? 0.92 : 1,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <TabIconBox variant={variant} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.primary }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <LucideStrokeIcon nodes={CHEVRON_RIGHT_NODES} color={C.muted} size={18} strokeWidth={2} />
    </Pressable>
  );
}

export default function CycleQuickLinksRow() {
  const { t } = useI18n();
  const router = useRouter();

  const goIncome = () => navigateFromDashboard(router, 'income');
  const goRecurringExpense = () => navigateToCostsSubtab(router, { primary: 'recurring', sub: 'subscriptions' }, 'dashboard');

  return (
    <SurfaceCard style={{ marginTop: 12 }}>
      <Text style={{ ...T.cardTitle, marginBottom: 8 }}>
        {t('dashboard.cycles.quickLinks.title')}
      </Text>

      <View style={{ gap: ROW_GAP }}>
        <QuickLinkRow
          title={t('dashboard.cycles.oneOffs.tiles.recurring.incomeTitle')}
          subtitle={t('dashboard.cycles.oneOffs.tiles.recurring.incomeHelper')}
          variant="income"
          onPress={goIncome}
          a11y={t('dashboard.cycles.oneOffs.linkIncomeA11y')}
        />
        <QuickLinkRow
          title={t('dashboard.cycles.oneOffs.tiles.recurring.expenseTitle')}
          subtitle={t('dashboard.cycles.oneOffs.tiles.recurring.expenseHelper')}
          variant="expense"
          onPress={goRecurringExpense}
          a11y={t('dashboard.cycles.oneOffs.linkExpenseA11y')}
        />
      </View>
    </SurfaceCard>
  );
}
