import { Department, User, Asset, AssetTransfer, MaintenanceRequest } from '../models';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import sequelize from '../config/database';

export interface CreateDepartmentInput {
  name: string;
  type?: string;
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  type?: string;
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
}

class DepartmentService {
  async getAllDepartments(query: any): Promise<PaginationResult<Department>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.parent_department_id) {
      where.parent_department_id = query.parent_department_id;
    }

    const { count, rows } = await Department.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: Department,
          as: 'parent_department',
          attributes: ['id', 'name', 'type'],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getDepartmentById(id: number): Promise<Department> {
    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'username', 'fullname', 'email'],
        },
        {
          model: Department,
          as: 'parent_department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: Department,
          as: 'sub_departments',
          attributes: ['id', 'name', 'type'],
        },
      ],
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return department;
  }

  async createDepartment(data: CreateDepartmentInput): Promise<Department> {
    // Check if parent department exists
    if (data.parent_department_id) {
      const parentDept = await Department.findByPk(data.parent_department_id);
      if (!parentDept) {
        throw new NotFoundError('Parent department not found');
      }
    }

    // Check if manager exists
    if (data.manager_id) {
      const manager = await User.findByPk(data.manager_id);
      if (!manager) {
        throw new NotFoundError('Manager not found');
      }
    }

    const department = await Department.create(data);
    return this.getDepartmentById(department.id);
  }

  async updateDepartment(id: number, data: UpdateDepartmentInput): Promise<Department> {
    const department = await Department.findByPk(id);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check if parent department exists
    if (data.parent_department_id) {
      // Prevent self-reference
      if (data.parent_department_id === id) {
        throw new ConflictError('Department cannot be its own parent');
      }

      const parentDept = await Department.findByPk(data.parent_department_id);
      if (!parentDept) {
        throw new NotFoundError('Parent department not found');
      }
    }

    // Check if manager exists
    if (data.manager_id) {
      const manager = await User.findByPk(data.manager_id);
      if (!manager) {
        throw new NotFoundError('Manager not found');
      }
    }

    await department.update(data);
    return this.getDepartmentById(id);
  }

  async deleteDepartment(id: number, options?: { reassignUsersAndAssets?: boolean }): Promise<void> {
    const department = await Department.findByPk(id);

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check if department has sub-departments
    const subDepartments = await Department.count({
      where: { parent_department_id: id },
    });

    if (subDepartments > 0) {
      throw new ConflictError(
        'Không thể xóa phòng ban đang có phòng ban con. Vui lòng xóa hoặc chuyển các phòng ban con trước.'
      );
    }

    const userCount = await User.count({ where: { department_id: id } });
    const assetCount = await Asset.count({ where: { current_department_id: id } });

    const hasUsersOrAssets = userCount > 0 || assetCount > 0;
    if (hasUsersOrAssets) {
      if (options?.reassignUsersAndAssets) {
        // Admin chọn "gỡ phòng ban rồi xóa": gỡ user, tài sản, điều chuyển, đề nghị sửa chữa
        await User.update({ department_id: null }, { where: { department_id: id } });
        await Asset.update({ current_department_id: null }, { where: { current_department_id: id } });
        await AssetTransfer.update({ from_department_id: null }, { where: { from_department_id: id } });
        await AssetTransfer.update({ to_department_id: null }, { where: { to_department_id: id } });
        await MaintenanceRequest.update({ department_id: null }, { where: { department_id: id } });
        await MaintenanceRequest.update({ receiving_department_id: null }, { where: { receiving_department_id: id } });
      } else {
        const parts: string[] = [];
        if (userCount > 0) parts.push(`${userCount} người dùng`);
        if (assetCount > 0) parts.push(`${assetCount} tài sản`);
        throw new ConflictError(
          `Không thể xóa phòng ban đang có ${parts.join(' và ')}. Bạn có thể chọn "Gỡ phòng ban rồi xóa" để gỡ và xóa.`
        );
      }
    }

    try {
      await department.destroy();
    } catch (err: any) {
      if (err.name === 'SequelizeForeignKeyConstraintError' || err.message?.includes('foreign key')) {
        throw new ConflictError(
          'Phòng ban vẫn đang được tham chiếu (ví dụ: báo cáo kiểm kê). Vui lòng xóa hoặc chuyển các bản ghi liên quan trước.'
        );
      }
      throw err;
    }
  }

  async getDepartmentTree(): Promise<Department[]> {
    // Get all root departments (no parent)
    const rootDepartments = await Department.findAll({
      where: { parent_department_id: null },
      include: [
        {
          model: Department,
          as: 'sub_departments',
          include: [
            {
              model: Department,
              as: 'sub_departments',
            },
          ],
        },
      ],
    });

    return rootDepartments;
  }

  /**
   * Generate Excel template for importing departments
   */
  async generateDepartmentTemplate(): Promise<Buffer> {
    // Khớp đúng 7 loại như form Thêm phòng ban (không thêm Lớp học, Phòng ban)
    const validTypes = [
      'Phòng', 'Khoa', 'Trung tâm', 'Phòng học', 'Phòng thực hành', 'Phòng họp', 'Hội trường',
    ];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Asset Management System';
    workbook.created = new Date();

    // Sheet 1: Dữ liệu mẫu
    const dataSheet = workbook.addWorksheet('Dữ liệu mẫu');

    // Định nghĩa cột
    dataSheet.columns = [
      { header: 'Tên phòng ban (*)', key: 'name', width: 40 },
      { header: 'Loại phòng ban (*)', key: 'type', width: 20 },
      { header: 'Phòng ban cha', key: 'parent_name', width: 40 },
      { header: 'Mô tả', key: 'description', width: 50 },
    ];

    // Style cho header
    dataSheet.getRow(1).font = { bold: true };
    dataSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Thêm dữ liệu mẫu
    dataSheet.addRow({
      name: 'Phòng học A101',
      type: 'Phòng học',
      parent_name: '',
      description: 'Phòng học lý thuyết tầng 1',
    });

    dataSheet.addRow({
      name: 'Phòng học CNTT-K1',
      type: 'Phòng học',
      parent_name: 'Khoa Công nghệ thông tin',
      description: 'Phòng học chuyên ngành CNTT khóa 1',
    });

    dataSheet.addRow({
      name: 'Phòng thực hành Tin học',
      type: 'Phòng thực hành',
      parent_name: 'Khoa Công nghệ thông tin',
      description: 'Phòng thực hành máy tính',
    });

    // Sheet 2: Hướng dẫn
    const guideSheet = workbook.addWorksheet('Hướng dẫn');
    guideSheet.columns = [{ header: 'Nội dung', key: 'content', width: 80 }];

    const guideContent = [
      'HƯỚNG DẪN IMPORT PHÒNG BAN',
      '',
      'CÁC TRƯỜNG BẮT BUỘC (có dấu *):',
      '- Tên phòng ban (*): Tên đầy đủ của phòng ban',
      '- Loại phòng ban (*): Chọn từ dropdown (cột B) - các loại:',
      '  + Phòng: Phòng ban chính (VD: Phòng Công nghệ thông tin)',
      '  + Khoa: Khoa (VD: Khoa Công nghệ thông tin)',
      '  + Trung tâm: Trung tâm (VD: Trung tâm Ngoại ngữ)',
      '  + Phòng học: Phòng học (VD: Phòng học A101)',
      '  + Phòng thực hành: Phòng thực hành (VD: Phòng thực hành Tin học)',
      '  + Phòng họp: Phòng họp',
      '  + Hội trường: Hội trường',
      '',
      'CÁC TRƯỜNG KHÔNG BẮT BUỘC:',
      '- Phòng ban cha: Chọn từ dropdown hoặc để trống nếu là phòng ban gốc',
      '- Mô tả: Mô tả chi tiết về phòng ban',
      '',
      'LƯU Ý:',
      '1. Không được thay đổi tên các cột tiêu đề',
      '2. Tên phòng ban phải là duy nhất, không trùng lặp',
      '3. Loại phòng ban: bắt buộc chọn từ dropdown (cột B)',
      '4. Phòng ban cha: xem sheet "Danh sách phòng ban" để chọn đúng tên',
      '5. Nếu phòng ban cha chưa tồn tại, hệ thống sẽ tự động tạo với loại "Phòng"',
    ];

    guideContent.forEach(line => {
      guideSheet.addRow({ content: line });
    });

    // Style cho tiêu đề hướng dẫn
    guideSheet.getRow(1).font = { bold: true, size: 14 };

    // Sheet 3: Danh sách phòng ban hiện có
    const deptSheet = workbook.addWorksheet('Danh sách phòng ban');
    deptSheet.columns = [
      { header: 'Tên phòng ban', key: 'name', width: 40 },
      { header: 'Loại', key: 'type', width: 20 },
      { header: 'Phòng ban cha', key: 'parent_name', width: 40 },
    ];

    deptSheet.getRow(1).font = { bold: true };
    deptSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Lấy danh sách phòng ban từ database
    const departments = await Department.findAll({
      include: [
        {
          model: Department,
          as: 'parent_department',
          attributes: ['name'],
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });

    // Sheet 4: Danh mục (ẩn) để tạo dropdown
    const lookupSheet = workbook.addWorksheet('Danh mục', { state: 'hidden' as any });

    // Danh sách loại phòng ban
    validTypes.forEach((type, index) => {
      lookupSheet.getCell(`A${index + 1}`).value = type;
    });

    // Danh sách phòng ban cha (unique)
    const parentNames = Array.from(new Set(departments.map(dept => dept.name)));
    if (parentNames.length === 0) {
      parentNames.push('Chưa có phòng ban'); // placeholder để tránh range rỗng
    }
    parentNames.forEach((name, index) => {
      lookupSheet.getCell(`B${index + 1}`).value = name;
    });

    const typeToLabel: Record<string, string> = {
      department: 'Phòng', faculty: 'Khoa', center: 'Trung tâm',
      classroom: 'Phòng học', lab: 'Phòng thực hành',
      meeting_room: 'Phòng họp', hall: 'Hội trường',
    };
    departments.forEach(dept => {
      deptSheet.addRow({
        name: dept.name,
        type: (dept.type && typeToLabel[dept.type]) ? typeToLabel[dept.type] : (dept.type || '-'),
        parent_name: (dept as any).parent_department?.name || '-',
      });
    });

    // Thêm data validation cho cột loại phòng ban và phòng ban cha
    const maxRows = 2000; // đủ lớn cho import
    // Thêm dropdown bằng cách cast sang any do ExcelJS types chưa khai báo dataValidations
    const sheetWithValidation = dataSheet as any;

    sheetWithValidation.dataValidations.add(`B2:B${maxRows}`, {
      type: 'list',
      allowBlank: false,
      formulae: [`'Danh mục'!$A$1:$A$${validTypes.length}`],
      showErrorMessage: true,
      errorTitle: 'Loại phòng ban không hợp lệ',
      error: `Chỉ chọn trong danh sách: ${validTypes.join(', ')}`,
    });

    sheetWithValidation.dataValidations.add(`C2:C${maxRows}`, {
      type: 'list',
      allowBlank: true,
      formulae: [`'Danh mục'!$B$1:$B$${parentNames.length}`],
      showErrorMessage: true,
      errorTitle: 'Phòng ban cha không hợp lệ',
      error: 'Vui lòng chọn phòng ban cha trong danh sách hoặc để trống',
    });

    // Xuất buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  /**
   * Import departments from Excel file
   */
  async importDepartmentsFromExcel(fileBuffer: Buffer): Promise<{
    success: boolean;
    total: number;
    imported: number;
    failed: number;
    errors: Array<{ row: number; field: string; message: string }>;
  }> {
    const errors: Array<{ row: number; field: string; message: string }> = [];
    let imported = 0;
    let total = 0;

    try {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rows.length === 0) {
        throw new ValidationError('File Excel không có dữ liệu');
      }

      total = rows.length;

      // Map tiếng Việt (và legacy) sang key hệ thống - đủ như form Thêm phòng ban
      const typeMap: Record<string, string> = {
        'phòng': 'department',
        'phòng ban': 'department',
        'khoa': 'faculty',
        'trung tâm': 'center',
        'phòng học': 'classroom',
        'lớp học': 'classroom',
        'phòng thực hành': 'lab',
        'phòng họp': 'meeting_room',
        'hội trường': 'hall',
        'department': 'department',
        'faculty': 'faculty',
        'center': 'center',
        'classroom': 'classroom',
        'lab': 'lab',
        'meeting_room': 'meeting_room',
        'hall': 'hall',
      };
      const validTypes = ['Phòng', 'Khoa', 'Trung tâm', 'Phòng học', 'Phòng thực hành', 'Phòng họp', 'Hội trường'];

      // Use transaction to ensure atomicity
      const transaction = await sequelize.transaction();

      try {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNumber = i + 2; // +2 because Excel starts at row 1 and row 1 is header

          try {
            // Validate required fields
            const name = String(row['Tên phòng ban (*)'] || row['Tên phòng ban'] || '').trim();
            const type = String(row['Loại phòng ban (*)'] || row['Loại phòng ban'] || '').trim();
            const parentName = String(row['Phòng ban cha'] || '').trim();
            const description = String(row['Mô tả'] || '').trim();

            // Validate name
            if (!name) {
              errors.push({
                row: rowNumber,
                field: 'Tên phòng ban',
                message: 'Tên phòng ban là bắt buộc',
              });
              continue;
            }

            // Validate type
            if (!type) {
              errors.push({
                row: rowNumber,
                field: 'Loại phòng ban',
                message: 'Loại phòng ban là bắt buộc',
              });
              continue;
            }

            const normalizedType = typeMap[type.toLowerCase()];

            if (!normalizedType) {
              errors.push({
                row: rowNumber,
                field: 'Loại phòng ban',
                message: `Loại phòng ban không hợp lệ. Phải là một trong: ${validTypes.join(', ')}`,
              });
              continue;
            }

            // Check if department already exists
            const existingDept = await Department.findOne({
              where: { name },
              transaction,
            });

            if (existingDept) {
              errors.push({
                row: rowNumber,
                field: 'Tên phòng ban',
                message: `Phòng ban "${name}" đã tồn tại trong hệ thống`,
              });
              continue;
            }

            // Find or create parent department
            let parentDepartmentId: number | null = null;
            if (parentName) {
              let parentDept = await Department.findOne({
                where: { name: parentName },
                transaction,
              });

              // If parent doesn't exist, create it (type = department để khớp DB)
              if (!parentDept) {
                parentDept = await Department.create(
                  {
                    name: parentName,
                    type: 'department',
                    description: `Tự động tạo khi import phòng ban con: ${name}`,
                  },
                  { transaction }
                );
              }

              parentDepartmentId = parentDept.id;
            }

            // Create department
            await Department.create(
              {
                name,
                type: normalizedType,
                parent_department_id: parentDepartmentId,
                description: description || null,
              },
              { transaction }
            );

            imported++;
          } catch (rowError: any) {
            errors.push({
              row: rowNumber,
              field: 'Chung',
              message: rowError.message || 'Lỗi không xác định',
            });
          }
        }

        // Commit transaction if all rows processed successfully or with errors
        await transaction.commit();
      } catch (transactionError: any) {
        await transaction.rollback();
        throw transactionError;
      }

      return {
        success: errors.length === 0,
        total,
        imported,
        failed: errors.length,
        errors,
      };
    } catch (error: any) {
      throw new ValidationError(`Lỗi khi import file Excel: ${error.message}`);
    }
  }

  /**
   * Alias method for Excel import to keep API naming consistent
   */
  async importExcel(fileBuffer: Buffer) {
    return this.importDepartmentsFromExcel(fileBuffer);
  }
}

export default new DepartmentService();
