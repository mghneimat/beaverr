import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DASHBOARD_MOTION_DURATION, DASHBOARD_MOTION_EASE } from '../../lib/dashboardMotion';
import { useReducedMotion } from '../../lib/useReducedMotion';

const WEB_CLIP = Platform.OS === 'web'
  ? { contain: 'paint', isolation: 'isolate' }
  : null;

/**
 * Horizontal slide between two full-width panels (Active / Archived).
 */
export default function GoalsFilterSlideView({ filter, children }) {
  const reduceMotion = useReducedMotion();
  const [pageWidth, setPageWidth] = useState(0);
  const index = useSharedValue(filter === 'active' ? 0 : 1);
  const panels = Array.isArray(children) ? children : [children];

  useEffect(() => {
    const next = filter === 'active' ? 0 : 1;
    index.value = reduceMotion
      ? next
      : withTiming(next, {
        duration: DASHBOARD_MOTION_DURATION,
        easing: DASHBOARD_MOTION_EASE,
      });
  }, [filter, reduceMotion, index]);

  const slideStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    width: pageWidth > 0 ? pageWidth * panels.length : undefined,
    transform: [{ translateX: pageWidth > 0 ? -index.value * pageWidth : 0 }],
  }));

  return (
    <View
      style={{ width: '100%', alignItems: 'stretch' }}
      onLayout={(event) => {
        const nextWidth = Math.round(event.nativeEvent.layout.width);
        if (nextWidth > 0 && nextWidth !== pageWidth) {
          setPageWidth(nextWidth);
        }
      }}
    >
      <View
        style={{
          width: pageWidth > 0 ? pageWidth : '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          ...WEB_CLIP,
        }}
      >
        <Animated.View style={slideStyle}>
          {panels.map((panel, panelIndex) => (
            <View
              key={panelIndex}
              style={{
                width: pageWidth > 0 ? pageWidth : '100%',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {panel}
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}
