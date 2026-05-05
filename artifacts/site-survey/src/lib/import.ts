import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { createEntry, EQUIPMENT_LABELS, getEntriesByProject, type EquipmentType } from './db';
import { EQUIPMENT_FIELDS, getVisibleFields } from './equipment-fields';

const FIELD_SUFFIX_REGEX = /\s*\((Required|Optional)\)\s*$/i;

function normalizeHeader(value: unknown): string {
  return String(value ?? '').replace(FIELD_SUFFIX_REGEX, '').trim();
}

function getRowValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function isRowEmpty(values: string[]): boolean {
  return values.every((value) => value === '');
}

function getEquipmentTypeBySheetName(sheetName: string): EquipmentType | null {
  const normalized = sheetName.trim().toLowerCase();
  const entry = (Object.entries(EQUIPMENT_LABELS) as [EquipmentType, string][])
    .find(([, label]) => label.toLowerCase() === normalized);
  return entry ? entry[0] : null;
}

export interface ImportIssue {
  sheet: string;
  row: number;
  reason: string;
}

export interface ImportProgress {
  processedRows: number;
  totalRows: number;
  currentSheet: string;
}

export function downloadSampleTemplate(): void {
  const wb = XLSX.utils.book_new();

  const instructions = XLSX.utils.aoa_to_sheet([
    ['Site Survey Excel Template'],
    [''],
    ['How to use'],
    ['1. Fill rows under the right equipment sheet (Switchgear, Panel, etc.).'],
    ['2. Columns marked (Required) must be filled.'],
    ['3. Columns marked (Optional) can be left blank.'],
    ['4. Keep sheet names and header names unchanged.'],
    ['5. You can import this file from Export & Manage page.'],
  ]);
  instructions['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, instructions, 'Instructions');

  for (const [equipmentType, equipmentLabel] of Object.entries(EQUIPMENT_LABELS) as [EquipmentType, string][]) {
    const fields = EQUIPMENT_FIELDS[equipmentType];
    const headers = fields.map((field) => `${field.label} (${field.required ? 'Required' : 'Optional'})`);
    const optionsRow = fields.map((field) =>
      field.type === 'dropdown' && field.options?.length
        ? `Options: ${field.options.join(' / ')}`
        : ''
    );

    const sheet = XLSX.utils.aoa_to_sheet([headers, optionsRow]);
    sheet['!cols'] = headers.map((header) => ({ wch: Math.min(Math.max(header.length + 4, 20), 50) }));
    XLSX.utils.book_append_sheet(wb, sheet, equipmentLabel.substring(0, 31));
  }

  XLSX.writeFile(wb, 'Site_Survey_Sample_Template.xlsx');
}

function issueToCsv(issues: ImportIssue[]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = ['Sheet,Row,Reason'];
  for (const issue of issues) {
    lines.push(`${escape(issue.sheet)},${issue.row},${escape(issue.reason)}`);
  }
  return lines.join('\r\n');
}

export function downloadImportErrorReport(issues: ImportIssue[], baseName = 'import-errors'): void {
  if (issues.length === 0) return;
  const csvBlob = new Blob([issueToCsv(issues)], { type: 'text/csv;charset=utf-8' });
  saveAs(csvBlob, `${baseName}.csv`);

  const txt = issues.map((issue) => `${issue.sheet} row ${issue.row}: ${issue.reason}`).join('\n');
  const txtBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  saveAs(txtBlob, `${baseName}.txt`);
}

export async function importWorkbookToProject(
  projectId: string,
  file: File,
  onProgress?: (progress: ImportProgress) => void
): Promise<{ created: number; skipped: number; issues: ImportIssue[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  let created = 0;
  let skipped = 0;
  const issues: ImportIssue[] = [];
  const existingByType = new Map<EquipmentType, Set<string>>();
  for (const eqType of Object.keys(EQUIPMENT_LABELS) as EquipmentType[]) {
    existingByType.set(eqType, new Set());
  }
  const existingEntries = await getEntriesByProject(projectId);
  for (const entry of existingEntries) {
    const normalized = (entry.data.name || '').trim().toLowerCase();
    if (!normalized) continue;
    existingByType.get(entry.type)?.add(normalized);
  }

  let totalRows = 0;
  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Summary' || sheetName === 'Instructions') continue;
    const equipmentType = getEquipmentTypeBySheetName(sheetName);
    if (!equipmentType) continue;
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    if (rows.length > 1) totalRows += rows.length - 1;
  }

  let processedRows = 0;

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Summary' || sheetName === 'Instructions') continue;

    const equipmentType = getEquipmentTypeBySheetName(sheetName);
    if (!equipmentType) continue;

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    const headerRow = (rows[0] || []).map(normalizeHeader);
    const indexByHeader = new Map<string, number>();
    headerRow.forEach((header, index) => {
      if (header) indexByHeader.set(header, index);
    });

    const seenNames = existingByType.get(equipmentType)!;
    const fields = EQUIPMENT_FIELDS[equipmentType];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      processedRows++;
      onProgress?.({ processedRows, totalRows, currentSheet: sheetName });
      const row = rows[rowIndex] || [];
      const rowValues = row.map(getRowValue);
      if (isRowEmpty(rowValues)) continue;

      const data: Record<string, string> = {};
      for (const field of fields) {
        const idx = indexByHeader.get(field.label);
        data[field.name] = idx === undefined ? '' : getRowValue(row[idx]);
      }

      const normalizedName = (data.name || '').trim().toLowerCase();
      if (normalizedName && seenNames.has(normalizedName)) {
        skipped++;
        issues.push({
          sheet: sheetName,
          row: rowIndex + 1,
          reason: `Duplicate equipment name "${data.name}" in this project.`,
        });
        continue;
      }

      const visibleFields = getVisibleFields(equipmentType, data);
      const missingRequired = visibleFields.some((field) => field.required && !data[field.name]);
      if (missingRequired) {
        skipped++;
        issues.push({
          sheet: sheetName,
          row: rowIndex + 1,
          reason: 'Missing required field(s).',
        });
        continue;
      }

      try {
        await createEntry(projectId, equipmentType, data, [], { skipUniqueCheck: true });
        if (normalizedName) seenNames.add(normalizedName);
        created++;
      } catch (err) {
        skipped++;
        const message = err instanceof Error ? err.message : 'unknown error';
        issues.push({
          sheet: sheetName,
          row: rowIndex + 1,
          reason: message,
        });
      }
    }
  }

  return { created, skipped, issues };
}
