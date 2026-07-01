import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { R, S, SHADOW } from '../../constants/onboarding-theme';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { INSIGHT_GLOW_BASE } from './insightSkiaGlowTokens';
import { INSIGHT_CONTENT_SCRIM } from './insightGlowPreset';
import InsightGlowBackground from './InsightGlowBackground';

/**
 * AI insight card shell — navy base with animated blob glow behind content.
 * Glow always uses the measured card size so collapsed and expanded share the same layout.
 * @param {{ children: import('react').ReactNode, style?: object }} props
 */
export default function InsightAiCardShell({ children, style }) {
  const reduceMotion = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((event) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) => (
      prev.width === width && prev.height === height ? prev : { width, height }
    ));
  }, []);

  const showGlow = size.width > 0 && size.height > 0;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.shell,
        SHADOW.card,
        style,
      ]}
    >
      {showGlow ? (
        <>
          <View style={[styles.canvasClip, { pointerEvents: 'none' }]}>
            <InsightGlowBackground
              width={size.width}
              canvasHeight={size.height}
              animate={!reduceMotion}
            />
          </View>
          <View style={[styles.scrim, { pointerEvents: 'none' }]} />
        </>
      ) : null}

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: R.card,
    overflow: 'hidden',
    backgroundColor: INSIGHT_GLOW_BASE,
    position: 'relative',
  },
  canvasClip: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: INSIGHT_CONTENT_SCRIM,
  },
  content: {
    padding: S.cardPad,
    position: 'relative',
    zIndex: 2,
  },
});
