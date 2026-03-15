/**
 * Export Service
 * Xử lý export tài sản ra file Excel
 * Sử dụng ExcelJS để tạo file Excel đúng chuẩn
 */

import ExcelJS from 'exceljs';
import assetService from './asset.service';

/**
 * Export assets to Excel
 * @param query - Query parameters for filtering assets
 * @param userRole - User role for permission checking
 * @param userDepartmentId - User's department ID (for filtering)
 * @returns Excel file buffer
 */
export const exportAssetsToExcel = async (
  query: any,
  userRole: string,
  userDepartmentId?: number
): Promise<Buffer> => {
  // Apply permission-based filtering
  const exportQuery: any = { ...query };
  
  // Trưởng đơn vị và cán bộ chỉ export tài sản của phòng ban mình
  if (userRole !== 'admin' && userRole !== 'director') {
    if (userDepartmentId) {
      exportQuery.current_department_id = String(userDepartmentId);
    }
  }

  // Remove pagination to get all assets
  delete exportQuery.page;
  delete exportQuery.limit;
  
  // Set a high limit to get all matching assets
  exportQuery.limit = 10000;
  exportQuery.page = 1;

  // Get all assets matching the query
  const result = await assetService.getAllAssets(exportQuery);
  const assets = result.data as any[];

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create worksheet
  const worksheet = workbook.addWorksheet('Danh sách tài sản');

  // Define columns
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 8 },
    { header: 'Mã tài sản', key: 'asset_code', width: 18 },
    { header: 'Mã loại TS', key: 'category_code', width: 15 },
    { header: 'Tên tài sản', key: 'name', width: 40 },
    { header: 'Đơn vị tính', key: 'unit', width: 12 },
    { header: 'Số lượng', key: 'quantity', width: 10 },
    { header: 'Năm sử dụng', key: 'year_in_use', width: 12 },
    { header: 'Nguyên giá', key: 'purchase_price', width: 18 },
    { header: 'Giá trị còn lại', key: 'residual_value', width: 18 },
    { header: 'Khấu hao lũy kế', key: 'accumulated_depreciation', width: 18 },
    { header: 'Tỷ lệ KH (%)', key: 'depreciation_rate', width: 12 },
    { header: 'Thời gian sử dụng (năm)', key: 'useful_life', width: 18 },
    { header: 'Tình trạng', key: 'status', width: 12 },
    { header: 'Phòng ban', key: 'department', width: 30 },
    { header: 'Vị trí', key: 'location', width: 25 },
    { header: 'Số serial', key: 'serial_number', width: 25 },
    { header: 'Mô tả', key: 'description', width: 40 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 11 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  worksheet.getRow(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Add data rows
  assets.forEach((asset, index) => {
    const row = worksheet.addRow({
      stt: index + 1,
      asset_code: asset.asset_code || '',
      category_code: asset.category_code || '',
      name: asset.name || '',
      unit: asset.unit || 'Cái',
      quantity: asset.quantity || 1,
      year_in_use: asset.year_in_use || '',
      purchase_price: asset.purchase_price ? Number(asset.purchase_price) : 0,
      residual_value: asset.residual_value ? Number(asset.residual_value) : 0,
      accumulated_depreciation: asset.accumulated_depreciation ? Number(asset.accumulated_depreciation) : 0,
      depreciation_rate: asset.depreciation_rate ? Number(asset.depreciation_rate) : 0,
      useful_life: asset.useful_life || '',
      status: getStatusText(asset.status),
      department: asset.current_department?.name || '',
      location: asset.location || '',
      serial_number: asset.serial_number || '',
      description: asset.description || '',
    });

    // Style data rows
    row.height = 20;
    row.alignment = { vertical: 'middle' };

    // Number formatting for price columns
    const priceColumns = ['purchase_price', 'residual_value', 'accumulated_depreciation'];
    priceColumns.forEach(col => {
      const cell = row.getCell(col);
      if (cell.value && typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Center alignment for certain columns
    const centerColumns = ['stt', 'quantity', 'year_in_use', 'depreciation_rate', 'useful_life'];
    centerColumns.forEach(col => {
      const cell = row.getCell(col);
      cell.alignment = { horizontal: 'center' };
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' },
      };
    }
  });

  // Freeze header row
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 1,
    },
  ];

  // Auto-fit columns (approximate)
  worksheet.columns.forEach((column: any) => {
    if (column.header) {
      column.width = Math.max(column.width || 10, column.header.length + 2);
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

/**
 * Get status text in Vietnamese
 */
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Đang sử dụng',
    inactive: 'Không sử dụng',
    damaged: 'Hỏng',
    lost: 'Mất',
    disposed: 'Đã thanh lý',
    pending_disposal: 'Chờ thanh lý',
  };
  return statusMap[status] || status;
};

export default {
  exportAssetsToExcel,
};
