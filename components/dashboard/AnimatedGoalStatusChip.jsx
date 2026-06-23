import { useRef } from 'react';
import AnimatedCollapse from './AnimatedCollapse';
import StatusChip from './StatusChip';

/**
 * @param {{ chip?: { label: string, variant: string }|null, style?: object }} props
 */
export default function AnimatedGoalStatusChip({ chip, style }) {
  const lastChip = useRef(chip);
  if (chip) lastChip.current = chip;

  const displayChip = chip ?? lastChip.current;
  if (!displayChip) return null;

  return (
    <AnimatedCollapse visible={Boolean(chip)} fallbackHeight={28}>
      <StatusChip
        label={displayChip.label}
        variant={displayChip.variant}
        style={style}
      />
    </AnimatedCollapse>
  );
}
