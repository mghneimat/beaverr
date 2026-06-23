import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { C } from '../../../constants/onboarding-theme';
import { buildReviewRowEditRouteFromRow } from '../../../lib/reviewRowEdit';
import ReviewRowPenButton, { REVIEW_PEN_GAP } from './ReviewRowPenButton';

export default function ReviewBlockPenHeader({ block, editMode }) {
  const { t } = useI18n();
  const router = useRouter();
  const showPen = editMode && block?.editable && block?.editKey;

  const handlePenPress = () => {
    const route = buildReviewRowEditRouteFromRow({
      sectionId: block.sectionId,
      editKey: block.editKey,
      editable: true,
      label: block.editLabel || block.title,
    });
    if (route) router.push(route);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: REVIEW_PEN_GAP,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, flex: 1 }} numberOfLines={2}>
        {block.title}
      </Text>
      <ReviewRowPenButton
        visible={showPen}
        onPress={handlePenPress}
        accessibilityLabel={t('onboarding.review.review.editRowA11y', { label: block.editLabel || block.title })}
      />
    </View>
  );
}
