import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { useOnboardingLayout } from '../../../lib/onboardingLayout';
import { C, T, tabularNums } from '../../../constants/onboarding-theme';
import { buildReviewRowEditRouteFromRow } from '../../../lib/reviewRowEdit';
import ReviewRowPenButton, { REVIEW_PEN_GAP } from './ReviewRowPenButton';

const ROW_PAD_V = 8;

export default function ReviewEditableRow({
  row,
  editMode = false,
  isLast = false,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const layout = useOnboardingLayout();
  const stackNarrow = layout.isNarrow;
  const reservePenSlot = Boolean(row.editable && row.editKey);
  const showPen = editMode && reservePenSlot;
  const penA11y = t('onboarding.review.review.editRowA11y', { label: row.label });

  const handlePenPress = () => {
    const route = buildReviewRowEditRouteFromRow(row);
    if (route) router.push(route);
  };

  return (
    <View
      style={{
        flexDirection: stackNarrow ? 'column' : 'row',
        alignItems: stackNarrow ? 'stretch' : 'center',
        paddingVertical: ROW_PAD_V,
        gap: showPen ? REVIEW_PEN_GAP : 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: C.divider,
      }}
    >
      <Text
        style={{
          ...T.caption,
          color: C.muted,
          flex: stackNarrow ? undefined : 1,
        }}
        numberOfLines={3}
      >
        {row.label}
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: stackNarrow ? 'space-between' : 'flex-end',
        gap: showPen ? REVIEW_PEN_GAP : 0,
        flexShrink: stackNarrow ? undefined : 1,
      }}
      >
      <Text
        style={{
          ...T.caption,
          fontWeight: '600',
          color: row.warn ? '#D97706' : C.text,
          textAlign: stackNarrow ? 'left' : 'right',
          flexShrink: 1,
          ...tabularNums,
        }}
        numberOfLines={3}
      >
        {row.value || '—'}
      </Text>
      {showPen ? (
        <ReviewRowPenButton
          visible
          onPress={handlePenPress}
          accessibilityLabel={penA11y}
        />
      ) : null}
      </View>
    </View>
  );
}
