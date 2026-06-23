import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useI18n } from '../../lib/i18n';
import { describeStashMovement, formatStashMovementTableDate } from '../../lib/stashMovementDisplay';
import { signedMovementAmount } from '../../lib/stashMovements';
import { useBreakdownTableColumns } from '../../lib/dashboardLayout';
import { paginateItems, TABLE_PAGE_SIZES } from '../../lib/tablePagination';
import { C, R, T, tabularNums } from '../../constants/onboarding-theme';
import SurfaceCard from '../ui/SurfaceCard';
import { formatSignedCurrency } from '../../lib/finance';
import InCardSectionHeader from './InCardSectionHeader';
import DashboardTablePagination from './DashboardTablePagination';
import { BreakdownCell, BreakdownRow } from './BreakdownTablePrimitives';

const MOVEMENT_TABLE_GAP = 10;

function pillRowColors({ index }) {
  const striped = index % 2 === 1;
  return {
    bg: striped ? C.breakdownStripeBg : 'transparent',
    label: C.text,
  };
}

function columnHeaderTextStyle(align = 'left') {
  return {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: align,
  };
}

function movementRowStyle({ colors }) {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MOVEMENT_TABLE_GAP,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 52,
    borderRadius: R.pill,
    backgroundColor: colors.bg,
    width: '100%',
  };
}

function MovementColumnHeaders({ t, dateColMinW, amountColMinW }) {
  return (
    <BreakdownRow style={{ paddingHorizontal: 14, marginBottom: 8, gap: MOVEMENT_TABLE_GAP }}>
      <BreakdownCell minWidth={dateColMinW}>
        <Text style={columnHeaderTextStyle()}>
          {t('dashboard.stashMovements.columnDate')}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={1}>
        <Text style={columnHeaderTextStyle()}>
          {t('dashboard.stashMovements.columnDescription')}
        </Text>
      </BreakdownCell>
      <BreakdownCell minWidth={amountColMinW} align="right">
        <Text style={columnHeaderTextStyle('right')}>
          {t('dashboard.stashMovements.columnAmount')}
        </Text>
      </BreakdownCell>
    </BreakdownRow>
  );
}

function MovementPillRow({
  row,
  index,
  budget,
  currency,
  t,
  dateColMinW,
  amountColMinW,
}) {
  const signed = signedMovementAmount(row);
  const positive = signed > 0;
  const colors = pillRowColors({ index });
  const description = describeStashMovement(row, budget, t);
  const dateLabel = formatStashMovementTableDate(row.date);
  const amountColor = positive ? C.positive : signed < 0 ? C.primary : C.muted;

  return (
    <View
      style={movementRowStyle({ colors })}
      accessibilityLabel={t('dashboard.stashMovements.rowA11y', {
        date: dateLabel,
        description,
        amount: formatSignedCurrency(signed, currency, positive),
      })}
    >
      <BreakdownCell minWidth={dateColMinW}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.label }} numberOfLines={1}>
          {dateLabel}
        </Text>
      </BreakdownCell>
      <BreakdownCell flex={1}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.label }} numberOfLines={2}>
          {description}
        </Text>
      </BreakdownCell>
      <BreakdownCell minWidth={amountColMinW} align="right">
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: amountColor,
            textAlign: 'right',
            ...tabularNums,
          }}
        >
          {formatSignedCurrency(signed, currency, positive)}
        </Text>
      </BreakdownCell>
    </View>
  );
}

export default function StashMovementHistoryList({
  movements,
  budget,
  currency,
  titleKey = 'dashboard.stashMovements.title',
  emptyKey = 'dashboard.stashMovements.empty',
}) {
  const { t } = useI18n();
  const { amountColMinW, dateColMinW, narrow } = useBreakdownTableColumns();
  const movementDateColMinW = Math.max(dateColMinW, narrow ? 104 : 116);
  const movementAmountColMinW = Math.max(amountColMinW, narrow ? 88 : 96);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false);

  const pagination = useMemo(
    () => paginateItems(movements, pageIndex, pageSize),
    [movements, pageIndex, pageSize],
  );

  useEffect(() => {
    setPageIndex(0);
  }, [movements, pageSize]);

  useEffect(() => {
    if (pageIndex > pagination.pageCount - 1) {
      setPageIndex(Math.max(0, pagination.pageCount - 1));
    }
  }, [pageIndex, pagination.pageCount]);

  const showPagination = movements.length > TABLE_PAGE_SIZES[0];

  return (
    <SurfaceCard style={{ overflow: 'visible', zIndex: pageSizeMenuOpen ? 8 : 1 }}>
      <InCardSectionHeader title={t(titleKey)} />
      {movements.length === 0 ? (
        <Text style={{ ...T.helper, color: C.muted }}>
          {t(emptyKey)}
        </Text>
      ) : (
        <View style={{ gap: 8, width: '100%', alignSelf: 'stretch', overflow: 'visible' }}>
          <MovementColumnHeaders
            t={t}
            dateColMinW={movementDateColMinW}
            amountColMinW={movementAmountColMinW}
          />
          {pagination.pageItems.map((row, index) => (
            <MovementPillRow
              key={row.id}
              row={row}
              index={index}
              budget={budget}
              currency={currency}
              t={t}
              dateColMinW={movementDateColMinW}
              amountColMinW={movementAmountColMinW}
            />
          ))}

          {showPagination ? (
            <DashboardTablePagination
              pageIndex={pagination.pageIndex}
              pageCount={pagination.pageCount}
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
              pageSize={pageSize}
              pageSizeOptions={TABLE_PAGE_SIZES}
              onPageSizeChange={setPageSize}
              onPrevious={() => setPageIndex((p) => p - 1)}
              onNext={() => setPageIndex((p) => p + 1)}
              canPrevious={pagination.pageIndex > 0}
              canNext={pagination.pageIndex < pagination.pageCount - 1}
              onPageSizeMenuOpenChange={setPageSizeMenuOpen}
            />
          ) : null}
        </View>
      )}
    </SurfaceCard>
  );
}
