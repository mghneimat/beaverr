import { useState } from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { C, T, tabularNums } from '../../constants/onboarding-theme';
import TablePageSizeSelect from './TablePageSizeSelect';

export default function DashboardTablePagination({
  pageIndex,
  pageCount,
  rangeStart,
  rangeEnd,
  total,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  onPageSizeMenuOpenChange,
}) {
  const { t } = useI18n();
  const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false);

  const handlePageSizeMenuOpenChange = (open) => {
    setPageSizeMenuOpen(open);
    onPageSizeMenuOpenChange?.(open);
  };

  if (total === 0) return null;

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 12,
      gap: 12,
      overflow: 'visible',
      zIndex: pageSizeMenuOpen ? 40 : 2,
    }}
    >
      <TablePageSizeSelect
        value={pageSize}
        options={pageSizeOptions}
        onChange={onPageSizeChange}
        onOpenChange={handlePageSizeMenuOpenChange}
        opensUpward
      />

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
        marginLeft: 'auto',
      }}
      >
        <Pressable
          onPress={onPrevious}
          disabled={!canPrevious}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.tablePagination.previousA11y')}
          accessibilityState={{ disabled: !canPrevious }}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 4,
            opacity: !canPrevious ? 0.35 : pressed ? 0.65 : 1,
            ...(Platform.OS === 'web' && canPrevious ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
            {t('dashboard.tablePagination.previous')}
          </Text>
        </Pressable>

        <Text
          style={{ ...T.caption, color: C.muted, fontWeight: '600', textAlign: 'center', ...tabularNums }}
          accessibilityLabel={t('dashboard.tablePagination.pageRangeA11y', {
            start: String(rangeStart),
            end: String(rangeEnd),
            total: String(total),
            page: String(pageIndex + 1),
            pageCount: String(pageCount),
          })}
        >
          {t('dashboard.tablePagination.pageRange', {
            start: rangeStart,
            end: rangeEnd,
            total,
          })}
        </Text>

        <Pressable
          onPress={onNext}
          disabled={!canNext}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.tablePagination.nextA11y')}
          accessibilityState={{ disabled: !canNext }}
          style={({ pressed }) => ({
            paddingVertical: 6,
            paddingHorizontal: 4,
            opacity: !canNext ? 0.35 : pressed ? 0.65 : 1,
            ...(Platform.OS === 'web' && canNext ? { cursor: 'pointer' } : {}),
          })}
        >
          <Text style={{ ...T.caption, color: C.accent, fontWeight: '600' }}>
            {t('dashboard.tablePagination.next')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
