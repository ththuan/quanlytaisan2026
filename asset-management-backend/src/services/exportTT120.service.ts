/**
 * Export Service theo Thông tư 120/2025/TT-BTC
 * Xuất báo cáo công khai tài sản công theo mẫu biểu quy định
 *
 * Mẫu biểu được hỗ trợ:
 *   04a-CK/TSC – Công khai hình thành tài sản công
 *   04b-CK/TSC – Công khai tình hình sử dụng tài sản công
 *   04c-CK/TSC – Công khai tình hình xử lý tài sản công
 *   kekhai       – Kê khai tài sản công (CSDL Quốc gia)
 */

import ExcelJS from 'exceljs';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';

// ─── helpers ────────────────────────────────────────────────────────────────

const VND = (v: any) => (v ? Number(v) : 0);

function assetTypeName(a: any): string {
  if (a.category_code?.startsWith('DAT')) return 'Đất';
  if (a.category_code?.startsWith('NHA') || a.category?.includes('nhà') || a.category?.includes('công trình'))
    return 'Nhà, công trình';
  if (a.name?.toLowerCase().includes('ô tô') || a.name?.toLowerCase().includes('xe ô tô'))
    return 'Xe ô tô';
  return 'Máy móc, thiết bị';
}

function statusText(s: string): string {
  const m: Record<string, string> = {
    active: 'Đang sử dụng',
    inactive: 'Chưa sử dụng',
    damaged: 'Hư hỏng',
    lost: 'Mất',
    disposed: 'Đã xử lý',
    pending_disposal: 'Chờ xử lý',
    pending_repair: 'Chờ sửa chữa',
  };
  return m[s] ?? s;
}

function disposalFormText(t: string | null | undefined): string {
  const m: Record<string, string> = {
    liquidation: 'Thanh lý',
    destruction: 'Tiêu hủy',
    transfer: 'Điều chuyển',
    sell: 'Bán',
    recall: 'Thu hồi',
  };
  return t ? (m[t] ?? t) : '—';
}

function destructionMethodText(m: string | null | undefined): string {
  const map: Record<string, string> = {
    chemical: 'Sử dụng hóa chất',
    mechanical: 'Biện pháp cơ học',
    burial: 'Chôn lấp',
    software: 'Tháo gỡ/cài đặt lại phần mềm',
    other: 'Hình thức khác',
  };
  return m ? (map[m] ?? m) : '—';
}

// ─── header helpers ──────────────────────────────────────────────────────────

function applyHeaderStyle(row: ExcelJS.Row, bgArgb = 'FF1F497D') {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  });
}

function applyDataRowStyle(row: ExcelJS.Row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: 'hair' }, bottom: { style: 'hair' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
}

function addUnitHeader(ws: ExcelJS.Worksheet, unitName: string, year: number, title: string) {
  ws.mergeCells('A1:A3');
  ws.getCell('A1').value = 'TRƯỜNG CAO ĐẲNG KINH TẾ - KỸ THUẬT CẦN THƠ';
  ws.getCell('A1').font = { bold: true, size: 11 };
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

  const titleRowIdx = 5;
  ws.getRow(titleRowIdx).height = 30;
  ws.getCell(`A${titleRowIdx}`).value = title;
  ws.getCell(`A${titleRowIdx}`).font = { bold: true, size: 13 };
  ws.getCell(`A${titleRowIdx}`).alignment = { horizontal: 'center', vertical: 'middle' };

  ws.getCell(`A${titleRowIdx + 1}`).value = `Năm báo cáo: ${year} – Đơn vị: ${unitName}`;
  ws.getCell(`A${titleRowIdx + 1}`).font = { italic: true, size: 10 };
  ws.getCell(`A${titleRowIdx + 1}`).alignment = { horizontal: 'center' };

  return titleRowIdx + 3; // first data row (header starts here)
}

// ─── Mẫu 04a-CK/TSC ─────────────────────────────────────────────────────────
// Công khai tình hình hình thành tài sản công

