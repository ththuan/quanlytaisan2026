import { Op } from 'sequelize';
import { Asset, Department, EquipmentNorm, NormWarning } from '../models';
import { NotFoundError } from '../utils/errorHandler';

interface AssetLike {
  id?: number;
  asset_code?: string;
  name?: string;
  category?: string | null;
  category_code?: string | null;
  purchase_price?: number | string | null;
  current_department_id?: number | null;
}

class NormService {
  private defaultsChecked = false;

  /**
   * Seed sẵn một số định mức phổ biến theo QĐ 10/2026/QĐ-TTg (mức giá tối đa)
   * khi danh mục còn trống. Admin có thể sửa/xóa tùy nhu cầu.
   */
  private async seedDefaultsIfEmpty(): Promise<void> {
    if (this.defaultsChecked) return;
    try {
      const count = await EquipmentNorm.count();
      if (count === 0) {
        const doc = '10/2026/QĐ-TTg';
        const eff = '2026-03-09';
        const defaults = [
          { equipment_name: 'Bộ bàn ghế họp, tiếp khách', scope: 'room', unit: 'bộ', max_price: 13 },
          { equipment_name: 'Máy in', scope: 'room', unit: 'chiếc', max_price: 13 },
          { equipment_name: 'Máy scan tài liệu', scope: 'room', unit: 'chiếc', max_price: 22 },
          { equipment_name: 'Máy hủy tài liệu', scope: 'room', unit: 'chiếc', max_price: 10 },
          { equipment_name: 'Máy photocopy', scope: 'room', unit: 'chiếc', max_price: 110 },
          { equipment_name: 'Giá đựng tài liệu', scope: 'room', unit: 'chiếc', max_price: 1.5 },
          { equipment_name: 'Máy vi tính để bàn', scope: 'digital', unit: 'bộ', max_price: 20 },
          { equipment_name: 'Máy vi tính xách tay', scope: 'digital', unit: 'chiếc', max_price: 25 },
          { equipment_name: 'Máy tính bảng', scope: 'digital', unit: 'chiếc', max_price: 25 },
          { equipment_name: 'Điện thoại cố định', scope: 'title', unit: 'chiếc', max_price: 2.5 },
          { equipment_name: 'Tủ đựng tài liệu', scope: 'title', unit: 'chiếc', max_price: 10 },
          { equipment_name: 'Bộ bàn ghế ngồi làm việc', scope: 'title', unit: 'bộ', max_price: 30 },
        ].map((n) => ({
          ...n,
          document_no: doc,
          effective_date: eff,
          max_quantity: null,
          note: 'Mức giá tối đa tham khảo theo QĐ 10/2026/QĐ-TTg; điều chỉnh theo nhóm chức danh thực tế.',
          is_active: true,
        }));
        await EquipmentNorm.bulkCreate(defaults as any);
      }
    } catch {
      // bỏ qua nếu có lỗi (không chặn chức năng)
    } finally {
      this.defaultsChecked = true;
    }
  }

  async listNorms(query: any = {}): Promise<EquipmentNorm[]> {
    await this.seedDefaultsIfEmpty();
    const where: any = {};
    if (query.scope) where.scope = query.scope;
    if (query.is_active !== undefined) where.is_active = String(query.is_active) === 'true';
    if (query.search) {
      where.equipment_name = { [Op.iLike]: `%${query.search}%` };
    }
    return EquipmentNorm.findAll({
      where,
      order: [['equipment_name', 'ASC'], ['id', 'ASC']],
    });
  }

  async createNorm(data: any): Promise<EquipmentNorm> {
    if (!data?.equipment_name) {
      throw new NotFoundError('Thiếu tên máy móc, thiết bị');
    }
    return EquipmentNorm.create({
      document_no: data.document_no ?? null,
      effective_date: data.effective_date ?? null,
      scope: data.scope || 'other',
      position_group: data.position_group ?? null,
      equipment_name: String(data.equipment_name).trim(),
      unit: data.unit || 'bộ',
      max_quantity: data.max_quantity ?? null,
      max_price: data.max_price ?? null,
      note: data.note ?? null,
      is_active: data.is_active !== false,
    });
  }

  async updateNorm(id: number, data: any): Promise<EquipmentNorm> {
    const norm = await EquipmentNorm.findByPk(id);
    if (!norm) throw new NotFoundError('Định mức không tồn tại');
    const allowed = [
      'document_no', 'effective_date', 'scope', 'position_group', 'equipment_name',
      'unit', 'max_quantity', 'max_price', 'note', 'is_active',
    ];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    await norm.update(updateData);
    return norm;
  }

