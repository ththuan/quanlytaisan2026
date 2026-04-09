import Joi from 'joi';

export const createStockItemSchema = Joi.object({
  name: Joi.string().max(255).required(),
  unit: Joi.string().max(50).allow('', null).optional(),
  category: Joi.string().max(100).allow('', null).optional(),
  min_stock: Joi.number().integer().min(0).allow(null).optional(),
});

export const createStockReceiptSchema = Joi.object({
  receipt_date: Joi.date().required(),
  supplier_name: Joi.string().max(255).allow('', null).optional(),
  shopee_waybill: Joi.string().max(100).allow('', null).optional(),
  invoice_no: Joi.string().max(100).allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  lines: Joi.array().items(
    Joi.object({
      item_id: Joi.number().integer().positive().allow(null).optional(),
      item_name: Joi.string().max(255).allow('', null).optional(),
      unit: Joi.string().max(50).allow('', null).optional(),
      category: Joi.string().max(100).allow('', null).optional(),
      min_stock: Joi.number().integer().min(0).allow(null).optional(),
      quantity: Joi.number().integer().min(1).required(),
      unit_price: Joi.number().min(0).precision(2).required(),
    }).or('item_id', 'item_name')
  ).min(1).required(),
});

export const createStockIssueSchema = Joi.object({
  issue_date: Joi.date().required(),
  location: Joi.string().max(255).required(),
  purpose: Joi.string().max(500).required(),
  notes: Joi.string().allow('', null).optional(),
  department_id: Joi.number().integer().positive().allow(null).optional(),
  lines: Joi.array().items(
    Joi.object({
      item_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).required(),
    })
  ).min(1).required(),
});