export async function export04a(year: number): Promise<Buffer> {
  const assets: any[] = await sequelize.query(
    `SELECT a.*, d.name AS department_name, c.name AS category_name, c.code AS cat_code
     FROM assets a
     LEFT JOIN departments d ON a.current_department_id = d.id
     LEFT JOIN asset_categories c ON a.category_id = c.id
     WHERE (a.year_in_use = :year OR EXTRACT(YEAR FROM a.purchase_date) = :year)
     ORDER BY a.year_in_use, a.asset_code`,
    { replacements: { year }, type: QueryTypes.SELECT }
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Phần mềm Quản lý tài sản';
  const ws = wb.addWorksheet('04a-CKTSC');
  ws.columns = [
    { key: 'stt',      width: 6 },
    { key: 'name',     width: 40 },
    { key: 'type',     width: 20 },
    { key: 'unit',     width: 10 },
    { key: 'qty',      width: 8 },
    { key: 'price',    width: 18 },
    { key: 'nsnn',     width: 18 },
    { key: 'other',    width: 18 },
    { key: 'method',   width: 20 },
    { key: 'dept',     width: 30 },
    { key: 'note',     width: 20 },
  ];

  const headerRow = ws.addRow([
    'STT',
    'Tên tài sản\n(chi tiết từng TS)',
    'Loại tài sản',
    'ĐVT',
    'Số lượng',
    'Tổng nguyên giá\n(đồng)',
    'Trong đó:\nNgân sách NN',
    'Trong đó:\nNguồn khác',
    'Hình thức\nhình thành',
    'Đơn vị đang\nquản lý, sử dụng',
    'Ghi chú',
  ]);
  applyHeaderStyle(headerRow);

  let idx = 1;
  for (const a of assets) {
    const row = ws.addRow({
      stt:    idx++,
      name:   a.name,
      type:   assetTypeName({ ...a, category_code: a.cat_code }),
      unit:   a.unit ?? 'Cái',
      qty:    VND(a.quantity) || 1,
      price:  VND(a.purchase_price),
      nsnn:   VND(a.purchase_price), // mặc định từ NSNN; cột này có thể điều chỉnh
      other:  0,
      method: 'Mua sắm',
      dept:   a.department_name ?? '—',
      note:   '',
    });
    applyDataRowStyle(row);
    ['price', 'nsnn', 'other'].forEach((k) => {
      const c = row.getCell(k);
      c.numFmt = '#,##0';
      c.alignment = { ...c.alignment, horizontal: 'right' };
    });
  }

  // Totals
  const tot = ws.addRow({
    stt: '', name: 'TỔNG CỘNG', type: '', unit: '', qty: '',
    price: assets.reduce((s, a) => s + VND(a.purchase_price), 0),
    nsnn:  assets.reduce((s, a) => s + VND(a.purchase_price), 0),
    other: 0, method: '', dept: '', note: '',
  });
  tot.getCell('name').font = { bold: true };
  ['price', 'nsnn', 'other'].forEach((k) => {
    const c = tot.getCell(k);
    c.numFmt = '#,##0';
    c.font = { bold: true };
    c.alignment = { ...c.alignment, horizontal: 'right' };
  });
  applyDataRowStyle(tot);

  // title + metadata above data
  ws.spliceRows(1, 0,
    ['TRƯỜNG CAO ĐẲNG KINH TẾ - KỸ THUẬT CẦN THƠ', null, null, null, null, null, null, null, null, null, null],
    ['Mẫu số 04a-CK/TSC (TT120/2025/TT-BTC)', null, null, null, null, null, null, null, null, null, null],
    [],
    [`CÔNG KHAI TÌNH HÌNH HÌNH THÀNH TÀI SẢN CÔNG – NĂM ${year}`, null, null, null, null, null, null, null, null, null, null],
    [],
  );
  ws.getCell('A1').font = { bold: true, size: 11 };
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.mergeCells('A4:K4');
  ws.getCell('A4').font = { bold: true, size: 13 };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(4).height = 32;

  return wb.xlsx.writeBuffer() as unknown as Buffer;
}

// ─── Mẫu 04b-CK/TSC ─────────────────────────────────────────────────────────
// Công khai tình hình sử dụng tài sản công

export async function export04b(year: number): Promise<Buffer> {
  const assets: any[] = await sequelize.query(
    `SELECT a.*, d.name AS department_name, c.name AS category_name
     FROM assets a
     LEFT JOIN departments d ON a.current_department_id = d.id
     LEFT JOIN asset_categories c ON a.category_id = c.id
     WHERE a.status NOT IN ('disposed')
     ORDER BY a.current_department_id, a.asset_code`,
    { replacements: {}, type: QueryTypes.SELECT }
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Phần mềm Quản lý tài sản';
  const ws = wb.addWorksheet('04b-CKTSC');
  ws.columns = [
    { key: 'stt',      width: 6 },
    { key: 'code',     width: 16 },
    { key: 'name',     width: 38 },
    { key: 'type',     width: 18 },
    { key: 'unit',     width: 10 },
    { key: 'qty',      width: 8 },
    { key: 'price',    width: 18 },
    { key: 'residual', width: 18 },
    { key: 'deprec',   width: 18 },
    { key: 'status',   width: 18 },
    { key: 'dept',     width: 28 },
    { key: 'note',     width: 20 },
  ];

  const headerRow = ws.addRow([
    'STT', 'Mã tài sản', 'Tên tài sản', 'Loại tài sản', 'ĐVT', 'Số lượng',
    'Nguyên giá\n(đồng)', 'Giá trị còn lại\n(đồng)', 'Khấu hao lũy kế\n(đồng)',
    'Tình trạng\nsử dụng', 'Đơn vị sử dụng', 'Ghi chú',
  ]);
  applyHeaderStyle(headerRow);

  let idx = 1;
  for (const a of assets) {
    const row = ws.addRow({
      stt:      idx++,
      code:     a.asset_code,
      name:     a.name,
      type:     assetTypeName(a),
      unit:     a.unit ?? 'Cái',
      qty:      VND(a.quantity) || 1,
      price:    VND(a.purchase_price),
      residual: VND(a.residual_value),
      deprec:   VND(a.accumulated_depreciation),
      status:   statusText(a.status),
      dept:     a.department_name ?? '—',
      note:     '',
    });
    applyDataRowStyle(row);
    ['price', 'residual', 'deprec'].forEach((k) => {
      const c = row.getCell(k);
      c.numFmt = '#,##0';
      c.alignment = { ...c.alignment, horizontal: 'right' };
    });
  }

  const tot = ws.addRow({
    stt: '', code: '', name: 'TỔNG CỘNG', type: '', unit: '', qty: '',
    price:    assets.reduce((s, a) => s + VND(a.purchase_price), 0),
    residual: assets.reduce((s, a) => s + VND(a.residual_value), 0),
    deprec:   assets.reduce((s, a) => s + VND(a.accumulated_depreciation), 0),
    status: '', dept: '', note: '',
  });
  ['price', 'residual', 'deprec'].forEach((k) => {
    tot.getCell(k).numFmt = '#,##0';
    tot.getCell(k).font = { bold: true };
    tot.getCell(k).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  tot.getCell('name').font = { bold: true };
  applyDataRowStyle(tot);

  ws.spliceRows(1, 0,
    ['TRƯỜNG CAO ĐẲNG KINH TẾ - KỸ THUẬT CẦN THƠ'],
    ['Mẫu số 04b-CK/TSC (TT120/2025/TT-BTC)'],
    [],
    [`CÔNG KHAI TÌNH HÌNH SỬ DỤNG TÀI SẢN CÔNG – NĂM ${year}`],
    [],
  );
  ws.getCell('A1').font = { bold: true, size: 11 };
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.mergeCells('A4:L4');
  ws.getCell('A4').font = { bold: true, size: 13 };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(4).height = 32;

  return wb.xlsx.writeBuffer() as unknown as Buffer;
}

// ─── Mẫu 04c-CK/TSC ─────────────────────────────────────────────────────────
// Công khai tình hình xử lý tài sản công

export async function export04c(year: number): Promise<Buffer> {
  // Assets marked as disposed, or with AssetDisposalCase completed in the year
  const assets: any[] = await sequelize.query(
    `SELECT a.*, d.name AS department_name,
            di.disposal_type, di.disposal_method, di.destruction_method,
            di.revenue AS disposal_revenue, di.completed_at AS disposal_date
     FROM assets a
     LEFT JOIN departments d ON a.current_department_id = d.id
     LEFT JOIN LATERAL (
       SELECT adc.disposal_type,
              adc.disposal_method,
              adc.destruction_method,
              adi.sale_price AS revenue,
              adc.updated_at AS completed_at
       FROM asset_disposal_items adi
       JOIN asset_disposal_cases adc ON adi.disposal_case_id = adc.id
       WHERE adi.asset_id = a.id
         AND adc.status = 'completed'
         AND EXTRACT(YEAR FROM adc.updated_at) = :year
       ORDER BY adc.updated_at DESC
       LIMIT 1
     ) di ON TRUE
     WHERE a.status = 'disposed'
       AND (
         EXTRACT(YEAR FROM a.updated_at) = :year
         OR di.completed_at IS NOT NULL
       )
     ORDER BY a.updated_at DESC`,
    { replacements: { year }, type: QueryTypes.SELECT }
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Phần mềm Quản lý tài sản';
  const ws = wb.addWorksheet('04c-CKTSC');
  ws.columns = [
    { key: 'stt',      width: 6 },
    { key: 'code',     width: 16 },
    { key: 'name',     width: 38 },
    { key: 'type',     width: 18 },
    { key: 'unit',     width: 10 },
    { key: 'qty',      width: 8 },
    { key: 'price',    width: 18 },
    { key: 'residual', width: 18 },
    { key: 'form',     width: 18 },
    { key: 'method',   width: 22 },
    { key: 'revenue',  width: 18 },
    { key: 'note',     width: 20 },
  ];

  const headerRow = ws.addRow([
    'STT', 'Mã tài sản', 'Tên tài sản', 'Loại tài sản', 'ĐVT', 'Số lượng',
    'Nguyên giá\n(đồng)', 'Giá trị còn lại\n(đồng)',
    'Hình thức\nxử lý', 'Biện pháp\ntiêu hủy (nếu có)',
    'Tiền thu được\n(đồng)', 'Ghi chú',
  ]);
  applyHeaderStyle(headerRow);

  let idx = 1;
  for (const a of assets) {
    const form = a.disposal_type ? disposalFormText(a.disposal_type) : 'Thanh lý';
    const row = ws.addRow({
      stt:      idx++,
      code:     a.asset_code,
      name:     a.name,
      type:     assetTypeName(a),
      unit:     a.unit ?? 'Cái',
      qty:      VND(a.quantity) || 1,
      price:    VND(a.purchase_price),
      residual: VND(a.residual_value),
      form,
      method:   a.destruction_method ? destructionMethodText(a.destruction_method) : '—',
      revenue:  VND(a.disposal_revenue),
      note:     '',
    });
    applyDataRowStyle(row);
    ['price', 'residual', 'revenue'].forEach((k) => {
      const c = row.getCell(k);
      c.numFmt = '#,##0';
      c.alignment = { ...c.alignment, horizontal: 'right' };
    });
  }

  const tot = ws.addRow({
    stt: '', code: '', name: 'TỔNG CỘNG', type: '', unit: '', qty: '',
    price:    assets.reduce((s, a) => s + VND(a.purchase_price), 0),
    residual: assets.reduce((s, a) => s + VND(a.residual_value), 0),
    form: '', method: '',
    revenue:  assets.reduce((s, a) => s + VND(a.disposal_revenue), 0),
    note: '',
  });
  ['price', 'residual', 'revenue'].forEach((k) => {
    tot.getCell(k).numFmt = '#,##0';
    tot.getCell(k).font = { bold: true };
    tot.getCell(k).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  tot.getCell('name').font = { bold: true };
  applyDataRowStyle(tot);

  ws.spliceRows(1, 0,
    ['TRƯỜNG CAO ĐẲNG KINH TẾ - KỸ THUẬT CẦN THƠ'],
    ['Mẫu số 04c-CK/TSC (TT120/2025/TT-BTC)'],
    [],
    [`CÔNG KHAI TÌNH HÌNH XỬ LÝ TÀI SẢN CÔNG – NĂM ${year}`],
    [],
  );
  ws.getCell('A1').font = { bold: true, size: 11 };
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.mergeCells('A4:L4');
  ws.getCell('A4').font = { bold: true, size: 13 };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(4).height = 32;

  return wb.xlsx.writeBuffer() as unknown as Buffer;
}

// ─── Kê khai tài sản – CSDL Quốc gia ────────────────────────────────────────
// Định dạng kê khai theo NĐ 186/2025 / Thông tư 120/2025 (Điều 62-63)

export async function exportKeKhai(year: number): Promise<Buffer> {
  const assets: any[] = await sequelize.query(
    `SELECT a.*, d.name AS department_name
     FROM assets a
     LEFT JOIN departments d ON a.current_department_id = d.id
     WHERE a.status NOT IN ('disposed')
     ORDER BY a.current_department_id, a.asset_code`,
    { type: QueryTypes.SELECT }
  );

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Phần mềm Quản lý tài sản';
  const ws = wb.addWorksheet('Kê khai TS công');

  ws.columns = [
    { key: 'stt',        width: 6 },
    { key: 'code',       width: 16 },
    { key: 'type',       width: 18 },
    { key: 'name',       width: 38 },
    { key: 'unit',       width: 10 },
    { key: 'qty',        width: 8 },
    { key: 'year_use',   width: 12 },
    { key: 'price',      width: 18 },
    { key: 'residual',   width: 18 },
    { key: 'deprec',     width: 18 },
    { key: 'dep_rate',   width: 12 },
    { key: 'life',       width: 14 },
    { key: 'status',     width: 18 },
    { key: 'serial',     width: 20 },
    { key: 'location',   width: 22 },
    { key: 'dept',       width: 28 },
    { key: 'note',       width: 20 },
  ];

  const headerRow = ws.addRow([
    'STT', 'Mã tài sản', 'Loại tài sản', 'Tên tài sản',
    'ĐVT', 'Số lượng', 'Năm sử dụng',
    'Nguyên giá\n(đồng)', 'Giá trị còn lại\n(đồng)', 'KH lũy kế\n(đồng)',
    'Tỷ lệ KH\n(%/năm)', 'Thời gian SD\n(năm)', 'Tình trạng',
    'Số serial', 'Vị trí', 'Đơn vị sử dụng', 'Ghi chú',
  ]);
  applyHeaderStyle(headerRow, 'FF17375E');

  let idx = 1;
  for (const a of assets) {
    const row = ws.addRow({
      stt:      idx++,
      code:     a.asset_code,
      type:     assetTypeName(a),
      name:     a.name,
      unit:     a.unit ?? 'Cái',
      qty:      VND(a.quantity) || 1,
      year_use: a.year_in_use ?? '',
      price:    VND(a.purchase_price),
      residual: VND(a.residual_value),
      deprec:   VND(a.accumulated_depreciation),
      dep_rate: a.depreciation_rate ? Number(a.depreciation_rate) : '',
      life:     a.useful_life ?? '',
      status:   statusText(a.status),
      serial:   a.serial_number ?? '',
      location: a.location ?? '',
      dept:     a.department_name ?? '—',
      note:     '',
    });
    applyDataRowStyle(row);
    ['price', 'residual', 'deprec'].forEach((k) => {
      const c = row.getCell(k);
      c.numFmt = '#,##0';
      c.alignment = { ...c.alignment, horizontal: 'right' };
    });
    row.getCell('dep_rate').numFmt = '0.00';
  }

  // Totals
  const tot = ws.addRow({
    stt: '', code: '', type: '', name: 'TỔNG CỘNG',
    unit: '', qty: '', year_use: '',
    price:    assets.reduce((s, a) => s + VND(a.purchase_price), 0),
    residual: assets.reduce((s, a) => s + VND(a.residual_value), 0),
    deprec:   assets.reduce((s, a) => s + VND(a.accumulated_depreciation), 0),
    dep_rate: '', life: '', status: '', serial: '', location: '', dept: '', note: '',
  });
  ['price', 'residual', 'deprec'].forEach((k) => {
    tot.getCell(k).numFmt = '#,##0';
    tot.getCell(k).font = { bold: true };
    tot.getCell(k).alignment = { horizontal: 'right', vertical: 'middle' };
  });
  tot.getCell('name').font = { bold: true };
  applyDataRowStyle(tot);

  ws.spliceRows(1, 0,
    ['TRƯỜNG CAO ĐẲNG KINH TẾ - KỸ THUẬT CẦN THƠ'],
    ['BC kê khai tài sản công – CSDL Quốc gia (NĐ186/2025, TT120/2025)'],
    [],
    [`KÊ KHAI TÀI SẢN CÔNG – TÍNH ĐẾN ${new Date().toLocaleDateString('vi-VN')}`],
    [],
  );
  ws.getCell('A1').font = { bold: true, size: 11 };
  ws.getCell('A2').font = { italic: true, size: 10 };
  ws.mergeCells('A4:Q4');
  ws.getCell('A4').font = { bold: true, size: 13 };
  ws.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(4).height = 32;

  return wb.xlsx.writeBuffer() as unknown as Buffer;
}
