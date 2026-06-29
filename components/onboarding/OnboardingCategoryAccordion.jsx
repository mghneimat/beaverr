import { View, Text, TextInput, Platform } from 'react-native';
import { C, R, T } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import AnimatedAccordionBody from './AnimatedAccordionBody';
import { washBg } from './pressableFeedback';
import CardHeaderActionButton, { CardHeaderExpandIcon } from '../dashboard/CardHeaderActionButton';
import SelectableServicePill from './SelectableServicePill';

function InlineCustomCancelButton({ onPress, accessibilityLabel }) {
  const size = 30;

  return (
    <OnboardingPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed, hovered }) => ({
        width: size,
        height: size,
        marginBottom: 8,
        marginRight: 4,
        borderRadius: R.chip,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed || hovered ? C.dangerBg : 'transparent',
      })}
    >
      <Text style={{
        width: size,
        fontSize: 15,
        fontWeight: '600',
        color: C.danger,
        lineHeight: size,
        textAlign: 'center',
        includeFontPadding: false,
      }}>
        ✕
      </Text>
    </OnboardingPressable>
  );
}

function InlineCustomNameInput({ value, onChangeText, onSubmit, placeholder, accessibilityLabel }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 120,
      maxWidth: 220,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 8,
      marginRight: 8,
      borderRadius: R.pill,
      borderWidth: 1.5,
      borderColor: C.accent,
      backgroundColor: C.surface,
    }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        accessibilityLabel={accessibilityLabel}
        autoFocus
        returnKeyType="done"
        blurOnSubmit={false}
        style={{
          flex: 1,
          fontSize: 13,
          color: C.text,
          padding: 0,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
        }}
      />
    </View>
  );
}

/**
 * Shared expandable category picker — subscriptions, utilities, other income.
 */
export default function OnboardingCategoryAccordion({
  title,
  suggestionCount,
  selectedCountLabel,
  itemKeys,
  itemLabel,
  isItemSelected,
  onToggleItem,
  onAddCustom,
  addCustomLabel,
  categoryId,
  expanded = false,
  onToggleExpanded,
  customItems = [],
  onRemoveCustomItem,
  showCustomInput = false,
  customName = '',
  onCustomNameChange,
  onConfirmCustom,
  onCancelCustom,
  cancelAccessibilityLabel,
  customPlaceholder,
  customAccessibilityLabel,
  renderIcon,
}) {
  const isOpen = expanded || showCustomInput;
  const catalogSelected = itemKeys.filter((key) => isItemSelected(categoryId, key)).length;
  const selectedInCategory = catalogSelected + customItems.length;

  return (
    <View style={{
      marginBottom: 10,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      overflow: 'hidden',
    }}>
      <OnboardingPressable
        onPress={() => onToggleExpanded(categoryId)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          gap: 12,
        }}
        style={({ pressed, hovered }) => ({
          width: '100%',
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: washBg({ pressed, hovered }, C.surface),
        })}
      >
        {({ hovered, pressed }) => (
          <>
            {renderIcon ? renderIcon(categoryId) : null}

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }} numberOfLines={2}>
                {title}
              </Text>
              <Text style={{ ...T.caption, color: C.muted, marginTop: 2 }} numberOfLines={1}>
                {suggestionCount}
                {selectedInCategory > 0 && selectedCountLabel
                  ? ` · ${selectedCountLabel(selectedInCategory)}`
                  : ''}
              </Text>
            </View>

            <CardHeaderExpandIcon expanded={isOpen} color={C.muted} hovered={hovered} pressed={pressed} />
          </>
        )}
      </OnboardingPressable>

      <AnimatedAccordionBody open={isOpen}>
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: C.divider,
        }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
            {itemKeys.map((itemKey) => (
              <SelectableServicePill
                key={itemKey}
                label={itemLabel(itemKey)}
                active={isItemSelected(categoryId, itemKey)}
                onPress={() => onToggleItem(categoryId, itemKey)}
              />
            ))}
            {customItems.map((item) => (
              <SelectableServicePill
                key={item.id}
                label={item.customName || item.label}
                active
                onPress={() => onRemoveCustomItem(item.id)}
              />
            ))}
            {showCustomInput ? (
              <>
                <InlineCustomNameInput
                  value={customName}
                  onChangeText={onCustomNameChange}
                  onSubmit={onConfirmCustom}
                  placeholder={customPlaceholder}
                  accessibilityLabel={customAccessibilityLabel}
                />
                <InlineCustomCancelButton
                  onPress={onCancelCustom}
                  accessibilityLabel={cancelAccessibilityLabel}
                />
              </>
            ) : null}
            <CardHeaderActionButton
              label={addCustomLabel}
              onPress={() => onAddCustom(categoryId)}
              accessibilityLabel={addCustomLabel}
              style={{ minWidth: 0, paddingHorizontal: 14, marginBottom: 8 }}
            />
          </View>
        </View>
      </AnimatedAccordionBody>
    </View>
  );
}
