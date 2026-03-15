import api from './api';

export interface StockItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  category?: string | null;
  min_stock?: number | null;
  on_hand?: number;
  is_low?: boolean;
}

export interface CreateStockItemInput {
  name: string;
  unit?: string | null;
  category?: string | null;
  min_stock?: number | null;
}

export interface CreateReceiptLine {
  item_id?: number | null;
  item_name?: string | null;
  unit?: string | null;
  category?: string | null;
  min_stock?: number | null;
  quantity: number;
  unit_price: number;
}

export interface CreateReceiptInput {
  receipt_date: string;
  supplier_name?: string | null;
  shopee_waybill?: string | null;
  invoice_no?: string | null;
  notes?: string | null;
  lines: CreateReceiptLine[];
}

export interface CreateIssueLine {
  item_id: number;
  quantity: number;
}

export interface CreateIssueInput {
  issue_date: string;
  location: string;
  purpose: string;
  notes?: string | null;
  lines: CreateIssueLine[];
}

class StockService {
  async listItems(params?: { search?: string }) {
    return api.get('/stock/items', { params });
  }

  async createItem(data: CreateStockItemInput) {
    return api.post('/stock/items', data);
  }

  async createReceipt(data: CreateReceiptInput) {
    return api.post('/stock/receipts', data);
  }

  async createIssue(data: CreateIssueInput) {
    return api.post('/stock/issues', data);
  }
}

export default new StockService();
