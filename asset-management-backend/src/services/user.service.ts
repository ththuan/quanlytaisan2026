import { User, Department } from '../models';
import { NotFoundError, ConflictError, ForbiddenError } from '../utils/errorHandler';
import { Op } from 'sequelize';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';

export interface CreateUserInput {
  username: string;
  email: string;
  password?: string; // Optional - will use default if not provided
  fullname?: string;
  role?: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  fullname?: string;
  role?: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
  is_active?: boolean;
}

// Default password for new users (configurable via env)
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'Ctec@123';

class UserService {
  async getAllUsers(query: any): Promise<PaginationResult<User>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    // Build where clause
    const where: any = {};

    if (query.search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
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

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email: data.email } });
    if (existingEmail) {
      throw new ConflictError('Email already exists');
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

    // Check if username is being changed and already exists
    if (data.username && data.username !== user.username) {
      const existingUsername = await User.findOne({ where: { username: data.username } });
      if (existingUsername) {
        throw new ConflictError('Username already exists');
      }
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== user.email) {
      const existingEmail = await User.findOne({ where: { email: data.email } });
      if (existingEmail) {
        throw new ConflictError('Email already exists');
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

    // Hard delete - Admin can delete users directly in the application
    await user.destroy();
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

    // Hash default password
    const password_hash = await User.hashPassword(DEFAULT_PASSWORD);

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