  async deleteNorm(id: number): Promise<void> {
    const norm = await EquipmentNorm.findByPk(id);
    if (!norm) throw new NotFoundError('Định mức không tồn tại');
    await norm.destroy();
  }

  /**
   * Đánh giá một tài sản so với định mức. CHỈ tạo cảnh báo, KHÔNG chặn thao tác.
   * Trả về danh sách cảnh báo vừa tạo.
   */
  async evaluateAsset(asset: AssetLike, userId?: number): Promise<NormWarning[]> {
    await this.seedDefaultsIfEmpty();
    const a: any = (asset as any).toJSON ? (asset as any).toJSON() : asset;
    if (!a?.id) return [];

    const haystack = `${a.name || ''} ${a.category || ''} ${a.category_code || ''}`.toLowerCase();
    if (!haystack.trim()) return [];

    const norms = await EquipmentNorm.findAll({ where: { is_active: true } });
    // Chọn định mức khớp cụ thể nhất (tên dài nhất nằm trong tên/loại tài sản)
    const matched = norms
      .filter((n) => haystack.includes(String(n.equipment_name).toLowerCase()))
      .sort((x, y) => String(y.equipment_name).length - String(x.equipment_name).length)[0];

    if (!matched) return [];

    const created: NormWarning[] = [];

    // 1) Cảnh báo giá vượt mức
    if (matched.max_price != null && a.purchase_price != null) {
      const price = Number(a.purchase_price);
      const maxPriceVnd = Number(matched.max_price) * 1_000_000;
      if (Number.isFinite(price) && price > maxPriceVnd) {
        const exists = await NormWarning.findOne({
          where: { asset_id: a.id, norm_id: matched.id, warning_type: 'price', acknowledged: false },
          attributes: ['id'],
        });
        if (!exists) {
          const priceMillion = (price / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
          created.push(
            await NormWarning.create({
              asset_id: a.id,
              department_id: a.current_department_id ?? null,
              norm_id: matched.id,
              warning_type: 'price',
              message: `Tài sản "${a.name}" có giá ${priceMillion} triệu đồng, vượt mức tối đa ${matched.max_price} triệu đồng theo định mức "${matched.equipment_name}".`,
              asset_code: a.asset_code ?? null,
              asset_name: a.name ?? null,
              purchase_price: price,
              created_by: userId ?? null,
            } as any)
          );
        }
      }
    }

    // 2) Cảnh báo số lượng vượt mức trong đơn vị
    if (matched.max_quantity != null && a.current_department_id) {
      const count = await Asset.count({
        where: {
          current_department_id: a.current_department_id,
          [Op.or]: [
            { name: { [Op.iLike]: `%${matched.equipment_name}%` } },
            { category: { [Op.iLike]: `%${matched.equipment_name}%` } },
          ],
        },
      });
      if (count > Number(matched.max_quantity)) {
        const exists = await NormWarning.findOne({
          where: { asset_id: a.id, norm_id: matched.id, warning_type: 'quantity', acknowledged: false },
          attributes: ['id'],
        });
        if (!exists) {
          created.push(
            await NormWarning.create({
              asset_id: a.id,
              department_id: a.current_department_id,
              norm_id: matched.id,
              warning_type: 'quantity',
              message: `Đơn vị đang có ${count} "${matched.equipment_name}", vượt số lượng tối đa ${matched.max_quantity} theo định mức.`,
              asset_code: a.asset_code ?? null,
              asset_name: a.name ?? null,
              purchase_price: a.purchase_price != null ? Number(a.purchase_price) : null,
              created_by: userId ?? null,
            } as any)
          );
        }
      }
    }

    return created;
  }

  async listWarnings(query: any = {}): Promise<any> {
    const where: any = {};
    if (query.department_id) where.department_id = Number(query.department_id);
    if (query.acknowledged !== undefined) where.acknowledged = String(query.acknowledged) === 'true';

    return NormWarning.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(Number(query.limit) || 200, 500),
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
        { model: EquipmentNorm, as: 'norm', attributes: ['id', 'equipment_name', 'max_quantity', 'max_price', 'unit'], required: false },
      ],
    });
  }

  async acknowledgeWarning(id: number, userId?: number): Promise<NormWarning> {
    const w = await NormWarning.findByPk(id);
    if (!w) throw new NotFoundError('Cảnh báo không tồn tại');
    await w.update({ acknowledged: true, acknowledged_by: userId ?? null, acknowledged_at: new Date() });
    return w;
  }
}

export default new NormService();
