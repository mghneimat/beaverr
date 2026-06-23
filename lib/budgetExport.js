import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import XLSX from 'xlsx-js-style';
import { C } from '../constants/onboarding-theme';

export { buildBudgetExportRows } from './budgetExportRows';

/** @typedef {'section' | 'breakdown' | 'category' | 'item' | 'total'} ExportRowLevel */

/**
 * @typedef {Object} BudgetExportRow
 * @property {ExportRowLevel} level
 * @property {string} label
 * @property {string} amount - Formatted number (no currency code)
 * @property {string} currency
 * @property {'default' | 'income' | 'expense' | 'total-positive' | 'total-negative'} tone
 */

/**
 * @typedef {Object} BudgetExportMeta
 * @property {string} title
 * @property {string} summaryTitle
 * @property {string} amountTitle
 * @property {string} currency
 * @property {string} [fileBaseName] - Download basename without extension (default: flexible-budget)
 * @property {string} [sheetName] - XLSX sheet tab name (default: Budget)
 */

function getExportTheme() {
  const navWash = C.navWash || C.surfaceTint || C.bg;
  return {
    bg: C.bg.replace('#', ''),
    surface: C.surface.replace('#', ''),
    primary: C.primary.replace('#', ''),
    muted: C.muted.replace('#', ''),
    danger: C.danger.replace('#', ''),
    positive: C.positive.replace('#', ''),
    border: C.border.replace('#', ''),
    placeholder: C.placeholder.replace('#', ''),
    categoryBg: navWash.replace('#', ''),
  };
}

function buildThinBorder(theme) {
  return {
    top: { style: 'thin', color: { rgb: theme.border } },
    bottom: { style: 'thin', color: { rgb: theme.border } },
    left: { style: 'thin', color: { rgb: theme.border } },
    right: { style: 'thin', color: { rgb: theme.border } },
  };
}

const INDENT_EM = '\u2003';

/**
 * @param {ExportRowLevel} level
 * @returns {string}
 */
function indentLabel(level, label) {
  if (level === 'breakdown' || level === 'category') {
    return `${INDENT_EM}${INDENT_EM}${label}`;
  }
  if (level === 'item') {
    return `${INDENT_EM}${INDENT_EM}${INDENT_EM}${INDENT_EM}${label}`;
  }
  return label;
}

/**
 * @param {ExportRowLevel} level
 * @param {'label' | 'amount' | 'currency'} column
 * @param {BudgetExportRow['tone']} tone
 */
