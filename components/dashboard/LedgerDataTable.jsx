import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import AnimatedRow from '../onboarding/AnimatedRow';
import { textButtonStyle } from '../../lib/pressableHover';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import InCardSectionHeader from './InCardSectionHeader';
import SurfaceCard from '../ui/SurfaceCard';
import { MaytechTableFrame, MaytechTableHeaderBand } from './BreakdownTablePrimitives';

const ACTION_WIDTH = 52;
const COLUMN_GAP = 12;

/**
 * Unified ledger table — header + optional per-row edit panel.
 */
export default function LedgerDataTable({
  title,
  titleTrailing,
  columns,
  rows,
  emptyLabel,
  renderEditPanel,
  editLabel = 'Edit',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const editable = Boolean(renderEditPanel);

  const toggleRow = (rowId) => {
    setExpandedId((prev) => (prev === rowId ? null : rowId));
  };

  return (
    <SurfaceCard>
      {title ? (
        <InCardSectionHeader title={title} trailing={titleTrailing} />
      ) : null}

      <MaytechTableFrame>
        <MaytechTableHeaderBand>
          <View style={{
            flexDirection: 'row',
            gap: COLUMN_GAP,
          }}>
            {columns.map((col) => (
              <Text
                key={col.key}
                style={{
                  ...T.caption,
                  fontWeight: '600',
                  color: C.muted,
                  flex: col.flex ?? 1,
                  flexBasis: 0,
                  textAlign: col.align || 'left',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
                numberOfLines={1}
              >
                {col.label}
              </Text>
            ))}
            {editable ? <View style={{ width: ACTION_WIDTH }} /> : null}
          </View>
        </MaytechTableHeaderBand>

        {rows.length === 0 ? (
          <Text style={{ ...T.helper, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 16 }}>
            {emptyLabel}
          </Text>
        ) : rows.map((row, idx) => {
          const isOpen = expandedId === row.id;
          return (
            <View key={row.id}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                gap: COLUMN_GAP,
                backgroundColor: C.surface,
                borderBottomWidth: idx < rows.length - 1 || isOpen ? 1 : 0,
                borderBottomColor: C.tableRowBorder,
              }}>{columns.map((col) => (
                  <Text
                    key={col.key}
                    style={{
                      flex: col.flex ?? 1,
                      flexBasis: 0,
                      fontSize: col.key === 'name' ? 15 : 14,
                      fontWeight: col.key === 'name' ? '500' : '600',
                      color: col.key === 'share' ? C.muted : C.primary,
                      textAlign: col.align || 'left',
                      ...tabularNums,
                    }}
                    numberOfLines={2}
                  >
                    {row.cells[col.key]}
                  </Text>
                ))}
                {editable ? (
                  <Pressable
                    onPress={() => toggleRow(row.id)}
                    accessibilityRole="button"
                    accessibilityLabel={editLabel}
                    accessibilityState={{ expanded: isOpen }}
                    style={({ pressed, hovered }) => ({
                      width: ACTION_WIDTH,
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 32,
                      ...textButtonStyle({ pressed, hovered }),
                    })}
                  >
                    {({ pressed, hovered }) => (
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: hovered ? C.accentPressed : C.accent,
                        opacity: pressed ? 0.7 : 1,
                        textAlign: 'center',
                      }}>
                        {editLabel}
                      </Text>
                    )}
                  </Pressable>
                ) : null}
              </View>

              {editable ? (
                <AnimatedRow visible={isOpen}>
                  <View style={{
                    marginTop: 8,
                    paddingHorizontal: 14,
                    paddingTop: 16,
                    paddingBottom: 16,
                    borderTopWidth: 1,
                    borderTopColor: C.divider,
                    backgroundColor: C.bg,
                  }}>
                    {renderEditPanel(row, {
                      onDone: () => setExpandedId(null),
                      onCancel: () => setExpandedId(null),
                    })}
                  </View>
                </AnimatedRow>
              ) : null}
            </View>
          );
        })}
      </MaytechTableFrame>
    </SurfaceCard>
  );
}
