/**
 * Import Service
 * Xử lý import tài sản hàng loạt từ file Excel
 * Sử dụng ExcelJS để tạo file Excel đúng chuẩn
 */

import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { Asset, Department, AssetCategory } from '../models';
import { Op } from 'sequelize';

// Định nghĩa các cột trong file Excel mẫu - đã loại bỏ Mã tài sản (tự sinh)
export interface ExcelAssetRow {
  // Bắt buộc
  'Tên tài sản (*)': string;
  'Loại tài sản (*)': string;
  'Đơn vị quản lý (*)': string;
  'Năm sử dụng (*)': number;
  
  // Không bắt buộc
  'Nguyên giá'?: number;
  'Mô tả'?: string;
  'Số lượng'?: number;
  'Đơn vị tính'?: string;
  'Số serial'?: string;
  'Vị trí'?: string;
  'Tình trạng'?: string;
  'Ghi chú'?: string;
}

// Kết quả import
export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  assetCode?: string;
  field: string;
  message: string;
}

// Tạo file Excel mẫu với ExcelJS
export const generateTemplate = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();
  
  // Sheet 1: Dữ liệu mẫu
  const dataSheet = workbook.addWorksheet('Dữ liệu mẫu');
  
  // Định nghĩa cột
  dataSheet.columns = [
    { header: 'Mã tài sản (*)', key: 'asset_code', width: 18 },
    { header: 'Tên tài sản (*)', key: 'name', width: 40 },
    { header: 'Mã loại tài sản (*)', key: 'category_code', width: 20 },
    { header: 'Đơn vị quản lý (*)', key: 'department', width: 30 },
    { header: 'Năm sử dụng (*)', key: 'year', width: 15 },
    { header: 'Nguyên giá (*)', key: 'original_value', width: 18 },
    { header: 'Mô tả', key: 'description', width: 40 },
    { header: 'Số lượng', key: 'quantity', width: 12 },
    { header: 'Đơn vị tính', key: 'unit', width: 12 },
    { header: 'Số serial', key: 'serial', width: 25 },
    { header: 'Vị trí', key: 'location', width: 25 },
    { header: 'Tình trạng', key: 'condition', width: 12 },
    { header: 'Ghi chú', key: 'notes', width: 30 },
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
    asset_code: 'TS-2026-001',
    name: 'Máy tính để bàn Dell OptiPlex 7080',
    category_code: 'I.1.9.1',
    department: 'Phòng Công nghệ thông tin',
    year: 2026,
    original_value: 25000000,
    description: 'Core i7, RAM 16GB, SSD 512GB',
    quantity: 1,
    unit: 'Bộ',
    serial: 'DELL-2026-ABC123',
    location: 'Phòng 301, Tầng 3',
    condition: 'Tốt',
    notes: '',
  });
  
  // Sheet 2: Hướng dẫn
  const guideSheet = workbook.addWorksheet('Hướng dẫn');
  guideSheet.columns = [{ header: 'Nội dung', key: 'content', width: 80 }];
  
  const guideContent = [
    'HƯỚNG DẪN IMPORT TÀI SẢN',
    '',
    'CÁC TRƯỜNG BẮT BUỘC (có dấu *):',
    '- Mã tài sản (*): Mã duy nhất cho mỗi tài sản, VD: TS-2026-001',
    '- Tên tài sản (*): Tên đầy đủ của tài sản',
    '- Mã loại tài sản (*): Mã danh mục theo Thông tư 141, VD: I.1.9.1',
    '- Đơn vị quản lý (*): Tên phòng ban quản lý tài sản',
    '- Năm sử dụng (*): Năm đưa vào sử dụng (chỉ cần nhập năm, VD: 2026)',
    '- Nguyên giá (*): Giá trị ban đầu của tài sản (VNĐ)',
    '',
    'CÁC TRƯỜNG KHÔNG BẮT BUỘC:',
    '- Mô tả: Mô tả chi tiết về tài sản',
    '- Số lượng: Mặc định là 1 nếu không điền',
    '- Đơn vị tính: Đơn vị tính (Cái, Bộ, Chiếc...), mặc định lấy từ danh mục',
    '- Số serial: Số serial/số seri của tài sản',
    '- Vị trí: Vị trí đặt tài sản',
    '- Tình trạng: Tốt, Trung bình, Kém, Hỏng (mặc định: Tốt)',
    '- Ghi chú: Ghi chú thêm',
    '',
    'LƯU Ý:',
    '1. Không được thay đổi tên các cột tiêu đề',
    '2. Mã tài sản phải là duy nhất, không trùng lặp',
    '3. Mã loại tài sản phải tồn tại trong hệ thống (xem sheet "Danh mục loại TS")',
    '4. Tên đơn vị quản lý phải khớp chính xác với tên trong hệ thống',
    '5. Năm sử dụng chỉ cần nhập năm (VD: 2026), không cần ngày/tháng',
  ];
  
  guideContent.forEach(line => {
    guideSheet.addRow({ content: line });
  });
  
  // Style cho tiêu đề hướng dẫn
  guideSheet.getRow(1).font = { bold: true, size: 14 };
  
  // Sheet 3: Danh mục loại tài sản
  const categorySheet = workbook.addWorksheet('Danh mục loại TS');
  categorySheet.columns = [
    { header: 'Mã loại', key: 'code', width: 15 },
    { header: 'Tên loại tài sản', key: 'name', width: 50 },
    { header: 'Đơn vị tính', key: 'unit', width: 15 },
    { header: 'Có khấu hao', key: 'depreciable', width: 12 },
    { header: 'Tỷ lệ KH (%)', key: 'rate', width: 12 },
    { header: 'Thời gian sử dụng (năm)', key: 'useful_life', width: 22 },
  ];
  
  categorySheet.getRow(1).font = { bold: true };
  categorySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  categorySheet.addRow({
    code: '(Xem danh mục trong hệ thống)',
    name: '',
    unit: '',
    depreciable: '',
    rate: '',
    useful_life: '',
  });
  
  // Xuất buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

