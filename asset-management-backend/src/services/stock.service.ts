import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import { StockItem, StockReceipt, StockReceiptLine, StockIssue, StockIssueLine } from '../models';
import { ConflictError, NotFoundError } from '../utils/errorHandler';

export interface CreateStockItemInput {
  name: string;
  unit?: string;
  category?: string;
  min_stock?: number;
}

export interface CreateReceiptInput {
  receipt_date: string;
  supplier_name?: string;
  shopee_waybill?: string;
  invoice_no?: string;
  notes?: string;
  lines: Array<{ item_id?: number; item_name?: string; unit?: string; category?: string; min_stock?: number; quantity: number; unit_price: number }>;
}

export interface CreateIssueInput {
  issue_date: string;
  location: string;
  purpose: string;
  notes?: string;
  department_id?: number;
  lines: Array<{ item_id: number; quantity: number }>;
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');

class StockService {
  private async generateItemCode(transaction?: Transaction): Promise<string> {
    const last: any = await StockItem.findOne({ order: [['id', 'DESC']], transaction });
    const nextId = (last?.id || 0) + 1;
    return `VT-${pad(nextId, 6)}`;
  }

  private async generateReceiptCode(transaction?: Transaction): Promise<string> {
    const year = new Date().getFullYear();
    const last: any = await StockReceipt.findOne({ order: [['id', 'DESC']], transaction });
    const nextId = (last?.id || 0) + 1;
    return `NK-${year}-${pad(nextId, 6)}`;
  }

  private async generateIssueCode(transaction?: Transaction): Promise<string> {
    const year = new Date().getFullYear();
    const last: any = await StockIssue.findOne({ order: [['id', 'DESC']], transaction });
    const nextId = (last?.id || 0) + 1;
    return `XK-${year}-${pad(nextId, 6)}`;
  }

