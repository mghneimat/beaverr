import { View, ScrollView } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { useState } from 'react';
import { useI18n } from '../../../lib/i18n';
import { formatCurrency } from '../../../lib/finance';
import {
  EXTERNAL_COVERAGE_TYPES,
  sumCoverage,
} from '../../../lib/overspendCoverage';
import { parseAmount, amountToString } from '../../../lib/sectionEditStorage';
import { C, R, T, tabularNums } from '../../../constants/onboarding-theme';
import FormInput from '../../ui/FormInput';
import YesNoToggle from '../../onboarding/YesNoToggle';
import PillToggle from '../../onboarding/PillToggle';

/**
 * @param {import('../../../lib/schema').OverspendCoverage[]} rows
 * @param {number} index
 * @param {Partial<import('../../../lib/schema').OverspendCoverage>} patch
 */
function patchRow(rows, index, patch) {
  return rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

/**
 * @param {import('../../../lib/schema').OverspendCoverage[]} rows
 * @param {Record<string, number>} limits
 * @param {number} deficit
 * @param {string} currency
 */
export default function CycleCoverageEditor({
  rows,
  onChange,
  limits,
  deficit,
  currency,
}) {
  const { t } = useI18n();
  const [amountDrafts, setAmountDrafts] = useState({});
  const allocated = sumCoverage(rows);

  const amountValue = (index, row) => {
    if (amountDrafts[index] != null) return amountDrafts[index];
    return row.amount > 0 ? amountToString(row.amount) : '';
  };

  const commitAmount = (index, row) => {
    const text = amountDrafts[index] ?? (row.amount > 0 ? amountToString(row.amount) : '');
    const parsed = parseAmount(text);
    const num = parsed == null ? 0 : Math.max(0, parsed);
    onChange(patchRow(rows, index, { amount: num }));
    setAmountDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  return (
    <ScrollView
      style={{ maxHeight: 360 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: R.input,
        backgroundColor: C.surfaceTint,
      }}
      >
        <Text style={{ ...T.caption, color: C.muted }}>
          {t('dashboard.cycles.close.coverageAllocated')}
        </Text>
        <Text style={{
          ...T.caption,
          fontWeight: '700',
          color: C.danger,
          ...tabularNums,
        }}
        >
          {formatCurrency(allocated, currency)}
          {' / '}
          {formatCurrency(deficit, currency)}
        </Text>
      </View>

      {rows.map((row, index) => {
        const maxHint = row.source === 'external'
          ? null
          : limits[row.source];

        return (
          <View
            key={row.source}
            style={{
              padding: 12,
              borderRadius: R.input,
              borderWidth: 1,
              borderColor: C.border,
              gap: 10,
            }}
          >
            <Text style={{ ...T.helper, fontWeight: '600', color: C.primary }}>
              {t(`dashboard.cycles.coverage.${row.source}`)}
            </Text>
            {maxHint != null && maxHint > 0 ? (
              <Text style={{ ...T.caption, color: C.muted, marginTop: -4, ...tabularNums }}>
                {t('dashboard.cycles.close.coverageMax', {
                  amount: formatCurrency(maxHint, currency),
                })}
              </Text>
            ) : null}
            <FormInput
              label={t('dashboard.cycles.close.coverageAmountLabel')}
              value={amountValue(index, row)}
              onChangeText={(text) => setAmountDrafts((prev) => ({ ...prev, [index]: text }))}
              onBlur={() => commitAmount(index, row)}
              placeholder="0"
              numeric
              currency={currency}
              inCard
            />

            {row.source === 'external' && (Number(row.amount) || 0) > 0 ? (
              <>
                <Text style={{ ...T.caption, color: C.muted }}>
                  {t('dashboard.cycles.close.externalTypeLabel')}
                </Text>
                <View style={{ gap: 8 }}>
                  {[0, 1].map((rowIdx) => (
                    <View key={rowIdx} style={{ flexDirection: 'row', gap: 8 }}>
                      {EXTERNAL_COVERAGE_TYPES.slice(rowIdx * 3, rowIdx * 3 + 3).map((type) => (
                        <View key={type} style={{ flex: 1, minWidth: 0 }}>
                          <PillToggle
                            label={t(`dashboard.cycles.coverage.externalTypes.${type}`)}
                            selected={row.externalType === type}
                            onPress={() => onChange(patchRow(rows, index, { externalType: type }))}
                            borderRadius={R.pill}
                            paddingVertical={8}
                            paddingHorizontal={8}
                            fontSize={11}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
                <Text style={{ ...T.caption, color: C.muted }}>
                  {t('dashboard.cycles.close.trackObligationHelper')}
                </Text>
                <YesNoToggle
                  value={row.trackObligation !== false}
                  onChange={(yes) => onChange(patchRow(rows, index, { trackObligation: yes === true }))}
                  yesLabel={t('common.yes')}
                  noLabel={t('common.no')}
                />
                <FormInput
                  label={t('dashboard.cycles.close.coverageNoteLabel')}
                  optional
                  value={row.note || ''}
                  onChangeText={(text) => onChange(patchRow(rows, index, { note: text }))}
                  placeholder={t('dashboard.cycles.close.coverageNotePlaceholder')}
                  inCard
                />
              </>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
