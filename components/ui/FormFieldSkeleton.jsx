import { View } from 'react-native';
import SkeletonLine from './SkeletonLine';

/**
 * Compact inline form skeleton — label + field rows.
 */
export default function FormFieldSkeleton({ rows = 3, style }) {
  return (
    <View style={[{ gap: 16, width: '100%' }, style]}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ gap: 8 }}>
          <SkeletonLine width="32%" height={12} />
          <SkeletonLine width="100%" height={44} />
        </View>
      ))}
    </View>
  );
}