  async createItem(data: CreateStockItemInput): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const code = await this.generateItemCode(transaction);
      const item = await StockItem.create(
        {
          code,
          name: data.name,
          unit: data.unit || 'Cái',
          category: data.category || null,
          min_stock: data.min_stock ?? 0,
          is_active: true,
        } as any,
        { transaction }
      );
      await transaction.commit();
      return item;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async listItemsWithStock(query: any): Promise<any[]> {
    const search = (query?.search || '').trim();

    const whereItem: any = { is_active: true };
    if (search) {
      whereItem[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const items: any[] = await StockItem.findAll({ where: whereItem, order: [['id', 'ASC']] });
    if (!items.length) return [];

    const itemIds = items.map((i) => i.id);

    const receipts = await StockReceiptLine.findAll({
      attributes: ['item_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'qty_in']],
      where: { item_id: { [Op.in]: itemIds } },
      group: ['item_id'],
      raw: true,
    });

    const issues = await StockIssueLine.findAll({
      attributes: ['item_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'qty_out']],
      where: { item_id: { [Op.in]: itemIds } },
      group: ['item_id'],
      raw: true,
    });

    const inMap = new Map<number, number>();
    for (const r of receipts as any[]) inMap.set(Number(r.item_id), Number(r.qty_in || 0));

    const outMap = new Map<number, number>();
    for (const r of issues as any[]) outMap.set(Number(r.item_id), Number(r.qty_out || 0));

    return items.map((it) => {
      const qty_in = inMap.get(it.id) || 0;
      const qty_out = outMap.get(it.id) || 0;
      const on_hand = qty_in - qty_out;
      return {
        ...it.toJSON(),
        qty_in,
        qty_out,
        on_hand,
        is_low: (it.min_stock ?? 0) > 0 ? on_hand <= Number(it.min_stock) : false,
      };
    });
  }

  async createReceipt(payload: CreateReceiptInput, userId?: number): Promise<any> {
    if (!payload?.lines?.length) throw new ConflictError('Phải có ít nhất 1 dòng nhập kho');

    const transaction = await sequelize.transaction();
    try {
      const code = await this.generateReceiptCode(transaction);
      const receipt = await StockReceipt.create(
        {
          code,
          receipt_date: payload.receipt_date,
          supplier_name: payload.supplier_name || null,
          shopee_waybill: payload.shopee_waybill || null,
          invoice_no: payload.invoice_no || null,
          notes: payload.notes || null,
          created_by: userId || null,
        } as any,
        { transaction }
      );

      for (const line of payload.lines) {
        const qty = Math.max(0, Number(line.quantity || 0));
        const price = Number(line.unit_price || 0);
        if (!qty || qty <= 0) throw new ConflictError('Số lượng nhập phải > 0');
        if (price === null || price === undefined || Number.isNaN(price) || price < 0) throw new ConflictError('Đơn giá không hợp lệ');

        let itemId = line.item_id ? Number(line.item_id) : null;
        if (!itemId) {
          if (!line.item_name || !String(line.item_name).trim()) throw new ConflictError('Thiếu tên vật tư');
          const item = await this.createItem(
            { name: String(line.item_name).trim(), unit: line.unit || 'Cái', category: line.category, min_stock: line.min_stock },
          );
          itemId = item.id;
        }

        await StockReceiptLine.create(
          {
            receipt_id: receipt.id,
            item_id: itemId,
            quantity: qty,
            unit_price: price,
          } as any,
          { transaction }
        );
      }

      await transaction.commit();
      return await StockReceipt.findByPk(receipt.id, {
        include: [{ model: StockReceiptLine, as: 'lines', include: [{ model: StockItem, as: 'item' }] }],
      });
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private async getOnHand(itemId: number, transaction?: Transaction): Promise<number> {
    const inRows: any = await StockReceiptLine.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('quantity')), 'qty_in']],
      where: { item_id: itemId },
      raw: true,
      transaction,
    });
    const outRows: any = await StockIssueLine.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('quantity')), 'qty_out']],
      where: { item_id: itemId },
      raw: true,
      transaction,
    });

    const qtyIn = Number(inRows?.[0]?.qty_in || 0);
    const qtyOut = Number(outRows?.[0]?.qty_out || 0);
    return qtyIn - qtyOut;
  }

  async createIssue(payload: CreateIssueInput, userId?: number): Promise<any> {
    if (!payload?.lines?.length) throw new ConflictError('Phải có ít nhất 1 dòng xuất kho');
    if (!payload.location?.trim()) throw new ConflictError('Vị trí (ở đâu) là bắt buộc');
    if (!payload.purpose?.trim()) throw new ConflictError('Mục đích (vào việc gì) là bắt buộc');

    const transaction = await sequelize.transaction();
    try {
      const code = await this.generateIssueCode(transaction);
      const issue = await StockIssue.create(
        {
          code,
          issue_date: payload.issue_date,
          location: payload.location,
          purpose: payload.purpose,
          notes: payload.notes || null,
          created_by: userId || null,
          department_id: payload.department_id || null,
        } as any,
        { transaction }
      );

      for (const line of payload.lines) {
        const itemId = Number(line.item_id);
        const qty = Math.max(0, Number(line.quantity || 0));
        if (!itemId) throw new ConflictError('Thiếu vật tư');
        if (!qty || qty <= 0) throw new ConflictError('Số lượng xuất phải > 0');

        const item = await StockItem.findByPk(itemId, { transaction });
        if (!item) throw new NotFoundError('Vật tư không tồn tại');

        const onHand = await this.getOnHand(itemId, transaction);
        if (qty > onHand) {
          throw new ConflictError(`Không đủ tồn kho cho vật tư ${item.code} - ${item.name}. Tồn hiện tại: ${onHand}`);
        }

        await StockIssueLine.create(
          {
            issue_id: issue.id,
            item_id: itemId,
            quantity: qty,
          } as any,
          { transaction }
        );
      }

      await transaction.commit();
      return await StockIssue.findByPk(issue.id, {
        include: [{ model: StockIssueLine, as: 'lines', include: [{ model: StockItem, as: 'item' }] }],
      });
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}

export default new StockService();
