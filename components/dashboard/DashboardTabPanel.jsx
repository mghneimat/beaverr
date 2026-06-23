import SettleCrossfade from '../ui/SettleCrossfade';

/**
 * Fade + settle slide when in-page tab panel key changes (e.g. expenses primary/secondary tabs).
 */
export default function DashboardTabPanel({ panelKey, children, style }) {
  return (
    <SettleCrossfade animationKey={panelKey} style={style}>
      {children}
    </SettleCrossfade>
  );
}
