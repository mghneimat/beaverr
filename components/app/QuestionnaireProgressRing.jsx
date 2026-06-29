import Svg, { Circle, G } from 'react-native-svg';
import { View } from 'react-native';
import { C } from '../../constants/onboarding-theme';

const SIZE = 18;
const STROKE = 2;
/** Extra viewBox inset so stroke + round caps are not clipped at edges */
const BLEED = STROKE;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;
const VIEW_BOX = `${-BLEED} ${-BLEED} ${SIZE + BLEED * 2} ${SIZE + BLEED * 2}`;

/**
 * Compact circular progress for sidebar questionnaire rows (empty track at 0%).
 * @param {{ percent: number }} props
 */
export default function QuestionnaireProgressRing({ percent }) {
  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{ width: SIZE, height: SIZE, overflow: 'visible' }}
    >
      <Svg width={SIZE} height={SIZE} viewBox={VIEW_BOX}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={C.border}
          strokeWidth={STROKE}
          fill="none"
        />
        {clamped > 0 ? (
          <G transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke={C.progressFill}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}
