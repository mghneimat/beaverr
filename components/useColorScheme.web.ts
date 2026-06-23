import { useTheme } from '../lib/theme';

export function useColorScheme() {
  const { mode } = useTheme();
  return mode;
}
