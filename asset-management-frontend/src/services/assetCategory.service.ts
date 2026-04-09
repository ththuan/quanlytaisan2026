import api from './api';

export interface AssetCategory {
  id: number;
  code: string;
  name: string;
  parent_code?: string;
  unit: string;
  category_group: string;
  tracking_type: 'individual' | 'batch';
  is_depreciable: boolean;
  depreciation_rate?: number;
  useful_life_years?: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface CategoryTreeNode extends AssetCategory {
  children?: CategoryTreeNode[];
}

export interface AutoFillData {
  category_code: string;
  unit: string;
  is_depreciable: boolean;
  depreciation_rate?: number;
  useful_life_years?: number;
  category_name: string;
}

export const assetCategoryService = {
  /**
   * Lấy tất cả danh mục
   * API trả về: { success: true, data: [...], total: X }
   * Sau response interceptor: { success: true, data: [...], total: X }
   */
  async getAll(includeInactive = false): Promise<{ data: AssetCategory[]; total: number }> {
    const response: any = await api.get('/asset-categories', { 
      params: { includeInactive } 
    });
    // response đã là object {success, data, total} sau interceptor
    return { data: response.data || [], total: response.total || 0 };
  },

  /**
   * Lấy danh mục dạng cây
   */
  async getTree(): Promise<{ data: CategoryTreeNode[] }> {
    const response: any = await api.get('/asset-categories/tree');
    return { data: response.data || [] };
  },

  /**
   * Lấy các danh mục có thể chọn (leaf nodes)
   */
  async getSelectable(): Promise<{ data: AssetCategory[]; total: number }> {
    const response: any = await api.get('/asset-categories/selectable');
    return { data: response.data || [], total: response.total || 0 };
  },

  /**
   * Lấy danh mục cấp 1
   */
  async getTopLevel(): Promise<{ data: AssetCategory[] }> {
    const response: any = await api.get('/asset-categories/top-level');
    return { data: response.data || [] };
  },

  /**
   * Lấy danh mục theo nhóm
   */
  async getByGroup(group: string): Promise<{ data: AssetCategory[]; total: number }> {
    const response: any = await api.get(`/asset-categories/group/${group}`);
    return { data: response.data || [], total: response.total || 0 };
  },

  /**
   * Lấy danh mục con
   */
  async getChildren(parentCode: string): Promise<{ data: AssetCategory[]; total: number }> {
    const response: any = await api.get(`/asset-categories/children/${parentCode}`);
    return { data: response.data || [], total: response.total || 0 };
  },

  /**
   * Tìm kiếm danh mục
   */
  async search(keyword: string): Promise<{ data: AssetCategory[]; total: number }> {
    const response: any = await api.get('/asset-categories/search', { 
      params: { keyword } 
    });
    return { data: response.data || [], total: response.total || 0 };
  },

  /**
   * Lấy chi tiết một danh mục
   */
  async getById(id: number): Promise<{ data: AssetCategory }> {
    const response: any = await api.get(`/asset-categories/${id}`);
    return { data: response.data };
  },

  /**
   * Lấy danh mục theo mã
   */
  async getByCode(code: string): Promise<{ data: AssetCategory }> {
    const response: any = await api.get(`/asset-categories/code/${code}`);
    return { data: response.data };
  },

  /**
   * Lấy dữ liệu tự động điền khi chọn loại tài sản
   */
  async getAutoFill(categoryId: number): Promise<{ data: AutoFillData }> {
    const response: any = await api.get(`/asset-categories/${categoryId}/autofill`);
    return { data: response.data };
  },

  /**
   * Tự động sinh mã tài sản
   * Backend sẽ tự động tìm số thứ tự tiếp theo chưa được sử dụng
   */
  async generateCode(categoryCode: string, existingCount?: number): Promise<{ data: { assetCode: string } }> {
    const body: any = { categoryCode };
    // Chỉ gửi existingCount nếu được chỉ định (để tương thích ngược)
    if (existingCount !== undefined) {
      body.existingCount = existingCount;
    }
    const response: any = await api.post('/asset-categories/generate-code', body);
    return { data: response.data };
  },

  /**
   * Tạo danh mục mới (admin only)
   */
  async create(data: Partial<AssetCategory>): Promise<{ data: AssetCategory }> {
    const response: any = await api.post('/asset-categories', data);
    return { data: response.data };
  },

  /**
   * Cập nhật danh mục (admin only)
   */
  async update(id: number, data: Partial<AssetCategory>): Promise<{ data: AssetCategory }> {
    const response: any = await api.put(`/asset-categories/${id}`, data);
    return { data: response.data };
  },

  /**
   * Xóa danh mục (admin only)
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/asset-categories/${id}`);
  },
};

export default assetCategoryService;
