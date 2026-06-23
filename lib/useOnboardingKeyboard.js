import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Native keyboard visibility — used for compact footer on iOS/Android only.
 * Web uses useOnboardingViewportShell (imperative, no re-renders).
 */
export function useOnboardingKeyboard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { visible };
}
