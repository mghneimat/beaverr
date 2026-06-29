import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import Animated from 'react-native-reanimated';
import { useI18n } from '../../lib/i18n';
import { useDashboardScroll } from '../../lib/dashboardScroll';
import { ledgerColumnMinWidth, useBreakdownTableColumns } from '../../lib/dashboardLayout';
import { runInlineSave } from '../../lib/inlineSaveImpact';
import { emitSaveFeedback } from '../../lib/dashboardSaveFeedback';
import { emitDashboardToast } from '../../lib/dashboardToast';
import { C, R, S, T, tabularNums } from '../../constants/onboarding-theme';
import InCardSectionHeader from './InCardSectionHeader';
import SurfaceCard from '../ui/SurfaceCard';
import ConfirmDialog from '../ui/ConfirmDialog';
import AnimatedCollapse from './AnimatedCollapse';
import BreakdownSectionIcon from './BreakdownSectionIcon';
import {
  BreakdownCell,
  BreakdownPillRowSlot,
  BreakdownRow,
  LedgerCardRow,
  usePillRowSelectMotion,
  ledgerValueCellColor,
} from './BreakdownTablePrimitives';
import DashboardSectionEmptyMessage from './DashboardSectionEmptyMessage';

const CHEVRON_SLOT = 28;

function pillRowColors({ index, selected, pressed, hovered }) {
  if (selected) {
    return {
      bg: C.pillSelectedBg,
      label: C.pillSelectedText,
      meta: 'rgba(255,255,255,0.78)',
    };
  }
  const striped = index % 2 === 1;
  let bg = striped ? C.breakdownStripeBg : 'transparent';
  if (pressed || hovered) bg = C.breakdownRowHover;
  return { bg, label: C.text, meta: C.muted };
}

function LedgerPillColumnHeaders({ columns, narrow, columnGap = 10 }) {
  return (
    <BreakdownRow style={{ paddingHorizontal: 14, marginBottom: 8, gap: columnGap }}>
      <View style={{ width: 36, flexShrink: 0 }} />
      {columns.map((col) => {
        const minW = col.minWidth ?? ledgerColumnMinWidth(col.key, narrow);
        const align = col.align || (col.key === 'name' ? 'left' : 'right');
        return (
          <BreakdownCell
            key={col.key}
            flex={col.flex ?? (col.key === 'name' ? 1 : undefined)}
            minWidth={minW}
            align={align}
          >
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              textAlign: align === 'center' ? 'center' : col.key === 'name' ? 'left' : 'right',
              width: '100%',
            }}
            numberOfLines={1}
            >
              {col.label}
            </Text>
          </BreakdownCell>
        );
      })}
      <View style={{ width: CHEVRON_SLOT, flexShrink: 0 }} />
    </BreakdownRow>
  );
}

function LedgerPillRow({
  row,
  columns,
  index,
  selected,
  onSelect,
  selectA11yLabel,
  iconSectionKey,
  iconScope,
  narrow,
  columnGap = 10,
}) {
  const rowAnimStyle = usePillRowSelectMotion(selected);

  return (
    <Animated.View style={[{ width: '100%' }, rowAnimStyle]}>
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={selectA11yLabel}
      accessibilityState={{ selected }}
      style={({ pressed, hovered }) => {
        const c = pillRowColors({
          index,
          selected,
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        });
        return {
          flexDirection: 'row',
          alignItems: 'center',
          gap: columnGap,
          paddingVertical: 10,
          paddingHorizontal: 14,
          minHeight: 52,
          borderRadius: R.pill,
          backgroundColor: c.bg,
          width: '100%',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          opacity: pressed ? 0.92 : 1,
        };
      }}
    >
      {({ pressed, hovered }) => {
        const c = pillRowColors({
          index,
          selected,
          pressed,
          hovered: Platform.OS === 'web' && hovered,
        });
        return (
          <>
            <BreakdownSectionIcon
              sectionKey={row.iconSectionKey || iconSectionKey}
              scope={row.iconScope || iconScope}
              selected={selected}
            />
            {columns.map((col) => {
              const minW = col.minWidth ?? ledgerColumnMinWidth(col.key, narrow);
              const isName = col.key === 'name';
              const align = col.align || (isName ? 'left' : 'right');
              return (
                <BreakdownCell
                  key={col.key}
                  flex={col.flex ?? (isName ? 1 : undefined)}
                  minWidth={minW}
                  align={align}
                >
                  <Text style={{
                    fontSize: isName ? 15 : 14,
                    fontWeight: isName ? '600' : col.key === 'amount' ? '700' : '500',
                    color: isName
                      ? c.label
                      : ledgerValueCellColor({
                        colKey: col.key,
                        selected,
                        labelColor: c.label,
                        metaColor: c.meta,
                        tone: row.cellTones?.[col.key],
                      }),
                    textAlign: align === 'center' ? 'center' : isName ? 'left' : 'right',
                    width: '100%',
                    ...(!isName ? tabularNums : {}),
                  }}
                  numberOfLines={isName ? 2 : 1}
                  >
                    {row.cells[col.key]}
                  </Text>
                </BreakdownCell>
              );
            })}
            <View style={{ width: CHEVRON_SLOT, flexShrink: 0 }} />
          </>
        );
      }}
    </Pressable>
    </Animated.View>
  );
}

