import { Op } from 'sequelize';
import { Asset, ConstructionWork, Department, User } from '../models';
import { NotFoundError, ForbiddenError } from '../utils/errorHandler';
import {
  buildPaginationResult,
  getOffset,
  getPaginationParams,
} from '../utils/pagination';

export type ConstructionScope = 'own' | 'department' | 'all';

interface ActorContext {
  userId?: number;
  departmentId?: number | null;
  scope: ConstructionScope;
}

const parseMoney = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayload = (data: any) => ({
  name: String(data.name || '').trim(),
  asset_id: data.asset_id ? Number(data.asset_id) : null,
  department_id: data.department_id ? Number(data.department_id) : null,
  location: data.location?.toString().trim() || null,
  description: data.description?.toString().trim() || null,
  contractor: data.contractor?.toString().trim() || null,
  start_date: data.start_date || null,
  end_date: data.end_date || null,
  estimated_cost: parseMoney(data.estimated_cost),
  actual_cost: parseMoney(data.actual_cost),
  status: data.status || 'planned',
  notes: data.notes?.toString().trim() || null,
});

class ConstructionWorkService {
  private include = [
    {
      model: Asset,
      as: 'asset',
      attributes: ['id', 'asset_code', 'name', 'category_code', 'category', 'location'],
      required: false,
    },
    {
      model: Department,
      as: 'department',
      attributes: ['id', 'name'],
      required: false,
    },
    {
      model: User,
      as: 'creator',
      attributes: ['id', 'fullname', 'username'],
      required: false,
    },
  ];

  private scopedWhere(context: ActorContext, extra: any = {}) {
    const where: any = { ...extra };
    if (context.scope === 'department') {
      where.department_id = context.departmentId ?? -1;
    } else if (context.scope === 'own') {
      where.created_by = context.userId ?? -1;
    }
    return where;
  }

  private assertCanAccess(work: any, context: ActorContext) {
    if (context.scope === 'all') return;
    if (context.scope === 'department') {
      if (Number(work.department_id) !== Number(context.departmentId)) {
        throw new ForbiddenError('Chỉ được xem công trình thuộc đơn vị của mình');
      }
      return;
    }
    if (Number(work.created_by) !== Number(context.userId)) {
      throw new ForbiddenError('Chỉ được xem công trình do mình tạo');
    }
  }

  private async nextCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `XD-${year}-`;
    const count = await ConstructionWork.count({
      where: { code: { [Op.like]: `${prefix}%` } },
    });
    let sequence = count + 1;
    let code = `${prefix}${String(sequence).padStart(3, '0')}`;

    while (await ConstructionWork.findOne({ where: { code } })) {
      sequence += 1;
      code = `${prefix}${String(sequence).padStart(3, '0')}`;
    }
    return code;
  }

  async list(query: any, context: ActorContext) {
    const { page, limit } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const extra: any = {};
    if (query.search) {
      extra[Op.or] = [
        { name: { [Op.iLike]: `%${query.search}%` } },
        { code: { [Op.iLike]: `%${query.search}%` } },
        { location: { [Op.iLike]: `%${query.search}%` } },
        { description: { [Op.iLike]: `%${query.search}%` } },
      ];
    }
    if (query.status) extra.status = query.status;
    if (query.department_id) extra.department_id = Number(query.department_id);

    const where = this.scopedWhere(context, extra);
    const { count, rows } = await ConstructionWork.findAndCountAll({
      where,
      include: this.include,
      order: [['start_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getById(id: number, context: ActorContext) {
    const work = await ConstructionWork.findByPk(id, { include: this.include });
    if (!work) throw new NotFoundError('Không tìm thấy công trình');
    this.assertCanAccess(work, context);
    return work;
  }

  async create(data: any, context: ActorContext) {
    const payload = normalizePayload(data);
    if (!payload.name) {
      throw Object.assign(new Error('Tên hạng mục/công trình là bắt buộc'), { statusCode: 400 });
    }

    if (context.scope !== 'all') {
      payload.department_id = context.departmentId ?? null;
    }

    return ConstructionWork.create({
      ...payload,
      code: await this.nextCode(),
      created_by: context.userId ?? null,
      updated_by: context.userId ?? null,
    } as any).then((work) => this.getById(work.id, context));
  }

  async update(id: number, data: any, context: ActorContext) {
    const existing = await ConstructionWork.findByPk(id);
    if (!existing) throw new NotFoundError('Không tìm thấy công trình');
    this.assertCanAccess(existing, context);

    const payload = normalizePayload({ ...existing.toJSON(), ...data });
    if (!payload.name) {
      throw Object.assign(new Error('Tên hạng mục/công trình là bắt buộc'), { statusCode: 400 });
    }
    if (context.scope !== 'all') {
      payload.department_id = context.departmentId ?? existing.department_id;
    }

    await existing.update({
      ...payload,
      updated_by: context.userId ?? null,
    });
    return this.getById(id, context);
  }

  async remove(id: number, context: ActorContext) {
    const work = await ConstructionWork.findByPk(id);
    if (!work) throw new NotFoundError('Không tìm thấy công trình');
    this.assertCanAccess(work, context);
    await work.destroy();
  }
}

export default new ConstructionWorkService();
