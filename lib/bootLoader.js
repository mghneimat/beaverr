import { Platform } from 'react-native';

export { BOOT_LOADER } from '../constants/boot-loader';

/**
 * Fade out and remove the static web boot loader once React has mounted.
 * Safe to call multiple times.
 */
export function hideWebBootLoader() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const el = document.getElementById('app-boot-loader');
  if (!el || el.dataset.dismissed === 'true') return;

  el.dataset.dismissed = 'true';
  el.classList.add('app-boot-loader--hide');

  window.setTimeout(() => {
    el.remove();
  }, 420);
}
