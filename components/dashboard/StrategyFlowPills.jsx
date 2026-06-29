import { Fragment } from 'react';
import { View, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, T } from '../../constants/onboarding-theme';
import { useDashboardLayout } from '../../lib/dashboardLayout';
import LucideStrokeIcon from '../app/LucideStrokeIcon';
import { ARROW_DOWN_NODES, ARROW_RIGHT_NODES } from '../app/lucidePaths';

const FLOW_ARROW_SIZE = 13;
const FLOW_ARROW_STROKE = 2;
const ACTIVITY_RADIUS = 8;

/**
 * @param {{ label: string, compact?: boolean }} props
 */
function ActivityNode({ label, compact = false }) {
  return (
    <View
      style={{
        borderRadius: ACTIVITY_RADIUS,
        paddingHorizontal: compact ? 10 : 12,
        paddingVertical: compact ? 5 : 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: 'transparent',
        flexShrink: 0,
        ...(Platform.OS === 'web' ? { maxWidth: '100%' } : {}),
      }}
    >
      <Text
        style={{
          ...T.caption,
          fontSize: 12,
          fontWeight: '500',
          color: C.text,
          lineHeight: 16,
          textAlign: 'center',
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

function FlowArrow({ direction }) {
  const nodes = direction === 'down' ? ARROW_DOWN_NODES : ARROW_RIGHT_NODES;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={
        direction === 'down'
          ? { paddingVertical: 2, paddingLeft: 14 }
          : { paddingHorizontal: 2, flexShrink: 0 }
      }
    >
      <LucideStrokeIcon
        nodes={nodes}
        color={C.muted}
        size={FLOW_ARROW_SIZE}
        strokeWidth={FLOW_ARROW_STROKE}
      />
    </View>
  );
}

/**
 * Inline UML activity flow — content-sized, no full-width background strip.
 * @param {{ steps: Array<{ kind?: string, label: string }> }} props
 */
export default function StrategyFlowPills({ steps }) {
  const { isPhone } = useDashboardLayout();

  if (!steps?.length) return null;

  if (isPhone) {
    return (
      <View style={{ marginTop: 10, alignSelf: 'flex-start', maxWidth: '100%' }}>
        {steps.map((step, index) => (
          <Fragment key={`${step.label}-${index}`}>
            {index > 0 ? <FlowArrow direction="down" /> : null}
            <ActivityNode label={step.label} compact />
          </Fragment>
        ))}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        marginTop: 10,
        maxWidth: '100%',
      }}
    >
      {steps.map((step, index) => (
        <Fragment key={`${step.label}-${index}`}>
          {index > 0 ? <FlowArrow direction="right" /> : null}
          <ActivityNode label={step.label} />
        </Fragment>
      ))}
    </View>
  );
}
