import SelectableServicePill from './SelectableServicePill';

/**
 * Toggle suggestion chip — accent blue when active (matches subscription service pills).
 */
export default function SuggestionChip({ label, active, onPress, style }) {
  return (
    <SelectableServicePill
      label={label}
      active={active}
      onPress={onPress}
      style={{
        width: '48%',
        marginRight: 0,
        paddingVertical: 12,
        justifyContent: 'center',
        ...style,
      }}
    />
  );
}
