import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, R, T } from '../../constants/onboarding-theme';

const FREQ_OPTIONS = ['daily', 'weekly', 'monthly'];

/** Hero-card pill colors — match TabHeroMetric income/expense tints. */
const TOGGLE_TONES = {
  income: {
    selectedBg: C.heroIncomeBadge,
    selectedPressed: '#15803D',
    selectedText: '#FFFFFF',
    unselectedBg: '#FFFFFF',
    unselectedPressed: C.heroIncomeBg,
    unselectedBorder: C.heroIncomeBorder,
    unselectedText: C.heroIncomeBadge,
  },
  expense: {
    selectedBg: C.heroExpenseBadge,
    selectedPressed: '#DC2626',
    selectedText: '#FFFFFF',
    unselectedBg: '#FFFFFF',
    unselectedPressed: C.heroExpenseBg,
    unselectedBorder: C.heroExpenseBorder,
    unselectedText: C.heroExpenseBadge,
  },
};

/**
 * Period switch — Balshet dark-grey pill selection.
 * @param {'inline'|'page'|'header'|'segment'} [variant='inline']
 *   segment = full-width inset track (section headers, mobile-safe)
 * @param {'income'|'expense'} [tone] — hero section tint for header/segment pills
 */
export default function DashboardFrequencyToggle({ value, onChange, style, variant = 'inline', tone }) {
  const { t } = useI18n();
  const isPage = variant === 'page';
  const isHeader = variant === 'header';
  const isSegment = variant === 'segment';
  const isFullWidth = isPage || isSegment;
  const tonePalette = tone ? TOGGLE_TONES[tone] : null;

  const pills = FREQ_OPTIONS.map((freq) => {
    const selected = value === freq;
    let selectedBg;
    let selectedPressed;
    let selectedText;
    let unselectedBg;
    let unselectedPressed;
    let unselectedBorder;
    let unselectedText;

    if (isSegment && !tonePalette) {
      selectedBg = selected ? C.surface : 'transparent';
      selectedPressed = C.overlayPressed;
      selectedText = C.primary;
      unselectedBg = 'transparent';
      unselectedPressed = C.overlayHover;
      unselectedBorder = C.border;
      unselectedText = C.muted;
    } else {
      selectedBg = tonePalette
        ? (selected ? tonePalette.selectedBg : tonePalette.unselectedBg)
        : (selected ? C.pillSelectedBg : C.pillUnselectedBg);
      selectedPressed = tonePalette
        ? (selected ? tonePalette.selectedPressed : tonePalette.unselectedPressed)
        : (selected ? C.pillSelectedPressed : C.surfaceTint);
      selectedText = tonePalette
        ? (selected ? tonePalette.selectedText : tonePalette.unselectedText)
        : (selected ? C.pillSelectedText : C.pillUnselectedText);
      unselectedBg = tonePalette ? tonePalette.unselectedBg : C.pillUnselectedBg;
      unselectedPressed = tonePalette ? tonePalette.unselectedPressed : C.surfaceTint;
      unselectedBorder = tonePalette ? tonePalette.unselectedBorder : C.pillUnselectedBorder;
      unselectedText = tonePalette ? tonePalette.unselectedText : C.pillUnselectedText;
    }

    return (
      <Pressable
        key={freq}
        onPress={(e) => {
          e?.stopPropagation?.();
          onChange(freq);
        }}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={t(`common.${freq}`)}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        style={({ pressed }) => ({
          ...(isFullWidth ? { flex: 1 } : {}),
          paddingVertical: isHeader ? 6 : isSegment ? 8 : 8,
          paddingHorizontal: isHeader ? 10 : isPage ? 8 : isSegment ? 6 : 16,
          minHeight: isHeader ? 32 : isSegment ? 40 : 36,
          borderRadius: isSegment ? R.button : R.pill,
          backgroundColor: pressed
            ? (selected ? selectedPressed : unselectedPressed)
            : (selected ? selectedBg : unselectedBg),
          borderWidth: isSegment
            ? (selected && !tonePalette ? 1 : 0)
            : (selected ? 0 : 1),
          borderColor: isSegment && selected && !tonePalette
            ? unselectedBorder
            : (tonePalette ? unselectedBorder : C.pillUnselectedBorder),
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        })}
      >
        <Text style={{
          ...T.pillLabel,
          fontSize: isHeader ? 12 : 13,
          fontWeight: selected ? '600' : '500',
          color: selected ? selectedText : unselectedText,
        }}
        numberOfLines={1}
        >
          {t(`common.${freq}`)}
        </Text>
      </Pressable>
    );
  });

  return (
    <View
      style={[
        {
          marginTop: 8,
          alignSelf: isFullWidth ? 'stretch' : 'flex-end',
        },
        isPage && { width: '100%', maxWidth: 320 },
        style,
      ]}
      onStartShouldSetResponder={() => true}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('common.frequency')}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: isFullWidth ? 'nowrap' : 'wrap',
        gap: isSegment ? 4 : isHeader ? 4 : isPage ? 6 : 8,
        width: isFullWidth ? '100%' : undefined,
        justifyContent: isHeader ? 'flex-end' : 'flex-start',
        ...(isSegment ? {
          backgroundColor: C.bg,
          borderRadius: R.pill,
          padding: 4,
          borderWidth: 1,
          borderColor: C.border,
        } : {}),
      }}
      >
        {pills}
      </View>
    </View>
  );
}
