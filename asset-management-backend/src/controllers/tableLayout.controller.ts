import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import tableLayoutService from '../services/tableLayout.service';

const TABLE_KEY_PATTERN = /^[a-z0-9-]{1,100}$/;

const normalizeTableKey = (value: string): string => {
  const tableKey = String(value || '').trim().toLowerCase();
  if (!TABLE_KEY_PATTERN.test(tableKey)) {
    throw Object.assign(new Error('Mã bảng không hợp lệ'), { statusCode: 400 });
  }
  return tableKey;
};

const normalizeColumns = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Object.assign(new Error('Bố cục cột không hợp lệ'), { statusCode: 400 });
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length || entries.length > 100) {
    throw Object.assign(new Error('Bố cục cột không hợp lệ'), { statusCode: 400 });
  }

  const columns: Record<string, number> = {};
  for (const [key, rawValue] of entries) {
    const ratio = Number(rawValue);
    if (!key || key.length > 150 || !Number.isFinite(ratio) || ratio <= 0 || ratio > 1) {
      throw Object.assign(new Error('Tỷ lệ cột không hợp lệ'), { statusCode: 400 });
    }
    columns[key] = ratio;
  }
  return columns;
};

export const getTableLayout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tableKey = normalizeTableKey(req.params.tableKey);
    const layout = await tableLayoutService.getLayout(tableKey);

    res.json({
      success: true,
      data: layout
        ? {
            table_key: layout.table_key,
            columns: layout.columns,
            layout_version: layout.layout_version,
            updated_at: layout.updated_at,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

export const saveTableLayout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tableKey = normalizeTableKey(req.params.tableKey);
    const columns = normalizeColumns(req.body?.columns);
    const layoutVersion = Number(req.body?.layout_version);

    if (!Number.isInteger(layoutVersion) || layoutVersion <= 0) {
      throw Object.assign(new Error('Phiên bản bố cục không hợp lệ'), { statusCode: 400 });
    }

    const layout = await tableLayoutService.saveLayout(tableKey, {
      columns,
      layout_version: layoutVersion,
      updated_by: req.user?.id ?? null,
    });

    res.json({
      success: true,
      data: {
        table_key: layout.table_key,
        columns: layout.columns,
        layout_version: layout.layout_version,
        updated_at: layout.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
