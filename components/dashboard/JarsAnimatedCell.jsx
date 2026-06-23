import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReducedMotion } from '../../lib/useReducedMotion';
import {
  jarGridCellFullMotionStyle,
  jarGridCellTransformStyle,
  useJarGridEnterProgress,
  useJarGridExitProgress,
} from './useJarGridEnterProgress';

/**
 * Slide/scale enter for jar grid cells — no outer opacity (keeps glass backdrop-filter smooth on web).
 * When `motion="full"`, opacity is included (light stash cards on Savings tab).
 */
export default function JarsAnimatedCell({
  animationKey,
  index = 0,
  style,
  children,
  exiting = false,
  onExitComplete,
  motion = 'transform',
}) {
  const reduceMotion = useReducedMotion();
  const enterProgress = useJarGridEnterProgress(exiting ? null : animationKey, index);
  const exitProgress = useJarGridExitProgress(exiting, onExitComplete);
  const useFullMotion = motion === 'full';

  const animatedStyle = useAnimatedStyle(() => {
    if (exiting) {
      return useFullMotion
        ? jarGridCellFullMotionStyle(exitProgress)
        : jarGridCellTransformStyle(exitProgress);
    }

    if (useFullMotion) {
      return jarGridCellFullMotionStyle(enterProgress);
    }

    return jarGridCellTransformStyle(enterProgress);
  });

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
