import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R, T } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import InCardSectionHeader from './InCardSectionHeader';

function CategoryGroup({ title, panels, onSelect, t }) {
  if (!panels.length) return null;

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ ...T.caption, color: C.muted, fontWeight: '600' }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {panels.map((panel) => (
          <Pressable
            key={panel.key}
            onPress={() => onSelect(panel)}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.expensesScreen.addPicker.categoryA11y', { type: panel.label })}
            style={({ pressed, hovered }) => ({
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: R.pill,
              borderWidth: 1,
              borderColor: C.pillUnselectedBorder,
              backgroundColor: pressed ? C.bg : hovered ? C.bg : C.pillUnselectedBg,
              ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
            })}
          >
            <Text style={{
              ...T.pillLabel,
              fontSize: 14,
              fontWeight: '500',
              color: C.primary,
            }}>
              {panel.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ExpenseAddCategoryPicker({
  fixedPanels,
  recurringPanels,
  onSelect,
  t,
}) {
  return (
    <SurfaceCard style={{ marginTop: 16, gap: 20 }}>
      <InCardSectionHeader title={t('dashboard.expensesScreen.addPicker.title')} />
      <Text style={{ ...T.helper, color: C.muted, marginTop: -8, marginBottom: 4 }}>
        {t('dashboard.expensesScreen.addPicker.helper')}
      </Text>
      <CategoryGroup
        title={t('dashboard.expensesScreen.addPicker.groupFixed')}
        panels={fixedPanels}
        onSelect={onSelect}
        t={t}
      />
      <CategoryGroup
        title={t('dashboard.expensesScreen.addPicker.groupRecurring')}
        panels={recurringPanels}
        onSelect={onSelect}
        t={t}
      />
    </SurfaceCard>
  );
}
