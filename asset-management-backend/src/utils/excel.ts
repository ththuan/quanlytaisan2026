import ExcelJS from 'exceljs';
import { ValidationError } from './errorHandler';

export interface ExcelReadOptions {
  maxRows?: number;
  maxColumns?: number;
}

function normalizeCellValue(value: ExcelJS.CellValue): string | number | boolean | Date {
  if (value === null || value === undefined) return '';

  if (value instanceof Date) return value;

  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('');
    }
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    if ('result' in value) {
      return normalizeCellValue((value as { result?: ExcelJS.CellValue }).result ?? '');
    }
    if ('error' in value) return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value);
}

/**
 * Đọc sheet đầu tiên của file Excel thành mảng object theo tên cột ở dòng 1.
 * Giới hạn số dòng/cột để tránh file độc hại làm cạn kiệt bộ nhớ/CPU.
 */
export async function readFirstSheetAsObjects(
  fileBuffer: Buffer,
  options: ExcelReadOptions = {},
): Promise<Record<string, string | number | boolean | Date>[]> {
  const maxRows = options.maxRows ?? 20_000;
  const maxColumns = options.maxColumns ?? 100;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new ValidationError('File Excel không có sheet dữ liệu.');
  }

  if (worksheet.actualRowCount > maxRows + 1) {
    throw new ValidationError(`File Excel có quá nhiều dòng (tối đa ${maxRows} dòng dữ liệu).`);
  }
  if (worksheet.actualColumnCount > maxColumns) {
    throw new ValidationError(`File Excel có quá nhiều cột (tối đa ${maxColumns} cột).`);
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    headers[columnNumber] = String(normalizeCellValue(cell.value)).trim();
  });

  const rows: Record<string, string | number | boolean | Date>[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const record: Record<string, string | number | boolean | Date> = {};
    let hasValue = false;

    headers.forEach((header, columnNumber) => {
      if (!header) return;
      const value = normalizeCellValue(row.getCell(columnNumber).value);
      record[header] = value;
      if (value !== '' && value !== null && value !== undefined) hasValue = true;
    });

    if (hasValue) rows.push(record);
  });

  return rows;
}
