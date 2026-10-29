type CellValue = string | number | boolean | Date | null | undefined;

export interface ExcelSheet {
  name: string;
  rows: CellValue[][];
  widths?: number[];
}

async function downloadWorkbook(filename: string, sheets: ExcelSheet[]): Promise<void> {
  const { default: ExcelJS } = await import('exceljs');

  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    for (const row of sheet.rows) worksheet.addRow(row);
    sheet.widths?.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Xuất danh sách object thành một sheet Excel (header lấy từ object đầu tiên). */
export async function exportObjectsToExcel(
  filename: string,
  sheetName: string,
  records: Record<string, CellValue>[],
): Promise<void> {
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const rows: CellValue[][] = [
    headers,
    ...records.map((record) => headers.map((header) => record[header])),
  ];
  await downloadWorkbook(filename, [{ name: sheetName, rows }]);
}

/** Xuất nhiều sheet dạng mảng giá trị (AOA). */
export async function exportSheetsToExcel(
  filename: string,
  sheets: ExcelSheet[],
): Promise<void> {
  await downloadWorkbook(filename, sheets);
}
