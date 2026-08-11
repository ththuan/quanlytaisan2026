/**
 * Import người dùng hàng loạt từ Excel
 */

import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { User, Department } from '../models';

export interface UserImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

const ROLES = ['admin', 'director', 'department_head', 'staff'] as const;
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'Ctec@123';

/** Tạo file Excel mẫu import người dùng */
export async function generateUserImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Management System';
  workbook.created = new Date();

  const dataSheet = workbook.addWorksheet('Dữ liệu mẫu');
  dataSheet.columns = [
    { header: 'Tên đăng nhập (*)', key: 'username', width: 22 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Mật khẩu (*)', key: 'password', width: 20 },
    { header: 'Họ tên', key: 'fullname', width: 28 },
    { header: 'Vai trò (*)', key: 'role', width: 18 },
    { header: 'Đơn vị', key: 'department', width: 30 },
  ];
  dataSheet.getRow(1).font = { bold: true };
  dataSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  dataSheet.addRow({
    username: 'nguyenvana',
    email: 'nguyenvana@school.edu.vn',
    password: 'MậtKhau@123',
    fullname: 'Nguyễn Văn A',
    role: 'staff',
    department: 'Phòng Công nghệ thông tin',
  });

  const departments = await Department.findAll({ order: [['name', 'ASC']] });
  const roleFormula = '"admin,director,department_head,staff"';

  for (let row = 2; row <= 101; row++) {
    dataSheet.getCell(`E${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [roleFormula],
      showErrorMessage: true,
      errorTitle: 'Lỗi',
      error: 'Vui lòng chọn vai trò từ danh sách: admin, director, department_head, staff',
    };

    if (departments.length > 0) {
      dataSheet.getCell(`F${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`='Danh sách đơn vị'!$A$2:$A$${departments.length + 1}`],
        showErrorMessage: true,
        errorTitle: 'Lỗi',
        error: 'Vui lòng chọn đơn vị từ danh sách',
      };
    }
  }

  const guideSheet = workbook.addWorksheet('Hướng dẫn');
  guideSheet.columns = [{ header: 'Nội dung', key: 'content', width: 80 }];
  const guideLines = [
    'HƯỚNG DẪN IMPORT NGƯỜI DÙNG',
    '',
    'BẮT BUỘC (*):',
    '- Tên đăng nhập (*): 3–100 ký tự, chỉ chữ và số (a-z, 0-9), không trùng trong hệ thống',
    '- Email: Không bắt buộc. Nếu điền phải đúng định dạng email, không trùng trong hệ thống',
    '- Mật khẩu (*): Tối thiểu 8 ký tự, có chữ hoa, chữ thường và số. Để trống sẽ dùng mật khẩu mặc định (cấu hình trong hệ thống)',
    '- Vai trò (*): admin | director | department_head | staff',
    '',
    'KHÔNG BẮT BUỘC:',
    '- Họ tên: Tên hiển thị',
    '- Đơn vị: Tên phòng ban (phải khớp với danh sách đơn vị trong hệ thống)',
  ];
  guideLines.forEach((line) => guideSheet.addRow({ content: line }));
  guideSheet.getRow(1).font = { bold: true, size: 14 };

  const deptSheet = workbook.addWorksheet('Danh sách đơn vị');
  deptSheet.columns = [
    { header: 'Tên đơn vị', key: 'name', width: 40 },
  ];
  deptSheet.getRow(1).font = { bold: true };
  deptSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  departments.forEach((d) => deptSheet.addRow({ name: d.name }));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}