/**
 * Pill-style ledger table for expense/income sub-tab line items.
 */
export default function LedgerPillDataTable({
  title,
  titleTrailing,
  headerBelow,
  headerStyle,
  footer,
  footerAlign = 'center',
  columns,
  rows,
  emptyLabel,
  iconSectionKey,
  iconScope = 'expense',
  currencyCode = 'CZK',
  renderEditPanel,
  canDeleteRow,
  onDeleteRow,
  initialEditingRowId,
  selectOpensEdit = false,
  columnGap = 10,
}) {
  const { t } = useI18n();
  const { narrow, tableLayout } = useBreakdownTableColumns();
  const cardMode = tableLayout === 'card';
  const { scrollToAnchor } = useDashboardScroll();
  const focusRowRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(initialEditingRowId || null);
  const [confirmRow, setConfirmRow] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [hiddenIds, setHiddenIds] = useState(() => new Set());

  const visibleRows = rows.filter((row) => !hiddenIds.has(row.id));

  useEffect(() => {
    if (!initialEditingRowId) return;
    setEditingId(initialEditingRowId);
    setSelectedId(initialEditingRowId);
  }, [initialEditingRowId]);

  useEffect(() => {
    if (!initialEditingRowId) return;
    if (editingId !== initialEditingRowId) return;
    const timer = setTimeout(() => {
      if (focusRowRef.current) scrollToAnchor(focusRowRef, 32);
    }, 400);
    return () => clearTimeout(timer);
  }, [initialEditingRowId, editingId, visibleRows.length, scrollToAnchor]);

  useEffect(() => {
    setHiddenIds(new Set());
    if (!initialEditingRowId) {
      setSelectedId(null);
      setEditingId(null);
    }
  }, [rows.map((r) => r.id).join('|'), initialEditingRowId]);

  const handleSelect = useCallback((row) => {
    if (selectOpensEdit && renderEditPanel) {
      setSelectedId(null);
      setEditingId((prev) => (prev === row.id ? null : row.id));
      return;
    }
    if (editingId === row.id) return;
    setSelectedId((prev) => (prev === row.id ? null : row.id));
  }, [editingId, renderEditPanel, selectOpensEdit]);

  const handleEdit = useCallback((row) => {
    setSelectedId(null);
    setEditingId(row.id);
  }, []);

  const handleDeleteRequest = useCallback((row) => {
    setSelectedId(null);
    setConfirmRow(row);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmRow || !onDeleteRow) return;
    setDeleting(true);
    const rowId = confirmRow.id;
    try {
      const { after, delta } = await runInlineSave(t, () => onDeleteRow(confirmRow));
      emitSaveFeedback({ after, delta, currencyCode });
      emitDashboardToast('deleted');
      setConfirmRow(null);
      setEditingId(null);
      setHiddenIds((prev) => new Set(prev).add(rowId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }, [confirmRow, onDeleteRow, t, currencyCode]);

  const handleEditDone = useCallback(() => {
    setEditingId(null);
  }, []);

  return (
    <SurfaceCard style={{ overflow: 'visible' }}>
      {title ? (
        <InCardSectionHeader
          title={title}
          trailing={titleTrailing}
          style={[
            !headerBelow ? { marginBottom: S.sectionGap + 8 } : null,
            headerStyle,
          ]}
        />
      ) : null}

      {headerBelow ?? null}

      {visibleRows.length === 0 ? (
        <DashboardSectionEmptyMessage message={emptyLabel} variant="centered" />
      ) : (
        <View style={{ gap: 8, width: '100%', alignSelf: 'stretch', overflow: 'visible' }}>
          {!cardMode ? <LedgerPillColumnHeaders columns={columns} narrow={narrow} columnGap={columnGap} /> : null}
          {visibleRows.map((row, index) => {
            const selected = selectedId === row.id;
            const editing = editingId === row.id;
            const rowLabel = row.cells.name || row.cells.source || '';
            const showDelete = canDeleteRow ? canDeleteRow(row) : false;
            const isFocusRow = row.id === initialEditingRowId;

            return (
              <View
                key={row.id}
                ref={isFocusRow ? focusRowRef : undefined}
                collapsable={false}
              >
              <BreakdownPillRowSlot
                selected={selected}
                actionVisible={selected && !editing}
                crudAction={{
                  editLabel: t('common.edit'),
                  deleteLabel: t('common.delete'),
                  onEdit: () => handleEdit(row),
                  onDelete: () => handleDeleteRequest(row),
                  showDelete,
                  editA11yLabel: t('dashboard.ledgerTable.editRowA11y', { label: rowLabel }),
                  deleteA11yLabel: t('dashboard.ledgerTable.deleteRowA11y', { label: rowLabel }),
                }}
              >
                {cardMode ? (
                  <LedgerCardRow
                    columns={columns}
                    cells={row.cells}
                    cellTones={row.cellTones}
                    index={index}
                    selected={selected || editing}
                    onPress={() => handleSelect(row)}
                    accessibilityLabel={t('dashboard.ledgerTable.selectRowA11y', { label: rowLabel })}
                    leading={(
                      <BreakdownSectionIcon
                        sectionKey={row.iconSectionKey || iconSectionKey}
                        scope={row.iconScope || iconScope}
                        selected={selected || editing}
                      />
                    )}
                  />
                ) : (
                  <LedgerPillRow
                    row={row}
                    columns={columns}
                    index={index}
                    selected={selected || editing}
                    onSelect={() => handleSelect(row)}
                    selectA11yLabel={t('dashboard.ledgerTable.selectRowA11y', { label: rowLabel })}
                    iconSectionKey={iconSectionKey}
                    iconScope={iconScope}
                    narrow={narrow}
                    columnGap={columnGap}
                  />
                )}
                {renderEditPanel ? (
                  <AnimatedCollapse visible={editing} fallbackHeight={220}>
                    <View style={{
                      marginTop: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 16,
                      borderRadius: R.input,
                      backgroundColor: C.surfaceTint,
                    }}>
                      {renderEditPanel(row, {
                        onDone: handleEditDone,
                        onCancel: () => setEditingId(null),
                      })}
                    </View>
                  </AnimatedCollapse>
                ) : null}
              </BreakdownPillRowSlot>
              </View>
            );
          })}
        </View>
      )}

      {footer ? (
        <View style={{
          alignItems: footerAlign === 'end' ? 'flex-end' : 'center',
          alignSelf: 'stretch',
          width: '100%',
          marginTop: 16,
          paddingHorizontal: 14,
          paddingBottom: 4,
        }}>
          {footer}
        </View>
      ) : null}

      <ConfirmDialog
        visible={Boolean(confirmRow)}
        title={t('dashboard.ledgerTable.deleteConfirmTitle')}
        message={t('dashboard.ledgerTable.deleteConfirmMessage', {
          label: confirmRow?.cells?.name || confirmRow?.cells?.source || '',
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => !deleting && setConfirmRow(null)}
      />
    </SurfaceCard>
  );
}