// Tạo file mẫu với danh mục loại tài sản thực tế
export const generateTemplateWithCategories = async (): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();
  
  // Sheet 1: Dữ liệu mẫu
  const dataSheet = workbook.addWorksheet('Dữ liệu mẫu');
  
  dataSheet.columns = [
    { header: 'Mã tài sản (*)', key: 'asset_code', width: 18 },
    { header: 'Tên tài sản (*)', key: 'name', width: 40 },
    { header: 'Mã loại tài sản (*)', key: 'category_code', width: 20 },
    { header: 'Đơn vị quản lý (*)', key: 'department', width: 30 },
    { header: 'Năm sử dụng (*)', key: 'year', width: 15 },
    { header: 'Nguyên giá (*)', key: 'original_value', width: 18 },
    { header: 'Mô tả', key: 'description', width: 40 },
    { header: 'Số lượng', key: 'quantity', width: 12 },
    { header: 'Đơn vị tính', key: 'unit', width: 12 },
    { header: 'Số serial', key: 'serial', width: 25 },
    { header: 'Vị trí', key: 'location', width: 25 },
    { header: 'Tình trạng', key: 'condition', width: 12 },
    { header: 'Ghi chú', key: 'notes', width: 30 },
  ];
  
  dataSheet.getRow(1).font = { bold: true };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  dataSheet.addRow({
    asset_code: 'TS-2026-001',
    name: 'Máy tính để bàn Dell OptiPlex 7080',
    category_code: 'I.1.9.1',
    department: 'Phòng Công nghệ thông tin',
    year: 2026,
    original_value: 25000000,
    description: 'Core i7, RAM 16GB, SSD 512GB',
    quantity: 1,
    unit: 'Bộ',
    serial: 'DELL-2026-ABC123',
    location: 'Phòng 301, Tầng 3',
    condition: 'Tốt',
    notes: '',
  });
  
  // Sheet 2: Hướng dẫn
  const guideSheet = workbook.addWorksheet('Hướng dẫn');
  guideSheet.columns = [{ header: 'Nội dung', key: 'content', width: 80 }];
  
  const guideContent = [
    'HƯỚNG DẪN IMPORT TÀI SẢN',
    '',
    'CÁC TRƯỜNG BẮT BUỘC (có dấu *):',
    '- Mã tài sản (*): Mã duy nhất cho mỗi tài sản, VD: TS-2026-001',
    '- Tên tài sản (*): Tên đầy đủ của tài sản',
    '- Mã loại tài sản (*): Mã danh mục theo Thông tư 141, VD: I.1.9.1',
    '- Đơn vị quản lý (*): Tên phòng ban quản lý tài sản',
    '- Năm sử dụng (*): Năm đưa vào sử dụng (chỉ cần nhập năm, VD: 2026)',
    '- Nguyên giá (*): Giá trị ban đầu của tài sản (VNĐ)',
    '',
    'CÁC TRƯỜNG KHÔNG BẮT BUỘC:',
    '- Mô tả: Mô tả chi tiết về tài sản',
    '- Số lượng: Mặc định là 1 nếu không điền',
    '- Đơn vị tính: Đơn vị tính (Cái, Bộ, Chiếc...), mặc định lấy từ danh mục',
    '- Số serial: Số serial/số seri của tài sản',
    '- Vị trí: Vị trí đặt tài sản',
    '- Tình trạng: Tốt, Trung bình, Kém, Hỏng (mặc định: Tốt)',
    '- Ghi chú: Ghi chú thêm',
    '',
    'LƯU Ý:',
    '1. Không được thay đổi tên các cột tiêu đề',
    '2. Mã tài sản phải là duy nhất, không trùng lặp',
    '3. Mã loại tài sản phải tồn tại trong hệ thống (xem sheet "Danh mục loại TS")',
    '4. Tên đơn vị quản lý phải khớp chính xác với tên trong hệ thống (xem sheet "Danh sách đơn vị")',
    '5. Năm sử dụng chỉ cần nhập năm (VD: 2026), không cần ngày/tháng',
  ];
  
  guideContent.forEach(line => {
    guideSheet.addRow({ content: line });
  });
  guideSheet.getRow(1).font = { bold: true, size: 14 };
  
  // Sheet 3: Danh mục loại tài sản từ database
  const categorySheet = workbook.addWorksheet('Danh mục loại TS');
  categorySheet.columns = [
    { header: 'Mã loại', key: 'code', width: 15 },
    { header: 'Tên loại tài sản', key: 'name', width: 50 },
    { header: 'Đơn vị tính', key: 'unit', width: 15 },
    { header: 'Có khấu hao', key: 'depreciable', width: 12 },
    { header: 'Tỷ lệ KH (%)', key: 'rate', width: 12 },
    { header: 'Thời gian sử dụng (năm)', key: 'useful_life', width: 22 },
  ];
  
  categorySheet.getRow(1).font = { bold: true };
  categorySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Lấy danh mục từ database
  const categories = await AssetCategory.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['code', 'ASC']],
  });
  
  categories.forEach(cat => {
    categorySheet.addRow({
      code: cat.code,
      name: cat.name,
      unit: cat.unit || 'Cái',
      depreciable: cat.is_depreciable ? 'Có' : 'Không',
      rate: cat.depreciation_rate || '',
      useful_life: cat.useful_life_years || '',
    });
  });
  
  // Sheet 4: Danh sách đơn vị
  const deptSheet = workbook.addWorksheet('Danh sách đơn vị');
  deptSheet.columns = [
    { header: 'Tên đơn vị', key: 'name', width: 40 },
    { header: 'Loại', key: 'type', width: 15 },
  ];
  
  deptSheet.getRow(1).font = { bold: true };
  deptSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  const departments = await Department.findAll({
    order: [['name', 'ASC']],
  });
  
  departments.forEach(dept => {
    deptSheet.addRow({
      name: dept.name,
      type: dept.type || '',
    });
  });
  
  // Xuất buffer - sử dụng as unknown as Buffer để convert ArrayBuffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
};