/** Import người dùng từ Excel (validateOnly = true: chỉ kiểm tra, không ghi DB) */
export async function importUsersFromExcel(
  fileBuffer: Buffer,
  options?: { validateOnly?: boolean }
): Promise<UserImportResult> {
  const validateOnly = options?.validateOnly === true;
  const result: UserImportResult = {
    success: true,
    total: 0,
    imported: 0,
    failed: 0,
    errors: [],
  };

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    const dataRows = rows.filter((row) => {
      const u = String(row['Tên đăng nhập (*)'] ?? row['Tên đăng nhập'] ?? '').trim();
      const e = String(row['Email (*)'] ?? row['Email'] ?? '').trim();
      return u || e;
    });

    result.total = dataRows.length;
    if (dataRows.length === 0) {
      result.success = false;
      result.errors.push({ row: 0, field: 'file', message: 'File không có dữ liệu hoặc định dạng không đúng' });
      return result;
    }

    const departments = await Department.findAll();
    const deptByName = new Map(departments.map((d) => [d.name.toLowerCase().trim(), d.id]));
    const existingUsernames = new Set((await User.findAll({ attributes: ['username'] })).map((u) => u.username.toLowerCase()));
    const existingEmails = new Set(
      (await User.findAll({ attributes: ['email'] }))
        .map((u) => u.email)
        .filter((e): e is string => !!e)
        .map((e) => e.toLowerCase().trim())
    );
    const fileUsernames = new Set<string>();
    const fileEmails = new Set<string>();

    const usernameRegex = /^[a-zA-Z0-9]{3,100}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordMinLen = 8;
    const passwordHasUpper = /[A-Z]/;
    const passwordHasLower = /[a-z]/;
    const passwordHasNumber = /\d/;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2;
      const username = String(row['Tên đăng nhập (*)'] ?? row['Tên đăng nhập'] ?? '').trim();
      const email = String(row['Email (*)'] ?? row['Email'] ?? '').trim().toLowerCase();
      const passwordRaw = row['Mật khẩu (*)'] ?? row['Mật khẩu'] ?? '';
      const password = typeof passwordRaw === 'string' ? passwordRaw.trim() : String(passwordRaw).trim();
      const fullname = String(row['Họ tên'] ?? '').trim() || undefined;
      const roleRaw = String(row['Vai trò (*)'] ?? row['Vai trò'] ?? '').trim().toLowerCase();
      const departmentName = String(row['Đơn vị'] ?? '').trim();

      const role = roleRaw === 'admin' || roleRaw === 'director' || roleRaw === 'department_head' || roleRaw === 'staff'
        ? roleRaw
        : (roleRaw ? null : null);

      const errors: string[] = [];

      if (!username) errors.push('Tên đăng nhập là bắt buộc');
      else if (!usernameRegex.test(username)) errors.push('Tên đăng nhập 3–100 ký tự, chỉ chữ và số');
      else if (existingUsernames.has(username.toLowerCase()) || fileUsernames.has(username.toLowerCase())) errors.push('Tên đăng nhập đã tồn tại (trong hệ thống hoặc trùng trong file)');

      if (email && !emailRegex.test(email)) errors.push('Email không đúng định dạng');
      else if (email && (existingEmails.has(email) || fileEmails.has(email))) errors.push('Email đã tồn tại (trong hệ thống hoặc trùng trong file)');

      if (!validateOnly && !password && password.length === 0) {
        // Cho phép để trống -> dùng mật khẩu mặc định
      } else if (password && password.length > 0) {
        if (password.length < passwordMinLen) errors.push('Mật khẩu tối thiểu 8 ký tự');
        else if (!passwordHasUpper.test(password) || !passwordHasLower.test(password) || !passwordHasNumber.test(password)) {
          errors.push('Mật khẩu cần có chữ hoa, chữ thường và số');
        }
      }

      if (role === null && roleRaw) errors.push(`Vai trò không hợp lệ. Chọn: ${ROLES.join(', ')}`);
      if (!role && !roleRaw) errors.push('Vai trò là bắt buộc');

      let department_id: number | undefined;
      if (departmentName) {
        const id = deptByName.get(departmentName.toLowerCase());
        if (id === undefined) errors.push(`Đơn vị "${departmentName}" không tồn tại trong hệ thống`);
        else department_id = id;
      }

      if (errors.length > 0) {
        result.errors.push(...errors.map((msg) => ({ row: rowNum, field: 'dữ liệu', message: msg })));
        result.failed++;
        continue;
      }

      if (validateOnly) {
        fileUsernames.add(username.toLowerCase());
        if (email) fileEmails.add(email);
        result.imported++;
        continue;
      }

      try {
        const finalPassword = password && password.length >= passwordMinLen ? password : DEFAULT_PASSWORD;
        const password_hash = await User.hashPassword(finalPassword);
        await User.create({
          username,
          email: email || null,
          password_hash,
          fullname: fullname || null,
          role: role!,
          department_id: department_id ?? null,
          is_active: true,
        });
        existingUsernames.add(username.toLowerCase());
        if (email) existingEmails.add(email);
        result.imported++;
      } catch (err: any) {
        result.errors.push({
          row: rowNum,
          field: 'database',
          message: err.message || 'Lỗi lưu vào database',
        });
        result.failed++;
      }
    }

    result.success = result.failed === 0;
  } catch (err: any) {
    result.success = false;
    result.errors.push({ row: 0, field: 'file', message: `Lỗi đọc file: ${err.message}` });
  }

  return result;
}
