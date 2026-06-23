import { Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { sectionEditPath } from '../../lib/sectionEditRegistry';
import { C, R, T } from '../../constants/onboarding-theme';

export default function EditSectionButton({
  sectionId,
  label,
  variant = 'outline',
  style,
}) {
  const { t } = useI18n();
  const router = useRouter();
  const text = label ?? t('sectionEdit.editButton');

  if (!sectionId) return null;

  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={() => router.push(sectionEditPath(sectionId))}
      accessibilityRole="button"
      accessibilityLabel={text}
      style={({ pressed, hovered }) => ({
        paddingVertical: 12,
        paddingHorizontal: isPrimary ? 20 : 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: R.button,
        minHeight: 44,
        alignSelf: variant === 'header' ? 'flex-start' : undefined,
        backgroundColor: isPrimary
          ? pressed
            ? C.pillSelectedPressed
            : hovered
              ? C.pillSelectedPressed
              : C.pillSelectedBg
          : pressed
            ? C.overlayPressed
            : hovered
              ? C.overlayHover
              : 'transparent',
        borderWidth: isPrimary ? 0 : 1.5,
        borderColor: C.border,
        opacity: pressed && !isPrimary ? 0.85 : 1,
        ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        ...style,
      })}
    >
      <Text style={{
        ...T.btnPrimary,
        fontSize: 14,
        color: isPrimary ? '#FFFFFF' : C.accent,
      }}>
        {text}
      </Text>
    </Pressable>
  );
}
