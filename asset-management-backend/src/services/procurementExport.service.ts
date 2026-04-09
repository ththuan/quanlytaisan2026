import ExcelJS from 'exceljs';
import { Op, QueryTypes } from 'sequelize';
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
    if (!year || year < 1990 || year > 2100) throw new ConflictError('NÄƒm khÃ´ng há»£p lá»‡');
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    where.purchase_date = { [Op.between]: [start, end] };
  }

  return where;
};

export const exportProcurementsToExcel = async (query: ProcurementExportQuery): Promise<Buffer> => {
  const whereProc = buildWhereProc(query);

  // Build SQL date/dept conditions shared across queries
  const yearParam = whereProc.purchase_date;
  const replacements: any = {};
  let dateSql = '';
  if (yearParam && yearParam[Op.between]) {
    dateSql = 'AND p.purchase_date BETWEEN :dateStart AND :dateEnd';
    replacements.dateStart = yearParam[Op.between][0];
    replacements.dateEnd = yearParam[Op.between][1];
  }
  const deptId = whereProc.receiving_department_id;
  let deptSql = '';
  if (deptId) {
    deptSql = 'AND p.receiving_department_id = :deptId';
    replacements.deptId = deptId;
  }

  // Query actual assets from fulfilled procurements via JSONB array join
  const assetRows = await sequelize.query<any>(`
    SELECT
      p.id            AS procurement_id,
      p.code          AS procurement_code,
      p.title,
      p.purchase_date,
      p.supplier_name,
      p.contract_no,
      p.invoice_no,
      p.order_code,
      p.status,
      COALESCE(d_recv.name, '') AS receiving_dept_name,
      a.id            AS asset_id,
      a.asset_code,
      a.name,
      a.category_code,
      a.category,
      a.unit,
      COALESCE(a.purchase_price, 0)  AS purchase_price,
      COALESCE(a.serial_number, '')  AS serial_number,
      COALESCE(a.location, '')       AS location,
      COALESCE(a.asset_condition::text, '') AS asset_condition,
      COALESCE(d_asset.name, d_recv.name, '') AS department_name
    FROM procurements p
    CROSS JOIN LATERAL jsonb_array_elements_text(
      CASE WHEN jsonb_typeof(p.created_asset_ids) = 'array' THEN p.created_asset_ids ELSE '[]'::jsonb END
    ) AS aid
    JOIN assets a ON a.id = aid::integer
    LEFT JOIN departments d_recv ON p.receiving_department_id = d_recv.id
    LEFT JOIN departments d_asset ON a.current_department_id = d_asset.id
    WHERE p.status = 'fulfilled'
    ${dateSql}
    ${deptSql}
    ORDER BY p.purchase_date DESC, p.id, a.id
  `, { replacements, type: QueryTypes.SELECT });

  // For non-fulfilled (draft) procurements if include_draft=true, use procurement_items
  const includeDraft = parseBool(query.include_draft, true);
  let draftItemRows: any[] = [];
  if (includeDraft) {
    const draftRepl: any = { ...replacements };
    const draftDateSql = dateSql.replace(':dateStart', ':dateStart').replace(':dateEnd', ':dateEnd');
    draftItemRows = await sequelize.query<any>(`
      SELECT
        p.id            AS procurement_id,
        p.code          AS procurement_code,
        p.title,
        p.purchase_date,
        p.supplier_name,
        p.contract_no,
        p.invoice_no,
        p.order_code,
        p.status,
        COALESCE(d_recv.name, '') AS receiving_dept_name,
        NULL AS asset_id,
        NULL AS asset_code,
        pi.name,
        pi.category_code,
        pi.category,
        pi.unit,
        COALESCE(pi.purchase_price, 0)  AS purchase_price,
        COALESCE(pi.serial_number, '')  AS serial_number,
        COALESCE(pi.location, '')       AS location,
        COALESCE(pi.asset_condition::text, '') AS asset_condition,
        COALESCE(d_recv.name, '') AS department_name,
        pi.quantity
      FROM procurements p
      JOIN procurement_items pi ON pi.procurement_id = p.id
      LEFT JOIN departments d_recv ON p.receiving_department_id = d_recv.id
      WHERE p.status = 'draft'
      ${draftDateSql}
      ${deptSql}
      ORDER BY p.purchase_date DESC, p.id, pi.id
    `, { replacements: draftRepl, type: QueryTypes.SELECT });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();

  const styleHeaderRow = (row: ExcelJS.Row) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    row.height = 26;
  };

  // â”€â”€ Sheet 1: Tá»•ng há»£p theo loáº¡i tÃ i sáº£n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sheet1 = workbook.addWorksheet('Tong hop theo loai');
  sheet1.columns = [
    { header: 'MÃ£ loáº¡i', key: 'category_code', width: 16 },
    { header: 'Loáº¡i tÃ i sáº£n', key: 'category', width: 36 },
    { header: 'TÃªn tÃ i sáº£n', key: 'name', width: 32 },
    { header: 'ÄÆ¡n vá»‹', key: 'unit', width: 12 },
    { header: 'Tá»•ng SL', key: 'total_quantity', width: 12 },
    { header: 'Tá»•ng tiá»n', key: 'total_amount', width: 18 },
  ];
  styleHeaderRow(sheet1.getRow(1));

  // Group asset rows by category/name
  const summaryMap = new Map<string, { category_code: string; category: string; name: string; unit: string; qty: number; amt: number }>();
  for (const r of assetRows) {
    const key = `${r.category_code || ''}|${r.category || ''}|${r.name || ''}|${r.unit || ''}`;
    const existing = summaryMap.get(key);
    if (existing) {
      existing.qty += 1;
      existing.amt += money(r.purchase_price);
    } else {
      summaryMap.set(key, {
        category_code: r.category_code || '',
        category: r.category || '',
        name: r.name || '',
        unit: r.unit || '',
        qty: 1,
        amt: money(r.purchase_price),
      });
    }
  }

  // Sort by category_code then amt desc
  const summaryList = Array.from(summaryMap.values()).sort((a, b) => {
    const cc = (a.category_code || '').localeCompare(b.category_code || '');
    return cc !== 0 ? cc : b.amt - a.amt;
  });

  let totalQty = 0;
  let totalAmt = 0;
  summaryList.forEach((r, idx) => {
    totalQty += r.qty;
    totalAmt += r.amt;
    const row = sheet1.addRow({
      category_code: r.category_code,
      category: r.category,
      name: r.name,
      unit: r.unit,
      total_quantity: r.qty,
      total_amount: r.amt,
    });
    row.height = 18;
    row.getCell('total_quantity').alignment = { horizontal: 'right', vertical: 'middle' };
    applyMoneyFormat(row.getCell('total_amount'));
    if (idx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FA' } };
    }
  });

  const totalRow = sheet1.addRow({
    category_code: '',
    category: 'Tá»”NG Cá»˜NG',
    name: '',
    unit: '',
    total_quantity: totalQty,
    total_amount: totalAmt,
  });
  totalRow.font = { bold: true };
  totalRow.getCell('total_quantity').alignment = { horizontal: 'right', vertical: 'middle' };
  applyMoneyFormat(totalRow.getCell('total_amount'));
  sheet1.views = [{ state: 'frozen', ySplit: 1 }];

  // â”€â”€ Sheet 2: Tá»•ng há»£p theo Ä‘Æ¡n vá»‹ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sheet2 = workbook.addWorksheet('Tong hop theo don vi');
  sheet2.columns = [
    { header: 'ÄÆ¡n vá»‹ nháº­n', key: 'department_name', width: 30 },
    { header: 'MÃ£ loáº¡i', key: 'category_code', width: 16 },
    { header: 'Loáº¡i tÃ i sáº£n', key: 'category', width: 36 },
    { header: 'TÃªn tÃ i sáº£n', key: 'asset_name', width: 32 },
    { header: 'ÄVT', key: 'unit', width: 10 },
    { header: 'Tá»•ng SL', key: 'total_quantity', width: 12 },
    { header: 'Tá»•ng tiá»n', key: 'total_amount', width: 18 },
  ];
  styleHeaderRow(sheet2.getRow(1));

  // Group by department + category/name
  type DeptKey = string;
  const deptMap = new Map<DeptKey, Map<string, { category_code: string; category: string; name: string; unit: string; qty: number; amt: number }>>();
  for (const r of assetRows) {
    const dept = r.department_name || 'KhÃ´ng xÃ¡c Ä‘á»‹nh';
    const key = `${r.category_code || ''}|${r.category || ''}|${r.name || ''}|${r.unit || ''}`;
    if (!deptMap.has(dept)) deptMap.set(dept, new Map());
    const inner = deptMap.get(dept)!;
    const ex = inner.get(key);
    if (ex) {
      ex.qty += 1;
      ex.amt += money(r.purchase_price);
    } else {
      inner.set(key, { category_code: r.category_code || '', category: r.category || '', name: r.name || '', unit: r.unit || '', qty: 1, amt: money(r.purchase_price) });
    }
  }

  let deptRowIdx = 0;
  for (const [deptName, innerMap] of Array.from(deptMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    let deptQty = 0;
    let deptAmt = 0;
    const items = Array.from(innerMap.values()).sort((a, b) => {
      const cc = (a.category_code || '').localeCompare(b.category_code || '');
      return cc !== 0 ? cc : b.amt - a.amt;
    });
    for (const r of items) {
      deptQty += r.qty;
      deptAmt += r.amt;
      const row = sheet2.addRow({
        department_name: deptName,
        category_code: r.category_code,
        category: r.category,
        asset_name: r.name,
        unit: r.unit,
        total_quantity: r.qty,
        total_amount: r.amt,
      });
      row.height = 18;
      row.getCell('total_quantity').alignment = { horizontal: 'right', vertical: 'middle' };
      applyMoneyFormat(row.getCell('total_amount'));
      if (deptRowIdx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FA' } };
      }
      deptRowIdx++;
    }
    // Subtotal per department
    const subRow = sheet2.addRow({
      department_name: `  Tá»•ng: ${deptName}`,
      category_code: '', category: '', asset_name: '', unit: '',
      total_quantity: deptQty,
      total_amount: deptAmt,
    });
    subRow.font = { bold: true, italic: true };
    subRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    subRow.getCell('total_quantity').alignment = { horizontal: 'right', vertical: 'middle' };
    applyMoneyFormat(subRow.getCell('total_amount'));
  }
  sheet2.views = [{ state: 'frozen', ySplit: 1 }];

  // â”€â”€ Sheet 3: Chi tiáº¿t tÄƒng tÃ i sáº£n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sheet3 = workbook.addWorksheet('Chi tiet tang tai san');
  sheet3.columns = [
    { header: 'MÃ£ phiáº¿u', key: 'code', width: 18 },
    { header: 'NgÃ y mua', key: 'purchase_date', width: 14 },
    { header: 'ÄÆ¡n vá»‹ nháº­n', key: 'department', width: 28 },
    { header: 'Ná»™i dung', key: 'title', width: 30 },
    { header: 'NhÃ  cung cáº¥p', key: 'supplier_name', width: 26 },
    { header: 'Sá»‘ HÄ', key: 'contract_no', width: 16 },
    { header: 'Sá»‘ hÃ³a Ä‘Æ¡n', key: 'invoice_no', width: 16 },
    { header: 'MÃ£ tÃ i sáº£n', key: 'asset_code', width: 18 },
    { header: 'TÃªn tÃ i sáº£n', key: 'item_name', width: 32 },
    { header: 'Loáº¡i tÃ i sáº£n', key: 'category', width: 30 },
    { header: 'MÃ£ loáº¡i', key: 'category_code', width: 14 },
    { header: 'ÄVT', key: 'unit', width: 10 },
    { header: 'ÄÆ¡n giÃ¡', key: 'purchase_price', width: 16 },
    { header: 'Serial', key: 'serial_number', width: 18 },
    { header: 'Vá»‹ trÃ­ sá»­ dá»¥ng', key: 'location', width: 24 },
    { header: 'TÃ¬nh tráº¡ng', key: 'asset_condition', width: 16 },
    { header: 'Tráº¡ng thÃ¡i phiáº¿u', key: 'status', width: 16 },
  ];
  styleHeaderRow(sheet3.getRow(1));

  const statusLabel = (s: string) => {
    if (s === 'fulfilled') return 'ÄÃ£ hoÃ n táº¥t';
    if (s === 'draft') return 'Äá» nghá»‹';
    if (s === 'cancelled') return 'ÄÃ£ há»§y';
    return s || '';
  };
  const conditionLabel = (c: string) => {
    if (c === 'good') return 'Tá»‘t';
    if (c === 'fair') return 'BÃ¬nh thÆ°á»ng';
    if (c === 'poor') return 'KÃ©m';
    return c || '';
  };

  let detailRowIdx = 0;

  // Write fulfilled asset rows (one row per physical asset)
  for (const r of assetRows) {
    const row = sheet3.addRow({
      code: r.procurement_code,
      purchase_date: formatDate(r.purchase_date),
      department: r.department_name || r.receiving_dept_name || '',
      title: r.title,
      supplier_name: r.supplier_name || '',
      contract_no: r.contract_no || '',
      invoice_no: r.invoice_no || '',
      asset_code: r.asset_code || '',
      item_name: r.name || '',
      category: r.category || '',
      category_code: r.category_code || '',
      unit: r.unit || '',
      purchase_price: money(r.purchase_price),
      serial_number: r.serial_number || '',
      location: r.location || '',
      asset_condition: conditionLabel(r.asset_condition || ''),
      status: statusLabel(r.status),
    });
    row.height = 18;
    applyMoneyFormat(row.getCell('purchase_price'));
    if (detailRowIdx % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FA' } };
    }
    detailRowIdx++;
  }

  // Write draft rows (from procurement_items, collapsed by qty)
  for (const r of draftItemRows) {
    const qty = Number(r.quantity || 1);
    const price = money(r.purchase_price);
    for (let i = 0; i < qty; i++) {
      const row = sheet3.addRow({
        code: r.procurement_code,
        purchase_date: formatDate(r.purchase_date),
        department: r.department_name || '',
        title: r.title,
        supplier_name: r.supplier_name || '',
        contract_no: r.contract_no || '',
        invoice_no: r.invoice_no || '',
        asset_code: '',
        item_name: r.name || '',
        category: r.category || '',
        category_code: r.category_code || '',
        unit: r.unit || '',
        purchase_price: price,
        serial_number: r.serial_number || '',
        location: r.location || '',
        asset_condition: conditionLabel(r.asset_condition || ''),
        status: statusLabel(r.status),
      });
      row.height = 18;
      applyMoneyFormat(row.getCell('purchase_price'));
      if (detailRowIdx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
      }
      detailRowIdx++;
    }
  }

  sheet3.views = [{ state: 'frozen', ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export default {
  exportProcurementsToExcel,
};
