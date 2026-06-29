import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import GoalGridTile from './GoalGridTile';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

const QUAD_GRID_ITEM = { width: '47%', flexGrow: 1, flexBasis: '45%', alignSelf: 'stretch' };
const TAB_PLUS_SIZE = 16;

function TabPlusIcon({ color }) {
  return (
    <Svg width={TAB_PLUS_SIZE} height={TAB_PLUS_SIZE} viewBox="0 0 24 24">
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={2.25}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AddGoalChip({ label, accessibilityLabel, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        minHeight: 36,
        borderRadius: R.pill,
        flexShrink: 0,
        backgroundColor: pressed
          ? C.bg
          : hovered
            ? C.bg
            : C.pillUnselectedBg,
        borderWidth: 1,
        borderColor: C.pillUnselectedBorder,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
      })}
    >
      <TabPlusIcon color={C.text} />
      <Text style={{ ...T.pillLabel, fontSize: 13, fontWeight: '600', color: C.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function GoalsCategorySection({
  title,
  goals,
  currency,
  financials,
  onEdit,
  onSetDeadline,
  onArchive,
  onFundingPress,
  onResetPress,
  showAddGoal,
  onAddGoal,
  addGoalLabel,
  addGoalA11y,
  alwaysShow = false,
  emptyMessage,
}) {
  const { t } = useI18n();
  const { isPhone } = useDashboardLayout();
  const gridItemStyle = isPhone
    ? { width: '100%', flexBasis: '100%', alignSelf: 'stretch' }
    : QUAD_GRID_ITEM;

  const hasGoals = (goals?.length || 0) > 0;
  if (!hasGoals && !alwaysShow) return null;

  return (
    <SurfaceCard>
      <InCardSectionHeader
        title={title}
        trailing={showAddGoal ? (
          <AddGoalChip
            label={addGoalLabel || t('dashboard.goalsScreen.addGoal')}
            accessibilityLabel={addGoalA11y || t('dashboard.goalsScreen.addGoalA11y')}
            onPress={onAddGoal}
          />
        ) : undefined}
      />
      {hasGoals ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 4, alignItems: 'stretch' }}>
          {goals.map((goal) => (
            <View key={goal.id} style={gridItemStyle}>
              <GoalGridTile
                goal={goal}
                currency={currency}
                financials={financials}
                onEdit={onEdit}
                onSetDeadline={onSetDeadline}
                onArchive={onArchive}
                onFundingPress={onFundingPress}
                onResetPress={onResetPress}
              />
            </View>
          ))}
        </View>
      ) : (
        <DashboardSectionEmptyMessage message={emptyMessage} />
      )}
    </SurfaceCard>
  );
}
