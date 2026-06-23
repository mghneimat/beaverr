import { Platform } from 'react-native';
import { B } from './onboardingLayout';
import { isMobileWebTouch } from './isMobileWebTouch';

/** True on phone-sized mobile browsers where keyboard/footer overlap is a problem. */
export function isMobileWebOnboarding(width) {
  if (Platform.OS !== 'web') return false;
  if (width < B.compact) return true;
  return isMobileWebTouch();
}
