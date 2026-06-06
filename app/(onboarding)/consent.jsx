import { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { useI18n } from '../../lib/i18n';
import { C, R, T, S } from '../../constants/onboarding-theme';
import FadeUpView from '../../components/onboarding/FadeUpView';
import Svg, { Path } from 'react-native-svg';

/**
 * Arrow-left icon using react-native-svg.
 */
function ArrowLeftIcon({ color = '#6B7A99', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5m7-7l-7 7 7 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ConsentScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (agreed) {
      router.push('/(onboarding)/household');
    }
  };

  const handleBack = () => {
    router.replace('/(onboarding)/welcome');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header with back button */}
      <View style={{
        backgroundColor: C.bg,
        height: S.navHeight,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Pressable
          onPress={handleBack}
          onHoverIn={() => {}}
          onHoverOut={() => {}}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: 12,
            paddingRight: 16,
            height: S.navHeight,
            backgroundColor: pressed ? C.overlayPressed : 'transparent',
          })}
        >
          <ArrowLeftIcon color={C.muted} size={16} />
          <Text style={{
            ...T.backBtn,
            marginLeft: 4,
          }}>
            {t('common.back')}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{
          paddingHorizontal: S.pagePadH,
          paddingVertical: 48,
          maxWidth: S.maxWidth,
          marginHorizontal: 'auto',
          width: '100%',
          flex: 1,
          justifyContent: 'center',
        }}>
          <FadeUpView>
          {/* Title */}
          <Text style={{
            ...T.questionTitle,
            marginBottom: 16,
          }}>
            {t('onboarding.consent.title')}
          </Text>

          {/* Body */}
          <Text style={{
            fontSize: 15,
            lineHeight: 24,
            color: C.muted,
            marginBottom: 32,
          }}>
            {t('onboarding.consent.body')}
          </Text>

          {/* Checkbox — bordered card */}
          <Pressable
            onPress={() => setAgreed(!agreed)}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 32,
              padding: 16,
              borderRadius: R.card,
              borderWidth: 2,
              borderColor: agreed ? C.accent : C.border,
              backgroundColor: agreed ? 'rgba(37,99,235,0.06)' : C.surface,
            }}
          >
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: agreed ? C.accent : 'transparent',
              borderColor: agreed ? C.accent : C.border,
            }}>
              {agreed && <Text style={{ color: '#FFFFFF', fontSize: 14 }}>✓</Text>}
            </View>
            <Text style={{
              fontSize: 15,
              lineHeight: 22,
              flex: 1,
              color: agreed ? C.accent : C.text,
            }}>
              {t('onboarding.consent.checkbox')}
            </Text>
          </Pressable>

          {/* Continue Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!agreed}
            style={({ pressed }) => ({
              paddingVertical: 16,
              borderRadius: R.button,
              backgroundColor: agreed
                ? pressed ? C.accentPressed : C.accent
                : C.disabled,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text style={{
              ...T.btnPrimary,
              color: '#FFFFFF',
              textAlign: 'center',
            }}>
              {t('common.continue')}
            </Text>
          </Pressable>
          </FadeUpView>
        </View>
      </ScrollView>
    </View>
  );
}
