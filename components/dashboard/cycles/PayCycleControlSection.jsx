import PayCycleAnimatedBorder from './PayCycleAnimatedBorder';
import PayCycleControlTile from './PayCycleControlTile';

/**
 * Pay-cycle control — bordered card with title, helper, and Start/End button.
 */
export default function PayCycleControlSection({
  activeCycle,
  onStartPress,
  onEndPress,
  style,
}) {
  const active = Boolean(activeCycle);

  return (
    <PayCycleAnimatedBorder active={active} style={style}>
      <PayCycleControlTile
        activeCycle={activeCycle}
        onStartPress={onStartPress}
        onEndPress={onEndPress}
      />
    </PayCycleAnimatedBorder>
  );
}
