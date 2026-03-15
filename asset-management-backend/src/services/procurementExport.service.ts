import ExcelJS from 'exceljs';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Procurement, ProcurementItem, Department, User } from '../models';
import { ConflictError } from '../utils/errorHandler';

const formatDate = (d: any): string => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}`;
};

export interface ProcurementExportQuery {
  from_date?: string;
  to_date?: string;
  receiving_department_id?: string | number;
  include_draft?: string | boolean;
  include_cancelled?: string | boolean;
  status?: string;
  year?: string | number;
}

const parseBool = (v: any, defaultValue = false): boolean => {
  if (v === undefined || v === null || v === '') return defaultValue;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y';
};

const parseDateOnly = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const money = (n: any): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

const applyMoneyFormat = (cell: ExcelJS.Cell) => {
  cell.numFmt = '#,##0';
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
};

const buildWhereProc = (query: ProcurementExportQuery): any => {
  const where: any = {};

  const includeDraft = parseBool(query.include_draft, true);
  const includeCancelled = parseBool(query.include_cancelled, false);

  if (query.status) {
    where.status = query.status;
  } else {
    const statuses: string[] = ['fulfilled'];
    if (includeDraft) statuses.push('draft');
    if (includeCancelled) statuses.push('cancelled');
    where.status = { [Op.in]: statuses };
  }

  if (query.receiving_department_id) {
    where.receiving_department_id = Number(query.receiving_department_id);
  }

  // date filters (prefer explicit from/to, otherwise year)
  const from = parseDateOnly(query.from_date);
  const to = parseDateOnly(query.to_date);
  if (from || to) {
    const start = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()) : new Date(1990, 0, 1);
    const end = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59) : new Date(2100, 11, 31, 23, 59, 59);
    where.purchase_date = { [Op.between]: [start, end] };
  } else if (query.year) {
    const year = parseInt(String(query.year), 10);
    if (!year || year < 1990 || year > 2100) throw new ConflictError('Năm không hợp lệ');
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    where.purchase_date = { [Op.between]: [start, end] };
  }

  return where;
};

export const exportProcurementsToExcel = async (query: ProcurementExportQuery): Promise<Buffer> => {
  const whereProc = buildWhereProc(query);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();

  // Sheet 1: Summary by category
  const sheet1 = workbook.addWorksheet('Tong hop theo loai');
  sheet1.columns = [
    { header: 'Mã loại', key: 'category_code', width: 16 },
    { header: 'Loại tài sản', key: 'category', width: 40 },
    { header: 'Đơn vị', key: 'unit', width: 12 },
    { header: 'Tổng SL', key: 'total_quantity', width: 12 },
    { header: 'Tổng tiền', key: 'total_amount', width: 18 },
  ];

  // Style header
  sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  sheet1.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet1.getRow(1).height = 22;

  const summaryRows = await ProcurementItem.findAll({
    attributes: [
      'category_code',
      'category',
      'unit',
      [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
      [
        sequelize.fn(
          'SUM',
          sequelize.literal('COALESCE("ProcurementItem"."purchase_price", 0) * COALESCE("ProcurementItem"."quantity", 0)')
        ),
        'total_amount',
      ],
    ],
    include: [
      {
        model: Procurement,
        as: 'procurement',
        attributes: [],
        where: whereProc,
        required: true,
      },
    ],
    group: ['category_code', 'category', 'unit'],
    order: [[sequelize.literal('"total_amount"'), 'DESC']],
    raw: true,
  });

  let totalQty = 0;
  let totalAmt = 0;
  (summaryRows as any[]).forEach((r, idx) => {
    const qty = Number(r.total_quantity || 0);
    const amt = money(r.total_amount);
    totalQty += qty;
    totalAmt += amt;

    const row = sheet1.addRow({
      category_code: r.category_code || '',
      category: r.category || '',
      unit: r.unit || '',
      total_quantity: qty,
      total_amount: amt,
    });

    row.height = 18;
    row.getCell('total_quantity').alignment = { horizontal: 'right', vertical: 'middle' };
    applyMoneyFormat(row.getCell('total_amount'));

    if (idx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FA' } };
    }
  });

  // Total row
  const totalRow = sheet1.addRow({
    category_code: '',
    category: 'TỔNG CỘNG',
    unit: '',
    total_quantity: totalQty,
    total_amount: totalAmt,
  });
  totalRow.font = { bold: true };
  totalRow.getCell('total_quantity').alignment = { horizontal: 'right', vertical: 'middle' };
  applyMoneyFormat(totalRow.getCell('total_amount'));

  sheet1.views = [{ state: 'frozen', ySplit: 1 }];

  // Sheet 2: Detail
  const sheet2 = workbook.addWorksheet('Chi tiet phieu');
  sheet2.columns = [
    { header: 'Mã phiếu', key: 'code', width: 16 },
    { header: 'Ngày mua', key: 'purchase_date', width: 14 },
    { header: 'Phòng ban nhận', key: 'department', width: 26 },
    { header: 'Nội dung', key: 'title', width: 30 },
    { header: 'Nhà cung cấp', key: 'supplier_name', width: 26 },
    { header: 'Số HĐ', key: 'contract_no', width: 16 },
    { header: 'Số hóa đơn', key: 'invoice_no', width: 16 },
    { header: 'Mã đơn', key: 'order_code', width: 16 },
    { header: 'Tên tài sản', key: 'item_name', width: 30 },
    { header: 'Loại TS', key: 'category', width: 28 },
    { header: 'Mã loại', key: 'category_code', width: 14 },
    { header: 'ĐVT', key: 'unit', width: 10 },
    { header: 'SL', key: 'quantity', width: 10 },
    { header: 'Đơn giá', key: 'purchase_price', width: 16 },
    { header: 'Thành tiền', key: 'amount', width: 18 },
    { header: 'Serial', key: 'serial_number', width: 18 },
    { header: 'Vị trí', key: 'location', width: 22 },
    { header: 'Tình trạng', key: 'asset_condition', width: 14 },
    { header: 'Trạng thái phiếu', key: 'status', width: 14 },
  ];

  sheet2.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  sheet2.getRow(1).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  sheet2.getRow(1).height = 26;

  const procurements = await Procurement.findAll({
    where: whereProc,
    include: [
      { model: Department, as: 'receiving_department', attributes: ['id', 'name'] },
      { model: ProcurementItem, as: 'items', required: false },
      { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
    ],
    order: [['purchase_date', 'DESC'], ['id', 'DESC']],
  });

  let detailRowIndex = 0;
  for (const p of procurements as any[]) {
    const items = Array.isArray(p.items) ? p.items : [];
    if (!items.length) {
      const row = sheet2.addRow({
        code: p.code,
        purchase_date: formatDate(p.purchase_date),
        department: p.receiving_department?.name || '',
        title: p.title,
        supplier_name: p.supplier_name || '',
        contract_no: p.contract_no || '',
        invoice_no: p.invoice_no || '',
        order_code: p.order_code || '',
        item_name: '',
        category: '',
        category_code: '',
        unit: '',
        quantity: '',
        purchase_price: '',
        amount: '',
        serial_number: '',
        location: '',
        asset_condition: '',
        status: p.status,
      });
      row.height = 18;
      detailRowIndex++;
      continue;
    }

    for (const it of items as any[]) {
      const qty = Number(it.quantity || 0);
      const price = money(it.purchase_price);
      const amt = qty * price;

      const row = sheet2.addRow({
        code: p.code,
        purchase_date: formatDate(p.purchase_date),
        department: p.receiving_department?.name || '',
        title: p.title,
        supplier_name: p.supplier_name || '',
        contract_no: p.contract_no || '',
        invoice_no: p.invoice_no || '',
        order_code: p.order_code || '',
        item_name: it.name || '',
        category: it.category || '',
        category_code: it.category_code || '',
        unit: it.unit || '',
        quantity: qty,
        purchase_price: price,
        amount: amt,
        serial_number: it.serial_number || '',
        location: it.location || '',
        asset_condition: it.asset_condition || '',
        status: p.status,
      });

      row.height = 18;
      row.getCell('quantity').alignment = { horizontal: 'right', vertical: 'middle' };
      applyMoneyFormat(row.getCell('purchase_price'));
      applyMoneyFormat(row.getCell('amount'));

      if (detailRowIndex % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FA' } };
      }

      detailRowIndex++;
    }
  }

  sheet2.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export default {
  exportProcurementsToExcel,
};
