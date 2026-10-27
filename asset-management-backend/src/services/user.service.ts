import { User, Department, InventoryReport, InventoryRound } from '../models';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errorHandler';
import { Op } from 'sequelize';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import { SYSTEM_ADMIN_USERNAME, SYSTEM_ADMIN_PASSWORD } from '../config/adminCredentials';

export interface CreateUserInput {
  username: string;
  password?: string; // Optional - will use default if not provided
  fullname?: string;
  job_title?: string;
  role?: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
}

export interface UpdateUserInput {
  username?: string;
  fullname?: string;
  job_title?: string;
  role?: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
  is_active?: boolean;
}

// Default password for new users (configurable via env)
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'Ctec@123';

// Production: cấm dùng mật khẩu mặc định dễ đoán
if (process.env.NODE_ENV === 'production' && DEFAULT_PASSWORD === 'Ctec@123') {
  throw new Error(
    '⚠️  DEFAULT_PASSWORD phải được đặt (mật khẩu mạnh) trong môi trường production. ' +
    'Không dùng mật khẩu mặc định Ctec@123.'
  );
}

class UserService {
  async getAllUsers(query: any): Promise<PaginationResult<User>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    // Build where clause
    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${query.search}%` } },
        { fullname: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.department_id) {
      where.department_id = query.department_id;
    }

    if (query.is_active !== undefined) {
      where.is_active = query.is_active === 'true';
    }

    // Fetch users
    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'type'],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getUserById(id: number): Promise<User> {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'type'],
        },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async createUser(data: CreateUserInput): Promise<User> {
    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username: data.username } });
    if (existingUsername) {
      throw new ConflictError('Username already exists');
    }

    // Use default password if not provided
    const password = data.password || DEFAULT_PASSWORD;
    
    // Hash password
    const password_hash = await User.hashPassword(password);

    // Create user
    const user = await User.create({
      ...data,
      password_hash,
      role: data.role || 'staff',
      is_active: true,
    });

    return this.getUserById(user.id);
  }

  async updateUser(id: number, data: UpdateUserInput, _requestingUserId: number): Promise<User> {
    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // ─── Chặn đổi phòng ban khi còn báo cáo kiểm kê chưa hoàn tất ─────────────
    // Tránh tình trạng báo cáo bị "treo" ở đơn vị cũ sau khi chuyển người.
    if (data.department_id !== undefined && data.department_id !== user.department_id) {
      const activeRounds = await InventoryRound.findAll({
        where: { status: { [Op.in]: ['in_progress', 'awaiting_approval'] } },
        attributes: ['id', 'round_name'],
      });

      if (activeRounds.length > 0) {
        const roundIds = activeRounds.map((r) => r.id);

        const ownUnfinished = await InventoryReport.findOne({
          where: {
            created_by: id,
            inventory_round_id: { [Op.in]: roundIds },
            status: { [Op.ne]: 'completed' },
          },
          attributes: ['id', 'report_code'],
        });
        if (ownUnfinished) {
          throw new ConflictError(
            `Không thể đổi phòng ban: người dùng đang có báo cáo kiểm kê chưa hoàn tất (${ownUnfinished.report_code}) trong đợt đang diễn ra. ` +
            'Vui lòng hoàn tất hoặc từ chối báo cáo trước khi chuyển đơn vị.'
          );
        }

        if (user.role === 'department_head' && user.department_id) {
          const pendingForHead = await InventoryReport.findOne({
            where: {
              department_id: user.department_id,
              inventory_round_id: { [Op.in]: roundIds },
              status: 'pending',
            },
            attributes: ['id', 'report_code'],
          });
          if (pendingForHead) {
            throw new ConflictError(
              `Không thể đổi phòng ban: đang có báo cáo kiểm kê chờ Trưởng đơn vị duyệt (${pendingForHead.report_code}) tại đơn vị cũ. ` +
              'Vui lòng duyệt/từ chối báo cáo trước khi chuyển đơn vị.'
            );
          }
        }
      }
    }
    // ───────────────────────────────────────────────────────────────────────────

    // Check if username is being changed and already exists
    if (data.username && data.username !== user.username) {
      const existingUsername = await User.findOne({ where: { username: data.username } });
      if (existingUsername) {
        throw new ConflictError('Username already exists');
      }
    }

    // Update user
    await user.update(data);

    return this.getUserById(id);
  }

  async deleteUser(id: number, _requestingUserId: number): Promise<void> {
    // Prevent self-deletion
    if (id === _requestingUserId) {
      throw new ForbiddenError('You cannot delete your own account');
    }

    const user = await User.findByPk(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    try {
      // Hard delete - Admin can delete users directly in the application
      await user.destroy();
    } catch (err: any) {
      if (err.name === 'SequelizeForeignKeyConstraintError' || err.message?.includes('foreign key')) {
        throw new ConflictError(
          'Không thể xóa: người dùng này vẫn được tham chiếu trong lịch sử (nhật ký hoạt động, phiếu điều chuyển, sửa chữa...). Hãy dùng chức năng "Vô hiệu hóa" thay vì xóa.'
        );
      }
      throw err;
    }
  }

  /**
   * Reset user password to default password (Ctec@123)
   * Only Admin can reset passwords
   */
  async resetPasswordToDefault(userId: number): Promise<User> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Tài khoản admin hệ thống luôn quay về mật khẩu cố định Admin@123.
    const password = user.username === SYSTEM_ADMIN_USERNAME ? SYSTEM_ADMIN_PASSWORD : DEFAULT_PASSWORD;
    const password_hash = await User.hashPassword(password);

    // Update password
    await user.update({ password_hash });

    return this.getUserById(user.id);
  }

  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    const users = await User.findAll({
      where: { department_id: departmentId, is_active: true },
      attributes: { exclude: ['password_hash'] },
    });

    return users;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const users = await User.findAll({
      where: { role, is_active: true },
      attributes: { exclude: ['password_hash'] },
    });

    return users;
  }
}

export default new UserService();
