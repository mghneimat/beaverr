import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R } from '../../constants/onboarding-theme';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { ARROW_RIGHT_NODES } from '../app/lucidePaths';

const FLOW_ARROW_SIZE = 16;
const FLOW_ARROW_STROKE = 2.5;

/** @typedef {'event'|'jar'|'outcome'} FlowStepKind */

/** @type {Record<FlowStepKind, { bg: string, text: string, border: string }>} */
const FLOW_TONE = {
  event: { bg: C.bg, text: C.muted, border: C.border },
  jar: { bg: C.infoBg, text: C.infoText, border: C.infoBorder },
  outcome: { bg: C.heroIncomeBg, text: C.positive, border: C.heroIncomeBorder },
};

/**
 * Horizontal flow: event → jar → outcome pills (wraps on narrow screens).
 * @param {{ steps: Array<{ kind: FlowStepKind, label: string }> }} props
 */
export default function StrategyFlowPills({ steps }) {
  if (!steps?.length) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
      }}
    >
      {steps.map((step, index) => (
        <View
          key={`${step.kind}-${index}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          {index > 0 ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                width: FLOW_ARROW_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LucideStrokeIcon
                nodes={ARROW_RIGHT_NODES}
                color={C.text}
                size={FLOW_ARROW_SIZE}
                strokeWidth={FLOW_ARROW_STROKE}
              />
            </View>
          ) : null}
          <View
            style={{
              borderRadius: R.pill,
              paddingHorizontal: 12,
              paddingVertical: 6,
              minHeight: 28,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: FLOW_TONE[step.kind].border,
              backgroundColor: FLOW_TONE[step.kind].bg,
              ...(Platform.OS === 'web' ? { maxWidth: '100%' } : {}),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: FLOW_TONE[step.kind].text,
                lineHeight: 16,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {step.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
