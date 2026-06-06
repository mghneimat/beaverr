import { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, Animated, Dimensions } from 'react-native';
import { useI18n } from '../lib/i18n';
import { useRouter } from 'expo-router';
import { C } from '../constants/onboarding-theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = 280;

/**
 * Hamburger Menu Component
 * Slides in from the right with smooth backdrop fade animation.
 * Language selector uses an animated dropdown overlay.
 */
export default function HamburgerMenu() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  // Drawer animation
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // Language dropdown animation
  const langDropAnim = useRef(new Animated.Value(0)).current;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'cs', label: 'Čeština' },
  ];

  const openMenu = () => {
    setModalVisible(true);
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.timing(langDropAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: false,
    }).start();

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setIsOpen(false);
      setShowLanguages(false);
    });
  };

  const toggleLanguages = () => {
    const next = !showLanguages;
    setShowLanguages(next);
    Animated.timing(langDropAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const handleLanguageSelect = (langCode) => {
    setLocale(langCode);
    setShowLanguages(false);
    Animated.timing(langDropAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  };

  const handleAlertsPress = () => {
    closeMenu();
    setTimeout(() => router.push('/(app)/alerts'), 260);
  };

  // Dropdown overlay animation
  const dropdownScale = langDropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });
  const dropdownOpacity = langDropAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });
  const chevronRotation = langDropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <>
      {/* Hamburger Button */}
      <Pressable
        onPress={openMenu}
        style={{
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={{ gap: 5 }}>
          <View style={{ width: 22, height: 2, backgroundColor: C.text, borderRadius: 1 }} />
          <View style={{ width: 22, height: 2, backgroundColor: C.text, borderRadius: 1 }} />
          <View style={{ width: 22, height: 2, backgroundColor: C.text, borderRadius: 1 }} />
        </View>
      </Pressable>

      {/* Drawer Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: backdropAnim,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeMenu} />
        </Animated.View>

        {/* Drawer panel — slides in from right */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: DRAWER_WIDTH,
            backgroundColor: C.surface,
            borderLeftWidth: 1,
            borderLeftColor: C.border,
            shadowColor: '#000',
            shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 16,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 52,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, letterSpacing: -0.2 }}>
              {t('common.menu')}
            </Text>
            <Pressable
              onPress={closeMenu}
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                backgroundColor: C.bg,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 18, color: C.muted, lineHeight: 20 }}>{'×'}</Text>
            </Pressable>
          </View>

          {/* Menu Items */}
          <View style={{ paddingTop: 8, flex: 1 }}>

            {/* ── Language Selector ── */}
            <View style={{
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}>
              {/* Trigger row */}
              <Pressable
                onPress={toggleLanguages}
                style={({ pressed }) => ({
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: pressed ? C.bg : 'transparent',
                })}
              >
                <Text style={{ fontSize: 15, color: C.text }}>
                  {t('common.language')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: C.primary, fontWeight: '600', letterSpacing: 0.5 }}>
                    {locale.toUpperCase()}
                  </Text>
                  <Animated.Text style={{
                    fontSize: 10,
                    color: C.muted,
                    transform: [{ rotate: chevronRotation }],
                  }}>
                    {'▼'}
                  </Animated.Text>
                </View>
              </Pressable>

              {/* Dropdown overlay */}
              {showLanguages && (
                <Animated.View
                  style={{
                    paddingHorizontal: 20,
                    paddingBottom: 14,
                    opacity: dropdownOpacity,
                    transform: [{ scale: dropdownScale }],
                  }}
                >
                  <View style={{
                    backgroundColor: C.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.border,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 12,
                    overflow: 'hidden',
                  }}>
                    {languages.map((lang, index) => (
                      <Pressable
                        key={lang.code}
                        onPress={() => handleLanguageSelect(lang.code)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: locale === lang.code
                            ? C.chipSelectedBg
                            : pressed
                              ? C.bg
                              : 'transparent',
                          borderBottomWidth: index < languages.length - 1 ? 1 : 0,
                          borderBottomColor: C.border,
                        })}
                      >
                        <Text style={{
                          fontSize: 15,
                          color: locale === lang.code ? C.primary : C.text,
                          fontWeight: locale === lang.code ? '600' : '400',
                        }}>
                          {lang.label}
                        </Text>
                        {locale === lang.code ? (
                          <Text style={{ fontSize: 15, color: C.primary, fontWeight: '600' }}>{'✓'}</Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Alerts */}
            <Pressable
              onPress={handleAlertsPress}
              style={({ pressed }) => ({
                paddingHorizontal: 20,
                paddingVertical: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: pressed ? C.bg : 'transparent',
              })}
            >
              <Text style={{ fontSize: 15, color: C.text }}>
                {t('dashboard.alerts')}
              </Text>
              <Text style={{ fontSize: 15, color: C.muted }}>{'→'}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}
