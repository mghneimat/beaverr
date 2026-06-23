import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useI18n } from '../../../lib/i18n';
import { C, R, S, T, tabularNums } from '../../../constants/onboarding-theme';
import OnboardingPressable from '../OnboardingPressable';
import AnimatedAccordionBody from '../AnimatedAccordionBody';
import { washBg } from '../pressableFeedback';
import { CardHeaderExpandIcon } from '../../dashboard/CardHeaderActionButton';
import BreakdownSectionIcon from '../../dashboard/BreakdownSectionIcon';
import ReviewEditableRow from './ReviewEditableRow';
import ReviewBlockPenHeader from './ReviewBlockPenHeader';
import { reviewSectionHasEditableRows } from '../../../lib/reviewRowEdit';
import {
  isReviewSectionExpanded,
  setReviewSectionExpanded,
  isReviewSectionEditing,
  setReviewSectionEditing,
} from '../../../lib/reviewUiState';

const ROW_PAD_V = 8;
const BODY_PAD_H = 16;
const BODY_PAD_TOP = 8;
const BODY_PAD_BOTTOM = 6;
const BLOCK_DIVIDER_GAP = 12;

function ReviewBlockHeader({ block, editMode }) {
  if (block.editable && block.editKey) {
    return <ReviewBlockPenHeader block={block} editMode={editMode} />;
  }
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary, marginBottom: 4 }}>
      {block.title}
    </Text>
  );
}

function ReviewChildBlock({
  name,
  rows,
  totalLabel,
  totalFormatted,
  separatedTop = false,
  dividerTop = false,
  editMode = false,
  blockMeta = null,
}) {
  return (
    <View style={{
      paddingTop: separatedTop ? BLOCK_DIVIDER_GAP : 0,
      marginTop: dividerTop ? S.tabSectionTightGap : 0,
      borderTopWidth: dividerTop ? 1 : 0,
      borderTopColor: C.divider,
    }}>
      {blockMeta?.editable ? (
        <ReviewBlockHeader block={{ ...blockMeta, title: name }} editMode={editMode} />
      ) : (
        <Text style={{
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          color: C.muted,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
          {name}
        </Text>
      )}
      {rows.map((row, idx) => (
        <ReviewEditableRow
          key={row.key || `${name}-${idx}`}
          row={row}
          editMode={editMode}
          isLast={idx === rows.length - 1}
        />
      ))}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: ROW_PAD_V,
        borderTopWidth: 1,
        borderTopColor: C.divider,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }}>{totalLabel}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: C.text, ...tabularNums }}>{totalFormatted}</Text>
      </View>
    </View>
  );
}

const CANCEL_HOVER_BG = '#FEF2F2';
const CANCEL_PRESSED_BG = '#FEE2E2';

