import BreakdownSectionIcon from './BreakdownSectionIcon';
import { commitmentIconSectionKey } from '../../lib/commitmentIcon';

export { commitmentIconSectionKey };

/**
 * Circular category icon for a commitment row.
 * @param {{ sourceKey?: string|null, size?: number }} props
 */
export default function CommitmentSourceIcon({ sourceKey, size = 36 }) {
  return (
    <BreakdownSectionIcon
      sectionKey={commitmentIconSectionKey(sourceKey)}
      size={size}
    />
  );
}