function xlsxCellStyle(level, column, tone) {
  const THEME = getExportTheme();
  const thinBorder = buildThinBorder(THEME);
  const base = {
    font: { name: 'Inter', sz: 11, color: { rgb: THEME.primary } },
    border: thinBorder,
    alignment: { vertical: 'center', wrapText: true },
  };

  if (level === 'section') {
    if (column === 'label') {
      return { ...base, font: { ...base.font, sz: 12, color: { rgb: THEME.primary } }, fill: { fgColor: { rgb: THEME.surface } } };
    }
    if (column === 'amount') {
      return { ...base, font: { ...base.font, sz: 12, bold: true, color: { rgb: THEME.primary } }, alignment: { ...base.alignment, horizontal: 'center' }, fill: { fgColor: { rgb: THEME.surface } } };
    }
    return { ...base, font: { ...base.font, sz: 10, color: { rgb: THEME.placeholder } }, alignment: { ...base.alignment, horizontal: 'center' }, fill: { fgColor: { rgb: THEME.surface } } };
  }

  if (level === 'breakdown') {
    const fill = { fgColor: { rgb: THEME.bg } };
    if (column === 'label') {
      return { ...base, font: { ...base.font, color: { rgb: THEME.muted } }, fill, alignment: { ...base.alignment, indent: 2 } };
    }
    if (column === 'amount') {
      return { ...base, font: { ...base.font, bold: true, color: { rgb: THEME.primary } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
    }
    return { ...base, font: { ...base.font, sz: 10, color: { rgb: THEME.placeholder } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
  }

  if (level === 'category') {
    const fill = { fgColor: { rgb: THEME.categoryBg } };
    if (column === 'label') {
      return { ...base, font: { ...base.font, bold: true, color: { rgb: THEME.primary } }, fill, alignment: { ...base.alignment, indent: 2 } };
    }
    if (column === 'amount') {
      return { ...base, font: { ...base.font, bold: true, color: { rgb: THEME.danger } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
    }
    return { ...base, font: { ...base.font, sz: 10, color: { rgb: THEME.placeholder } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
  }

  if (level === 'item') {
    const fill = { fgColor: { rgb: THEME.bg } };
    if (column === 'label') {
      return { ...base, font: { ...base.font, sz: 10, color: { rgb: THEME.muted } }, fill, alignment: { ...base.alignment, indent: 4 } };
    }
    if (column === 'amount') {
      return { ...base, font: { ...base.font, sz: 10, color: { rgb: THEME.muted } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
    }
    return { ...base, font: { ...base.font, sz: 9, color: { rgb: THEME.placeholder } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
  }

  // total
  const fill = { fgColor: { rgb: THEME.bg } };
  const amountColor = tone === 'total-negative' ? THEME.danger : THEME.positive;
  if (column === 'label') {
    return { ...base, font: { ...base.font, sz: 12, bold: true, color: { rgb: THEME.primary } }, fill };
  }
  if (column === 'amount') {
    return { ...base, font: { ...base.font, sz: 13, bold: true, color: { rgb: amountColor } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
  }
  return { ...base, font: { ...base.font, sz: 11, bold: true, color: { rgb: THEME.placeholder } }, fill, alignment: { ...base.alignment, horizontal: 'center' } };
}

/**
 * @param {BudgetExportRow[]} rows
 * @param {BudgetExportMeta} meta
 */
function rowsToCsv(rows, meta) {
  const header = `${meta.summaryTitle},${meta.amountTitle},${meta.currency}\n`;
  const body = rows
    .map((r) => {
      const label = indentLabel(r.level, r.label).replace(/"/g, '""');
      return `"${label}","${r.amount.replace(/"/g, '""')}","${r.currency.replace(/"/g, '""')}"`;
    })
    .join('\n');
  return `\uFEFF${header}${body}`;
}

async function shareFile(uri, mimeType) {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType, UTI: mimeType });
  }
}

async function saveAndShare(content, filename, mimeType, encoding = 'utf8') {
  if (Platform.OS === 'web') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
  await shareFile(path, mimeType);
}

/**
 * @param {BudgetExportRow[]} rows
 * @param {BudgetExportMeta} meta
 */
export async function exportBudgetCsv(rows, meta) {
  const csv = rowsToCsv(rows, meta);
  const base = meta.fileBaseName || 'rollover';
  await saveAndShare(csv, `${base}.csv`, 'text/csv;charset=utf-8');
}

/**
 * @param {BudgetExportRow[]} rows
 * @param {BudgetExportMeta} meta
 */
export async function exportBudgetXlsx(rows, meta) {
  const THEME = getExportTheme();
  const thinBorder = buildThinBorder(THEME);
  const headerStyle = {
    font: { name: 'Inter', sz: 10, bold: true, color: { rgb: THEME.muted } },
    fill: { fgColor: { rgb: THEME.bg } },
    border: thinBorder,
    alignment: { vertical: 'center', horizontal: 'left' },
  };
  const headerAmountStyle = {
    ...headerStyle,
    alignment: { ...headerStyle.alignment, horizontal: 'center' },
  };

  const sheetRows = [
    [
      { v: meta.summaryTitle, t: 's', s: headerStyle },
      { v: meta.amountTitle, t: 's', s: headerAmountStyle },
      { v: meta.currency, t: 's', s: headerAmountStyle },
    ],
    ...rows.map((r) => [
      { v: r.label, t: 's', s: xlsxCellStyle(r.level, 'label', r.tone) },
      { v: r.amount, t: 's', s: xlsxCellStyle(r.level, 'amount', r.tone) },
      { v: r.currency, t: 's', s: xlsxCellStyle(r.level, 'currency', r.tone) },
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws['!cols'] = [{ wch: 42 }, { wch: 16 }, { wch: 8 }];
  ws['!rows'] = sheetRows.map((_, i) => ({ hpt: i === 0 ? 22 : 20 }));

  const wb = XLSX.utils.book_new();
  const sheetName = meta.sheetName || 'Budget';
  const fileBase = meta.fileBaseName || 'rollover';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  if (Platform.OS === 'web') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileBase}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const path = `${FileSystem.cacheDirectory}${fileBase}.xlsx`;
  await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
  await shareFile(path, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * @param {BudgetExportRow} row
 */
function pdfRowStyles(row) {
  const border = `border-top:1px solid ${C.border};`;
  const cellBase = `padding:8px 12px;${border}vertical-align:middle;`;

  if (row.level === 'section') {
    return {
      label: `${cellBase}padding-left:16px;font-size:14px;color:${C.text};background:${C.surface};border-right:1px solid ${C.border};`,
      amount: `${cellBase}text-align:center;font-size:14px;font-weight:600;color:${C.text};background:${C.surface};width:100px;`,
      currency: `${cellBase}text-align:center;font-size:11px;color:${C.placeholder};background:${C.surface};width:40px;`,
    };
  }
  if (row.level === 'breakdown') {
    return {
      label: `${cellBase}padding-left:28px;font-size:13px;color:${C.muted};background:${C.bg};border-right:1px solid ${C.border};`,
      amount: `${cellBase}text-align:center;font-size:13px;font-weight:500;color:${C.primary};background:${C.bg};width:100px;`,
      currency: `${cellBase}text-align:center;font-size:11px;color:${C.placeholder};background:${C.bg};width:40px;`,
    };
  }
  if (row.level === 'category') {
    return {
      label: `${cellBase}padding-left:28px;font-size:13px;font-weight:600;color:${C.text};background:${C.overlayHoverDarker};border-right:1px solid ${C.border};`,
      amount: `${cellBase}text-align:center;font-size:13px;font-weight:600;color:${C.danger};background:${C.overlayHoverDarker};width:100px;`,
      currency: `${cellBase}text-align:center;font-size:11px;color:${C.placeholder};background:${C.overlayHoverDarker};width:40px;`,
    };
  }
  if (row.level === 'item') {
    return {
      label: `${cellBase}padding-left:44px;font-size:12px;color:${C.muted};background:${C.bg};border-right:1px solid ${C.border};`,
      amount: `${cellBase}text-align:center;font-size:12px;color:${C.muted};background:${C.bg};width:100px;`,
      currency: `${cellBase}text-align:center;font-size:10px;color:${C.disabled};background:${C.bg};width:40px;`,
    };
  }
  const totalColor = row.tone === 'total-negative' ? C.danger : C.positive;
  return {
    label: `${cellBase}padding:14px 12px 14px 16px;font-size:14px;font-weight:700;color:${C.primary};background:${C.bg};border-right:1px solid ${C.border};`,
    amount: `${cellBase}padding:14px 12px;text-align:center;font-size:16px;font-weight:800;color:${totalColor};background:${C.bg};width:100px;`,
    currency: `${cellBase}padding:14px 12px;text-align:center;font-size:12px;font-weight:500;color:${C.placeholder};background:${C.bg};width:40px;`,
  };
}

/**
 * @param {BudgetExportRow[]} rows
 * @param {BudgetExportMeta} meta
 */
function buildPdfHtml(rows, meta) {
  const rowsHtml = rows
    .map((r) => {
      const s = pdfRowStyles(r);
      const label = r.label.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return `<tr>
        <td style="${s.label}">${label}</td>
        <td style="${s.amount}">${r.amount}</td>
        <td style="${s.currency}">${r.currency}</td>
      </tr>`;
    })
    .join('');

  const title = meta.title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const summaryTitle = meta.summaryTitle.replace(/&/g, '&amp;');
  const amountTitle = meta.amountTitle.replace(/&/g, '&amp;');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Inter, -apple-system, sans-serif; color: ${C.text}; background: ${C.bg}; padding: 24px; margin: 0; }
      h1 { font-size: 18px; font-weight: 700; color: ${C.primary}; margin: 0 0 16px; }
      .table-wrap { border: 1px solid ${C.border}; border-radius: 16px; overflow: hidden; background: ${C.surface}; }
      table { width: 100%; border-collapse: collapse; }
      thead th {
        background: ${C.bg};
        padding: 14px 12px;
        font-size: 12px;
        font-weight: 700;
        color: ${C.muted};
        letter-spacing: normal;
        border-bottom: 1px solid ${C.divider};
      }
      thead th:first-child { padding-left: 16px; text-align: left; border-right: 1px solid ${C.divider}; }
      thead th.amount-col { text-align: center; width: 100px; }
      thead th.currency-col { text-align: center; width: 40px; }
    </style></head><body>
    <h1>${title}</h1>
    <div class="table-wrap">
    <table>
      <thead><tr>
        <th>${summaryTitle}</th>
        <th class="amount-col">${amountTitle}</th>
        <th class="currency-col">${meta.currency}</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    </div></body></html>`;
}

/**
 * @param {BudgetExportRow[]} rows
 * @param {BudgetExportMeta} meta
 */
export async function exportBudgetPdf(rows, meta) {
  const html = buildPdfHtml(rows, meta);

  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri, 'application/pdf');
}