// Tạo file mẫu và ghi trực tiếp ra file
export const generateTemplateToFile = async (filePath: string): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();
  
  // Lấy danh sách categories và departments trước để tạo dropdown
  const categories = await AssetCategory.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['code', 'ASC']],
  });
  
  const departments = await Department.findAll({
    order: [['name', 'ASC']],
  });
  
  // Sheet 1: Dữ liệu mẫu
  const dataSheet = workbook.addWorksheet('Dữ liệu mẫu');
  
  dataSheet.columns = [
    { header: 'Tên tài sản (*)', key: 'name', width: 40 },
    { header: 'Loại tài sản (*)', key: 'category_name', width: 50 },
    { header: 'Đơn vị quản lý (*)', key: 'department', width: 35 },
    { header: 'Năm sử dụng', key: 'year', width: 15 },
    { header: 'Nguyên giá', key: 'original_value', width: 18 },
    { header: 'Mô tả', key: 'description', width: 40 },
    { header: 'Số lượng', key: 'quantity', width: 12 },
    { header: 'Đơn vị tính', key: 'unit', width: 12 },
    { header: 'Số serial', key: 'serial', width: 25 },
    { header: 'Vị trí', key: 'location', width: 25 },
    { header: 'Tình trạng', key: 'condition', width: 12 },
    { header: 'Ghi chú', key: 'notes', width: 30 },
  ];
  
  dataSheet.getRow(1).font = { bold: true };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Tạo dropdown cho cột tình trạng
  const conditionFormula = '"Tốt,Trung bình,Kém,Hỏng"';
  
  // Thêm Data Validation và công thức cho 100 dòng (từ dòng 2 đến dòng 101)
  for (let row = 2; row <= 101; row++) {
    // Cột B (Loại tài sản) - sử dụng reference đến sheet Danh mục (cột B - Tên loại tài sản)
    if (categories.length > 0) {
      dataSheet.getCell(`B${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`='Danh mục loại TS'!$B$2:$B$${categories.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Lỗi',
        error: 'Vui lòng chọn từ danh sách loại tài sản',
      };
    }
    
    // Cột C (Đơn vị quản lý) - luôn dùng sheet reference để tránh lỗi khi tên đơn vị có dấu phẩy
    if (departments.length > 0) {
      dataSheet.getCell(`C${row}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`='Danh sách đơn vị'!$A$2:$A$${departments.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Lỗi',
        error: 'Vui lòng chọn từ danh sách đơn vị',
      };
    }
    
    // Cột H (Đơn vị tính) - VLOOKUP từ tên loại tài sản để lấy đơn vị tính tự động
    // Công thức: =IFERROR(VLOOKUP(B2,'Danh mục loại TS'!$B:$C,2,FALSE),"")
    dataSheet.getCell(`H${row}`).value = {
      formula: `IFERROR(VLOOKUP(B${row},'Danh mục loại TS'!$B:$C,2,FALSE),"")`,
    };
    
    // Cột K (Tình trạng)
    dataSheet.getCell(`K${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [conditionFormula],
    };
  }
  
  // KHÔNG thêm dữ liệu mẫu vào sheet nhập dữ liệu để tránh tình trạng
  // user upload lại template mà quên xóa dòng mẫu -> import nhầm tài sản mẫu

  // Sheet 2: Hướng dẫn
  const guideSheet = workbook.addWorksheet('Hướng dẫn');
  guideSheet.columns = [{ header: 'Nội dung', key: 'content', width: 80 }];
  
  const guideContent = [
    'HƯỚNG DẪN IMPORT TÀI SẢN',
    '',
    'CÁC TRƯỜNG BẮT BUỘC (có dấu *):',
    '- Tên tài sản (*): Tên đầy đủ của tài sản',
    '- Loại tài sản (*): Chọn từ dropdown - Tên loại tài sản theo Thông tư 141',
    '- Đơn vị quản lý (*): Chọn từ dropdown - Tên phòng ban quản lý tài sản',
    '- Năm sử dụng: Năm đưa vào sử dụng (VD: 2026) - để trống nếu chưa xác định',
    '',
    'CÁC TRƯỜNG KHÔNG BẮT BUỘC:',
    '- Nguyên giá: Giá trị ban đầu của tài sản (VNĐ) - Để trống nếu không có',
    '- Mô tả: Mô tả chi tiết về tài sản',
    '- Số lượng: Mặc định là 1 nếu không điền',
    '- Đơn vị tính: Đơn vị tính (Cái, Bộ, Chiếc...), mặc định lấy từ danh mục',
    '- Số serial: Số serial/số seri của tài sản',
    '- Vị trí: Vị trí đặt tài sản',
    '- Tình trạng: Chọn từ dropdown (Tốt, Trung bình, Kém, Hỏng) - mặc định: Tốt',
    '  + Hỏng: tài sản sẽ được đánh dấu trạng thái Hỏng trong hệ thống',
    '- Ghi chú: Ghi chú thêm',
    '',
    'TỰ ĐỘNG SINH MÃ TÀI SẢN:',
    '- Khi import, hệ thống sẽ TỰ ĐỘNG SINH mã tài sản theo format: [MÃ LOẠI]-[NĂM]-[SỐ TT]',
    '- Ví dụ: I.1.9.1-2026-001, I.1.9.1-2026-002...',
    '',
    'LƯU Ý:',
    '1. Không được thay đổi tên các cột tiêu đề',
    '2. Mã tài sản sẽ được tự động sinh - không cần nhập',
    '3. Loại tài sản và Đơn vị quản lý: CHỌN TỪ DROPDOWN',
    '4. Năm sử dụng chỉ cần nhập năm (VD: 2026), không cần ngày/tháng',
    '5. Nguyên giá có thể để trống nếu không xác định được',
  ];
  
  guideContent.forEach(line => {
    guideSheet.addRow({ content: line });
  });
  guideSheet.getRow(1).font = { bold: true, size: 14 };
  
  // Sheet 3: Danh mục loại tài sản từ database
  const categorySheet = workbook.addWorksheet('Danh mục loại TS');
  categorySheet.columns = [
    { header: 'Mã loại', key: 'code', width: 15 },
    { header: 'Tên loại tài sản', key: 'name', width: 50 },
    { header: 'Đơn vị tính', key: 'unit', width: 15 },
    { header: 'Có khấu hao', key: 'depreciable', width: 12 },
    { header: 'Tỷ lệ KH (%)', key: 'rate', width: 12 },
    { header: 'Thời gian sử dụng (năm)', key: 'useful_life', width: 22 },
  ];
  
  categorySheet.getRow(1).font = { bold: true };
  categorySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Đã lấy categories ở trên, dùng lại
  
  categories.forEach(cat => {
    categorySheet.addRow({
      code: cat.code,
      name: cat.name,
      unit: cat.unit || 'Cái',
      depreciable: cat.is_depreciable ? 'Có' : 'Không',
      rate: cat.depreciation_rate || '',
      useful_life: cat.useful_life_years || '',
    });
  });
  
  // Sheet 4: Danh sách đơn vị - đã lấy departments ở trên, dùng lại
  const deptSheet = workbook.addWorksheet('Danh sách đơn vị');
  deptSheet.columns = [
    { header: 'Tên đơn vị', key: 'name', width: 40 },
    { header: 'Loại', key: 'type', width: 15 },
  ];
  
  deptSheet.getRow(1).font = { bold: true };
  deptSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  departments.forEach(dept => {
    deptSheet.addRow({
      name: dept.name,
      type: dept.type || '',
    });
  });
  
  // Ghi file trực tiếp
  await workbook.xlsx.writeFile(filePath);
};

// Map tình trạng từ tiếng Việt sang enum
const mapCondition = (condition?: string): 'good' | 'fair' | 'poor' | 'damaged' => {
  if (!condition) return 'good';
  const normalized = condition.toLowerCase().trim();
  if (normalized.includes('tốt') || normalized.includes('tot')) return 'good';
  if (normalized.includes('trung bình') || normalized.includes('trung binh')) return 'fair';
  if (normalized.includes('kém') || normalized.includes('kem')) return 'poor';
  if (normalized.includes('hỏng') || normalized.includes('hong')) return 'damaged';
  return 'good';
};

// Xử lý import từ file Excel (vẫn dùng xlsx để đọc vì nó ổn định)
export const importAssetsFromExcel = async (fileBuffer: Buffer, userId: number): Promise<ImportResult> => {
  const result: ImportResult = {
    success: true,
    total: 0,
    imported: 0,
    failed: 0,
    errors: [],
  };
  
  try {
    // Đọc file Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
    const sheet = workbook.Sheets[sheetName];
    
    // Chuyển sheet sang JSON
    const allRows = XLSX.utils.sheet_to_json<ExcelAssetRow>(sheet);
    
    // Chuỗi nhận diện dòng mẫu (template cũ hoặc file cache có thể còn dữ liệu mẫu)
    const isSampleRow = (name: string, category?: string, department?: string): boolean => {
      if (!name) return false;
      const n = name.toLowerCase();
      if (n.includes('máy tính để bàn dell') || n.includes('dell optiplex')) return true;
      if (n === 'máy tính để bàn dell optiplex 7080') return true;
      if (category?.toLowerCase().includes('i.1.9.1') && department?.toLowerCase().includes('công nghệ thông tin') && n.includes('máy tính')) return true;
      return false;
    };

    // Lọc bỏ các dòng hoàn toàn trống VÀ bỏ qua dòng dữ liệu mẫu (tránh import nhầm tài sản mẫu)
    const rows = allRows.filter(row => {
      const name = row['Tên tài sản (*)']?.toString().trim() ?? '';
      const category = row['Loại tài sản (*)']?.toString().trim() ?? '';
      const department = row['Đơn vị quản lý (*)']?.toString().trim() ?? '';
      if (!(name || category || department)) return false;
      if (isSampleRow(name, category, department)) return false;
      return true;
    });
    
    result.total = rows.length;
    
    if (rows.length === 0) {
      result.success = false;
      result.errors.push({
        row: 0,
        field: 'file',
        message: 'File không có dữ liệu hoặc định dạng không đúng',
      });
      return result;
    }
    
    // Lấy danh sách departments và categories để validate
    const departments = await Department.findAll();

    // Chuẩn hóa tên: lowercase, bỏ dấu câu thừa (dấu phẩy, chấm, gạch ngang...), chuẩn hóa khoảng trắng
    const normalizeName = (s: string): string =>
      s.toLowerCase()
        .replace(/[,.\-–—]/g, ' ')   // thay dấu câu bằng space
        .replace(/\s+/g, ' ')        // nhiều space → 1 space
        .trim();

    // Tìm department theo tên với 3 cấp độ: khớp chính xác → khớp chuẩn hóa → khớp một phần
    const findDepartment = (input: string): number | undefined => {
      const exact = input.toLowerCase();
      // 1. Khớp chính xác (lowercase)
      const exactMatch = departments.find(d => d.name.toLowerCase() === exact);
      if (exactMatch) return exactMatch.id;

      // 2. Khớp sau khi chuẩn hóa dấu câu
      const normalized = normalizeName(input);
      const normMatch = departments.find(d => normalizeName(d.name) === normalized);
      if (normMatch) return normMatch.id;

      // 3. Khớp một phần: tên nhập vào nằm trong tên DB hoặc ngược lại
      const partialMatch = departments.find(d => {
        const dn = normalizeName(d.name);
        return dn.includes(normalized) || normalized.includes(dn);
      });
      if (partialMatch) return partialMatch.id;

      return undefined;
    };

    const categories = await AssetCategory.findAll({ where: { is_active: true } });
    // Tạo map theo tên loại tài sản (lowercase) để tìm kiếm
    const catNameMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));
    
    // Lấy danh sách mã tài sản đã tồn tại
    const existingCodes = await Asset.findAll({
      attributes: ['asset_code'],
    });
    const existingCodeSet = new Set(existingCodes.map(a => a.asset_code.toLowerCase()));
    
    // Bộ đếm cho mã tài sản tự sinh theo từng loại và năm
    const assetCodeCounters: Map<string, number> = new Map();
    
    // Hàm tự sinh mã tài sản
    const generateAssetCode = async (categoryCode: string, year: number): Promise<string> => {
      const prefix = `${categoryCode}-${year}`;
      
      // Kiểm tra counter hiện tại
      if (!assetCodeCounters.has(prefix)) {
        // Tìm mã lớn nhất trong database cho prefix này
        const existingAssets = await Asset.findAll({
          where: {
            asset_code: {
              [Op.like]: `${prefix}-%`,
            },
          },
          attributes: ['asset_code'],
          order: [['asset_code', 'DESC']],
          limit: 1,
        });
        
        let maxNum = 0;
        if (existingAssets.length > 0) {
          const lastCode = existingAssets[0].asset_code;
          const parts = lastCode.split('-');
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum)) {
            maxNum = lastNum;
          }
        }
        assetCodeCounters.set(prefix, maxNum);
      }
      
      // Tăng counter và tạo mã mới
      const currentCount = assetCodeCounters.get(prefix)! + 1;
      assetCodeCounters.set(prefix, currentCount);
      
      const newCode = `${prefix}-${String(currentCount).padStart(3, '0')}`;
      
      // Đảm bảo mã không trùng
      if (existingCodeSet.has(newCode.toLowerCase())) {
        return generateAssetCode(categoryCode, year); // Đệ quy nếu trùng
      }
      
      existingCodeSet.add(newCode.toLowerCase());
      return newCode;
    };
    
    // Xử lý từng dòng
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 vì Excel bắt đầu từ 1 và có header
      const rowErrors: ImportError[] = [];
      
      // Validate các trường bắt buộc
      const assetName = row['Tên tài sản (*)']?.toString().trim();
      const categoryName = row['Loại tài sản (*)']?.toString().trim();
      const departmentName = row['Đơn vị quản lý (*)']?.toString().trim();
      const yearOfUse = row['Năm sử dụng']; // Không bắt buộc - có thể để trống
      const originalValue = row['Nguyên giá']; // Không bắt buộc
      
      if (!assetName) {
        rowErrors.push({ row: rowNum, field: 'Tên tài sản', message: 'Tên tài sản là bắt buộc' });
      }
      
      if (!categoryName) {
        rowErrors.push({ row: rowNum, field: 'Loại tài sản', message: 'Loại tài sản là bắt buộc' });
      }
      
      // Tìm category theo tên
      const category = categoryName ? catNameMap.get(categoryName.toLowerCase()) : null;
      if (categoryName && !category) {
        rowErrors.push({ row: rowNum, field: 'Loại tài sản', message: `Loại tài sản "${categoryName}" không tồn tại trong hệ thống` });
      }
      
      if (!departmentName) {
        rowErrors.push({ row: rowNum, field: 'Đơn vị quản lý', message: 'Đơn vị quản lý là bắt buộc' });
      }
      
      const departmentId = departmentName ? findDepartment(departmentName) : null;
      if (departmentName && !departmentId) {
        // Gợi ý tên đơn vị gần nhất để user biết cách sửa
        const suggestion = departments
          .map(d => ({ name: d.name, norm: normalizeName(d.name) }))
          .find(d => d.norm.split(' ').some(w => w.length > 3 && normalizeName(departmentName).includes(w)));
        const hint = suggestion ? ` Ý bạn là "${suggestion.name}"?` : '';
        rowErrors.push({ row: rowNum, field: 'Đơn vị quản lý', message: `Đơn vị "${departmentName}" không tồn tại trong hệ thống.${hint}` });
      }
      
      // Nếu có lỗi, thêm vào danh sách và bỏ qua dòng này
      if (rowErrors.length > 0) {
        result.errors.push(...rowErrors);
        result.failed++;
        continue;
      }
      
      // Tạo tài sản mới
      try {
        // Tính ngày sử dụng từ năm (nếu không có thì dùng năm hiện tại cho mã tài sản)
        const currentYear = new Date().getFullYear();
        const year = yearOfUse ? Number(yearOfUse) : currentYear;
        const acquisitionDate = yearOfUse ? new Date(year, 0, 1) : null; // Null nếu không có năm
        
        // Lấy mã loại tài sản từ category
        const categoryCode = category!.code;
        
        // Tự sinh mã tài sản
        const generatedAssetCode = await generateAssetCode(categoryCode, year);
        
        // Lấy thông tin từ category
        const depreciationRate = category?.depreciation_rate || 0;
        const usefulLife = category?.useful_life_years || 0;
        const isDepreciable = category?.is_depreciable ?? false;
        
        // Tính giá trị còn lại và khấu hao lũy kế
        // Chỉ tính khấu hao khi CÓ CẢ năm sử dụng VÀ nguyên giá
        const originalVal = originalValue ? Number(originalValue) : 0;
        const hasYearOfUse = !!yearOfUse;
        const hasOriginalValue = originalVal > 0;
        
        let accumulatedDepreciation = 0;
        let currentValue = originalVal;
        
        // Chỉ tính khấu hao khi có đủ thông tin: năm sử dụng, nguyên giá, và tài sản được phép khấu hao
        if (isDepreciable && depreciationRate > 0 && hasYearOfUse && hasOriginalValue) {
          const yearsUsed = currentYear - year;
          if (yearsUsed > 0) {
            const annualDepreciation = originalVal * (depreciationRate / 100);
            accumulatedDepreciation = Math.min(annualDepreciation * yearsUsed, originalVal);
            currentValue = originalVal - accumulatedDepreciation;
          }
        }
        
        const mappedCondition = mapCondition(row['Tình trạng']?.toString());
        // Tình trạng Hỏng -> status là 'damaged'; còn lại -> 'active'
        const mappedStatus = mappedCondition === 'damaged' ? 'damaged' : 'active';

        await Asset.create({
          asset_code: generatedAssetCode,
          name: assetName!,
          description: row['Mô tả']?.toString() || '',
          category_id: category!.id,   // FK để JOIN dashboard hoạt động đúng
          category_code: categoryCode,
          current_department_id: departmentId!,
          purchase_date: acquisitionDate, // Null nếu không có năm sử dụng
          purchase_price: hasOriginalValue ? originalVal : null, // Null nếu không có nguyên giá
          current_value: hasOriginalValue ? currentValue : null, // Null nếu không có nguyên giá
          quantity: Number(row['Số lượng']) || 1,
          unit: row['Đơn vị tính']?.toString() || category?.unit || 'Cái',
          serial_number: row['Số serial']?.toString() || null,
          location: row['Vị trí']?.toString() || '',
          condition: mappedCondition,
          status: mappedStatus,
          is_depreciable: isDepreciable && hasYearOfUse && hasOriginalValue, // Chỉ đánh dấu khấu hao nếu có đủ thông tin
          depreciation_rate: depreciationRate,
          useful_life: usefulLife,
          accumulated_depreciation: accumulatedDepreciation, // 0 nếu không tính khấu hao
          year_in_use: yearOfUse ? year : null, // Null nếu không nhập năm sử dụng
        });
        
        result.imported++;
      } catch (error: any) {
        result.errors.push({
          row: rowNum,
          field: 'database',
          message: `Lỗi lưu vào database: ${error.message}`,
        });
        result.failed++;
      }
    }
    
    result.success = result.failed === 0;
  } catch (error: any) {
    result.success = false;
    result.errors.push({
      row: 0,
      field: 'file',
      message: `Lỗi đọc file: ${error.message}`,
    });
  }
  
  return result;
};

export default {
  generateTemplate,
  generateTemplateWithCategories,
  generateTemplateToFile,
  importAssetsFromExcel,
};
