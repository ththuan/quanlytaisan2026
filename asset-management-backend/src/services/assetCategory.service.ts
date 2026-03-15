import AssetCategory, { CategoryGroup } from '../models/AssetCategory';
import Asset from '../models/Asset';
import { Op } from 'sequelize';

export interface CategoryTreeNode {
  id: number;
  code: string;
  name: string;
  unit: string;
  category_group: CategoryGroup;
  is_depreciable: boolean;
  depreciation_rate?: number;
  useful_life_years?: number;
  children?: CategoryTreeNode[];
}

class AssetCategoryService {
  /**
   * Lấy tất cả danh mục loại tài sản
   */
  async getAllCategories(includeInactive = false): Promise<AssetCategory[]> {
    const where: any = {};
    if (!includeInactive) {
      where.is_active = true;
    }

    return AssetCategory.findAll({
      where,
      order: [['sort_order', 'ASC'], ['code', 'ASC']],
    });
  }

  /**
   * Lấy danh mục theo mã code
   */
  async getCategoryByCode(code: string): Promise<AssetCategory | null> {
    return AssetCategory.findOne({
      where: { code, is_active: true },
    });
  }

  /**
   * Lấy danh mục theo ID
   */
  async getCategoryById(id: number): Promise<AssetCategory | null> {
    return AssetCategory.findByPk(id);
  }

  /**
   * Lấy danh mục theo nhóm
   */
  async getCategoriesByGroup(group: CategoryGroup): Promise<AssetCategory[]> {
    return AssetCategory.findAll({
      where: { category_group: group, is_active: true },
      order: [['sort_order', 'ASC'], ['code', 'ASC']],
    });
  }

  /**
   * Lấy các danh mục con của một danh mục cha
   */
  async getChildCategories(parentCode: string): Promise<AssetCategory[]> {
    return AssetCategory.findAll({
      where: { parent_code: parentCode, is_active: true },
      order: [['sort_order', 'ASC'], ['code', 'ASC']],
    });
  }

  /**
   * Lấy các danh mục cấp 1 (không có cha)
   */
  async getTopLevelCategories(): Promise<AssetCategory[]> {
    return AssetCategory.findAll({
      where: { 
        parent_code: null, 
        is_active: true 
      },
      order: [['sort_order', 'ASC'], ['code', 'ASC']],
    });
  }

  /**
   * Lấy danh mục dạng cây (tree structure)
   */
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.getAllCategories();
    
    const categoryMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // Tạo map từ tất cả categories
    for (const cat of allCategories) {
      categoryMap.set(cat.code, {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        unit: cat.unit,
        category_group: cat.category_group,
        is_depreciable: cat.is_depreciable,
        depreciation_rate: cat.depreciation_rate ?? undefined,
        useful_life_years: cat.useful_life_years ?? undefined,
        children: [],
      });
    }

    // Xây dựng cây
    for (const cat of allCategories) {
      const node = categoryMap.get(cat.code)!;
      if (cat.parent_code) {
        const parentNode = categoryMap.get(cat.parent_code);
        if (parentNode) {
          parentNode.children!.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  }

  /**
   * Lấy các danh mục có thể chọn (leaf nodes - không có con)
   */
  async getSelectableCategories(): Promise<AssetCategory[]> {
    const allCategories = await this.getAllCategories();
    const parentCodes = new Set(allCategories.map(c => c.parent_code).filter(Boolean));
    
    return allCategories.filter(c => !parentCodes.has(c.code));
  }

  /**
   * Tìm kiếm danh mục theo tên hoặc mã
   */
  async searchCategories(keyword: string): Promise<AssetCategory[]> {
    return AssetCategory.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { code: { [Op.iLike]: `%${keyword}%` } },
          { name: { [Op.iLike]: `%${keyword}%` } },
        ],
      },
      order: [['sort_order', 'ASC'], ['code', 'ASC']],
    });
  }

  /**
   * Tạo danh mục mới
   */
  async createCategory(data: Partial<AssetCategory>): Promise<AssetCategory> {
    return AssetCategory.create(data as any);
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(id: number, data: Partial<AssetCategory>): Promise<AssetCategory | null> {
    const category = await AssetCategory.findByPk(id);
    if (!category) return null;
    
    await category.update(data);
    return category;
  }

  /**
   * Xóa danh mục (soft delete - set is_active = false)
   */
  async deleteCategory(id: number): Promise<boolean> {
    const category = await AssetCategory.findByPk(id);
    if (!category) return false;
    
    await category.update({ is_active: false });
    return true;
  }

  /**
   * Tự động sinh mã tài sản dựa trên loại tài sản và số thứ tự
   * Format: [Mã loại tài sản]-[Năm]-[Số thứ tự 4 chữ số]
   * VD: 0202-2026-0001
   * 
   * Tự động tìm số thứ tự tiếp theo chưa được sử dụng để tránh trùng lặp
   */
  async generateAssetCode(categoryCode: string, existingCount?: number): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${categoryCode}-${year}-`;
    
    // Nếu có truyền existingCount, sử dụng nó (để tương thích với code cũ)
    if (existingCount !== undefined) {
      const sequenceNumber = (existingCount + 1).toString().padStart(4, '0');
      return `${prefix}${sequenceNumber}`;
    }
    
    // Tự động tìm số thứ tự tiếp theo chưa được sử dụng
    // Tìm tất cả mã tài sản có cùng prefix
    const existingAssets = await Asset.findAll({
      where: {
        asset_code: {
          [Op.like]: `${prefix}%`,
        },
      },
      attributes: ['asset_code'],
      order: [['asset_code', 'DESC']],
      limit: 100, // Giới hạn để tối ưu performance
    });
    
    // Tìm số thứ tự lớn nhất
    let maxSequence = 0;
    for (const asset of existingAssets) {
      const match = asset.asset_code.match(new RegExp(`${prefix}(\\d{4})$`));
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
    
    // Tăng thêm 1 để tạo mã mới
    const nextSequence = maxSequence + 1;
    const sequenceNumber = nextSequence.toString().padStart(4, '0');
    
    return `${prefix}${sequenceNumber}`;
  }

  /**
   * Lấy thông tin để tự động điền khi chọn loại tài sản
   */
  async getAutoFillData(categoryId: number): Promise<{
    category_code: string;
    unit: string;
    is_depreciable: boolean;
    depreciation_rate?: number;
    useful_life_years?: number;
    category_name: string;
  } | null> {
    const category = await this.getCategoryById(categoryId);
    if (!category) return null;

    return {
      category_code: category.code,
      unit: category.unit,
      is_depreciable: category.is_depreciable,
      depreciation_rate: category.depreciation_rate ?? undefined,
      useful_life_years: category.useful_life_years ?? undefined,
      category_name: category.name,
    };
  }
}

export default new AssetCategoryService();
