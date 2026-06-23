import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';
import GoalGridTile from './GoalGridTile';

const QUAD_GRID_ITEM = { width: '47%', flexGrow: 1, flexBasis: '45%', alignSelf: 'stretch' };
const TAB_PLUS_SIZE = 16;
const TAB_INACTIVE_TEXT = C.primary;

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
      <TabPlusIcon color={TAB_INACTIVE_TEXT} />
      <Text style={{ ...T.pillLabel, fontSize: 13, fontWeight: '600', color: TAB_INACTIVE_TEXT }}>
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
}) {
  const { t } = useI18n();

  if (!goals?.length) return null;

  return (
    <SurfaceCard>
      <InCardSectionHeader
        title={title}
        trailing={showAddGoal ? (
          <AddGoalChip
            label={t('dashboard.goalsScreen.addGoal')}
            accessibilityLabel={t('dashboard.goalsScreen.addGoalA11y')}
            onPress={onAddGoal}
          />
        ) : undefined}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 4, alignItems: 'stretch' }}>
        {goals.map((goal) => (
          <View key={goal.id} style={QUAD_GRID_ITEM}>
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
    </SurfaceCard>
  );
}
