import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { C } from '../../../constants/onboarding-theme';
import {
  CYCLE_CONTROL_ICON_BOX,
  CYCLE_CONTROL_ICON_STROKE,
} from './cycleControlPill';

const ICON_BOX = CYCLE_CONTROL_ICON_BOX;
const ICON_STROKE = CYCLE_CONTROL_ICON_STROKE;
const VIEW = 24;

function PlayGlyph({ color }) {
  return (
    <Svg width={ICON_BOX} height={ICON_BOX} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Path d="M7 5.5v13l10.5-6.5L7 5.5z" fill={color} />
    </Svg>
  );
}

function StopGlyph({ color }) {
  return (
    <Svg width={ICON_BOX} height={ICON_BOX} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Rect x="5.5" y="5.5" width="13" height="13" rx="2" fill={color} />
    </Svg>
  );
}

function PlusGlyph({ color }) {
  return (
    <Svg width={ICON_BOX} height={ICON_BOX} viewBox={`0 0 ${VIEW} ${VIEW}`}>
      <Path
        d="M12 5.5v13M5.5 12h13"
        stroke={color}
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Play (idle) / stop square (active cycle).
 * @param {boolean} ending — true when a cycle is active (show stop)
 */
export default function CycleControlButtonIcon({ ending = false, color = C.pillSelectedText }) {
  return (
    <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: 'center', justifyContent: 'center' }}>
      {ending ? <StopGlyph color={color} /> : <PlayGlyph color={color} />}
    </View>
  );
}

/** Plus icon for ad-hoc add CTAs — same 22×22 box as start/end icons */
export function CycleControlPlusIcon({ color = C.primary }) {
  return (
    <View style={{ width: ICON_BOX, height: ICON_BOX, alignItems: 'center', justifyContent: 'center' }}>
      <PlusGlyph color={color} />
    </View>
  );
}
