import { Request, Response, NextFunction } from 'express';
import assetCategoryService from '../services/assetCategory.service';
import { CategoryGroup } from '../models/AssetCategory';

class AssetCategoryController {
  /**
   * GET /api/asset-categories
   * Lấy tất cả danh mục loại tài sản
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await assetCategoryService.getAllCategories(includeInactive);
      
      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/tree
   * Lấy danh mục dạng cây
   */
  async getTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await assetCategoryService.getCategoryTree();
      
      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/selectable
   * Lấy các danh mục có thể chọn (leaf nodes)
   */
  async getSelectable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await assetCategoryService.getSelectableCategories();
      
      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/top-level
   * Lấy các danh mục cấp 1
   */
  async getTopLevel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await assetCategoryService.getTopLevelCategories();
      
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/group/:group
   * Lấy danh mục theo nhóm
   */
  async getByGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = req.params.group as CategoryGroup;
      const categories = await assetCategoryService.getCategoriesByGroup(group);
      
      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/children/:parentCode
   * Lấy các danh mục con
   */
  async getChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parentCode } = req.params;
      const categories = await assetCategoryService.getChildCategories(parentCode);
      
      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/search
   * Tìm kiếm danh mục
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const keyword = (req.query.keyword as string) || '';
      const categories = await assetCategoryService.searchCategories(keyword);
      
      res.json({
        success: true,
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/:id
   * Lấy chi tiết một danh mục
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await assetCategoryService.getCategoryById(id);
      
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục',
        });
        return;
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/code/:code
   * Lấy danh mục theo mã
   */
  async getByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.params;
      const category = await assetCategoryService.getCategoryByCode(code);
      
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục',
        });
        return;
      }

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/asset-categories/:id/autofill
   * Lấy dữ liệu tự động điền khi chọn loại tài sản
   */
  async getAutoFill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const autoFillData = await assetCategoryService.getAutoFillData(id);
      
      if (!autoFillData) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục',
        });
        return;
      }

      res.json({
        success: true,
        data: autoFillData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/asset-categories
   * Tạo danh mục mới (chỉ admin)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await assetCategoryService.createCategory(req.body);
      
      res.status(201).json({
        success: true,
        data: category,
        message: 'Tạo danh mục thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/asset-categories/:id
   * Cập nhật danh mục (chỉ admin)
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await assetCategoryService.updateCategory(id, req.body);
      
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục',
        });
        return;
      }

      res.json({
        success: true,
        data: category,
        message: 'Cập nhật danh mục thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/asset-categories/:id
   * Xóa danh mục (chỉ admin, soft delete)
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await assetCategoryService.deleteCategory(id);
      
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Xóa danh mục thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/asset-categories/generate-code
   * Tự động sinh mã tài sản
   */
  async generateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryCode } = req.body;
      
      if (!categoryCode) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mã loại tài sản',
        });
        return;
      }

      // Tự động tìm số thứ tự tiếp theo chưa được sử dụng
      const assetCode = await assetCategoryService.generateAssetCode(categoryCode);
      
      res.json({
        success: true,
        data: { assetCode },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AssetCategoryController();
