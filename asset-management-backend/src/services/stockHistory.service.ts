import { Op } from 'sequelize';
import { StockReceipt, StockReceiptLine, StockIssue, StockIssueLine, StockItem, User, Department } from '../models';

export interface StockHistoryQuery {
  from_date?: string;
  to_date?: string;
  type?: 'in' | 'out' | 'all';
  search?: string;
}

const parseDateOnly = (v: any): Date | null => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const toRange = (from?: string, to?: string) => {
  const f = parseDateOnly(from);
  const t = parseDateOnly(to);
  if (!f && !t) return null;
  const start = f ? new Date(f.getFullYear(), f.getMonth(), f.getDate()) : new Date(1990, 0, 1);
  const end = t ? new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59) : new Date(2100, 11, 31, 23, 59, 59);
  return { [Op.between]: [start, end] };
};

class StockHistoryService {
  async getHistory(query: StockHistoryQuery): Promise<any[]> {
    const type = (query.type || 'all') as any;
    const search = (query.search || '').trim();
    const dateRange = toRange(query.from_date, query.to_date);

    const wantIn = type === 'all' || type === 'in';
    const wantOut = type === 'all' || type === 'out';

    // Receipt history
    const inRows: any[] = wantIn
      ? await StockReceipt.findAll({
          where: {
            ...(dateRange ? { receipt_date: dateRange } : {}),
            ...(search
              ? {
                  [Op.or]: [
                    { code: { [Op.iLike]: `%${search}%` } },
                    { shopee_waybill: { [Op.iLike]: `%${search}%` } },
                    { supplier_name: { [Op.iLike]: `%${search}%` } },
                    { invoice_no: { [Op.iLike]: `%${search}%` } },
                  ],
                }
              : {}),
          },
          include: [
            {
              model: StockReceiptLine,
              as: 'lines',
              include: [{ model: StockItem, as: 'item', attributes: ['id', 'code', 'name', 'unit'] }],
            },
            { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
          ] as any,
          order: [['receipt_date', 'DESC'], ['id', 'DESC']],
        })
      : [];

    const mappedIn = inRows.flatMap((r: any) => {
      const lines = Array.isArray(r.lines) ? r.lines : [];
      return lines.map((ln: any) => ({
        id: `in-${r.id}-${ln.id}`,
        type: 'in',
        date: r.receipt_date,
        code: r.code,
        item: ln.item,
        quantity: Number(ln.quantity || 0),
        unit_price: ln.unit_price != null ? Number(ln.unit_price) : null,
        amount: ln.unit_price != null ? Number(ln.unit_price) * Number(ln.quantity || 0) : null,
        shopee_waybill: r.shopee_waybill,
        supplier_name: r.supplier_name,
        invoice_no: r.invoice_no,
        notes: r.notes,
        location: null,
        purpose: null,
        created_by: r.created_by,
        created_by_name: r.creator?.fullname || r.creator?.username || null,
      }));
    });

    // Issue history
    const outRows: any[] = wantOut
      ? await StockIssue.findAll({
          where: {
            ...(dateRange ? { issue_date: dateRange } : {}),
            ...(search
              ? {
                  [Op.or]: [
                    { code: { [Op.iLike]: `%${search}%` } },
                    { location: { [Op.iLike]: `%${search}%` } },
                    { purpose: { [Op.iLike]: `%${search}%` } },
                  ],
                }
              : {}),
          },
          include: [
            {
              model: StockIssueLine,
              as: 'lines',
              include: [{ model: StockItem, as: 'item', attributes: ['id', 'code', 'name', 'unit'] }],
            },
            { model: User, as: 'creator', attributes: ['id', 'username', 'fullname'], required: false },
            { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
          ] as any,
          order: [['issue_date', 'DESC'], ['id', 'DESC']],
        })
      : [];

    const mappedOut = outRows.flatMap((r: any) => {
      const lines = Array.isArray(r.lines) ? r.lines : [];
      return lines.map((ln: any) => ({
        id: `out-${r.id}-${ln.id}`,
        type: 'out',
        date: r.issue_date,
        code: r.code,
        item: ln.item,
        quantity: Number(ln.quantity || 0),
        unit_price: null,
        amount: null,
        shopee_waybill: null,
        supplier_name: null,
        invoice_no: null,
        notes: r.notes,
        location: r.location,
        purpose: r.purpose,
        department_id: r.department_id || null,
        department_name: r.department?.name || null,
        created_by: r.created_by,
        created_by_name: r.creator?.fullname || r.creator?.username || null,
      }));
    });

    const combined = [...mappedIn, ...mappedOut];

    // Search by item code/name as well
    const filtered = search
      ? combined.filter((x: any) => {
          const itemCode = x.item?.code || '';
          const itemName = x.item?.name || '';
          return itemCode.toLowerCase().includes(search.toLowerCase()) || itemName.toLowerCase().includes(search.toLowerCase());
        })
      : combined;

    filtered.sort((a: any, b: any) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    });

    return filtered;
  }
}

export default new StockHistoryService();