function ReviewEditBar({ editMode, onEdit, onCancel, editLabel, cancelLabel }) {
  const actionStyle = {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  };

  return (
    <View
      style={{
        height: 32,
        marginTop: S.tabSectionTightGap,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {editMode ? (
        <OnboardingPressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          style={({ pressed, hovered }) => ({
            ...actionStyle,
            backgroundColor: pressed
              ? CANCEL_PRESSED_BG
              : hovered
                ? CANCEL_HOVER_BG
                : 'transparent',
            ...(Platform.OS === 'web' ? {
              transitionProperty: 'background-color',
              transitionDuration: '0.12s',
              outlineStyle: hovered && !pressed ? 'solid' : 'none',
              outlineWidth: 1,
              outlineColor: 'rgba(239, 68, 68, 0.2)',
            } : {}),
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.danger }}>{cancelLabel}</Text>
        </OnboardingPressable>
      ) : (
        <OnboardingPressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={editLabel}
          style={({ pressed, hovered }) => ({
            ...actionStyle,
            backgroundColor: 'transparent',
            opacity: pressed || hovered ? 0.72 : 1,
            ...(Platform.OS === 'web' ? { transitionProperty: 'none', transitionDuration: '0s' } : {}),
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>{editLabel}</Text>
        </OnboardingPressable>
      )}
    </View>
  );
}

/**
 * Expandable review section — inline row edit mode with per-field pen icons.
 */
export default function ReviewSectionCard({
  title,
  subtitle,
  sectionId,
  sectionKey,
  scope = 'expense',
  iconEmoji,
  warning = false,
  defaultOpen = false,
  rows = [],
  childBlocks = [],
  debtBlocks = [],
  petBlocks = [],
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(() => isReviewSectionExpanded(sectionId) || defaultOpen);
  const [editMode, setEditMode] = useState(() => isReviewSectionEditing(sectionId));

  const canEdit = reviewSectionHasEditableRows(sectionId);
  const editLabel = t('onboarding.review.review.editSection');
  const cancelLabel = t('onboarding.review.review.cancelEditMode');

  const handleToggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      setReviewSectionExpanded(sectionId, next);
      if (!next) {
        setEditMode(false);
        setReviewSectionEditing(sectionId, false);
      }
      return next;
    });
  };

  const handleEdit = () => {
    if (!canEdit) return;
    setEditMode(true);
    setOpen(true);
    setReviewSectionExpanded(sectionId, true);
    setReviewSectionEditing(sectionId, true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setReviewSectionEditing(sectionId, false);
  };

  const hasBodyExtras = childBlocks.length > 0 || debtBlocks.length > 0 || petBlocks.length > 0;

  return (
    <View style={{
      marginBottom: 10,
      borderRadius: R.card,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      overflow: 'hidden',
    }}>
      <OnboardingPressable
        onPress={handleToggleOpen}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          gap: 12,
        }}
        style={({ pressed, hovered }) => ({
          width: '100%',
          paddingVertical: 14,
          paddingHorizontal: 16,
          backgroundColor: washBg({ pressed, hovered }, C.surface),
        })}
      >
        {({ hovered, pressed }) => (
          <>
            {sectionKey ? (
              <BreakdownSectionIcon sectionKey={sectionKey} scope={scope} size={40} />
            ) : (
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: C.surfaceTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 18 }}>{iconEmoji}</Text>
              </View>
            )}

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }} numberOfLines={2}>
                  {title}
                </Text>
                {warning ? (
                  <Text style={{ fontSize: 14, color: '#D97706' }} accessibilityLabel={t('onboarding.review.review.warningA11y')}>⚠</Text>
                ) : null}
              </View>
              {subtitle ? (
                <Text style={{ ...T.caption, color: warning ? '#D97706' : C.muted, marginTop: 2 }} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <CardHeaderExpandIcon expanded={open} color={C.muted} hovered={hovered} pressed={pressed} />
          </>
        )}
      </OnboardingPressable>

      <AnimatedAccordionBody open={open}>
        <View style={{
          paddingHorizontal: BODY_PAD_H,
          paddingTop: BODY_PAD_TOP,
          paddingBottom: BODY_PAD_BOTTOM,
          borderTopWidth: 1,
          borderTopColor: C.divider,
        }}>
          {rows.map((row, idx) => (
            <ReviewEditableRow
              key={row.key || row.label}
              row={row}
              editMode={editMode}
              isLast={!hasBodyExtras && idx === rows.length - 1}
            />
          ))}

          {childBlocks.map((block, idx) => (
            <ReviewChildBlock
              key={block.name}
              name={block.displayName || block.name}
              rows={block.rows}
              totalLabel={block.totalLabel}
              totalFormatted={block.totalFormatted}
              separatedTop={idx > 0 || rows.length > 0}
              dividerTop={idx > 0}
              editMode={editMode}
              blockMeta={block}
            />
          ))}

          {debtBlocks.map((block, blockIdx) => (
            <View key={block.key} style={{
              paddingTop: blockIdx === 0 && rows.length === 0 && childBlocks.length === 0 ? 0 : BLOCK_DIVIDER_GAP,
              marginTop: blockIdx === 0 ? 0 : S.tabSectionTightGap,
              borderTopWidth: blockIdx === 0 && rows.length === 0 && childBlocks.length === 0 ? 0 : 1,
              borderTopColor: C.divider,
            }}>
              <ReviewBlockHeader block={block} editMode={editMode} />
              {block.rows.map((row, idx) => (
                <ReviewEditableRow
                  key={row.key || row.label}
                  row={row}
                  editMode={editMode}
                  isLast={idx === block.rows.length - 1}
                />
              ))}
            </View>
          ))}

          {petBlocks.map((block, blockIdx) => (
            <View key={block.key} style={{
              paddingTop: blockIdx === 0 && rows.length === 0 && childBlocks.length === 0 && debtBlocks.length === 0 ? 0 : BLOCK_DIVIDER_GAP,
              marginTop: blockIdx === 0 ? 0 : S.tabSectionTightGap,
              borderTopWidth: blockIdx === 0 && rows.length === 0 && childBlocks.length === 0 && debtBlocks.length === 0 ? 0 : 1,
              borderTopColor: C.divider,
            }}>
              <ReviewBlockHeader block={block} editMode={editMode} />
              {block.rows.map((row, idx) => (
                <ReviewEditableRow
                  key={row.key || row.label}
                  row={row}
                  editMode={editMode}
                  isLast={idx === block.rows.length - 1}
                />
              ))}
            </View>
          ))}

          {canEdit ? (
            <ReviewEditBar
              editMode={editMode}
              onEdit={handleEdit}
              onCancel={handleCancelEdit}
              editLabel={editLabel}
              cancelLabel={cancelLabel}
            />
          ) : null}
        </View>
      </AnimatedAccordionBody>
    </View>
  );
}
