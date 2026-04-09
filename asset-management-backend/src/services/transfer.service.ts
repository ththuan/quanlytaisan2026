import { Op } from 'sequelize';
import { AssetTransfer, Asset, Department, User, RequestApproval } from '../models';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import sequelize from '../config/database';
import { UserRole } from '../models/User';

export interface CreateTransferInput {
  asset_id: number;
  from_department_id?: number;
  to_department_id: number;
  reason?: string;
  notes?: string;
}

export interface UpdateTransferInput {
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'approved_by_head' | 'rejected_by_head';
  notes?: string;
}

export interface TransferApprovalInput {
  decision: 'approved' | 'rejected';
  reason?: string;
  notes?: string;
}

export interface ApproverInfo {
  id: number;
  role: UserRole;
  fullname?: string;
  email?: string;
  department_id?: number;
}

class TransferService {
  async getAllTransfers(query: any): Promise<PaginationResult<AssetTransfer>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.asset_id) {
      where.asset_id = query.asset_id;
    }

    if (query.from_department_id) {
      where.from_department_id = query.from_department_id;
    }

    if (query.to_department_id) {
      where.to_department_id = query.to_department_id;
    }

    const { count, rows } = await AssetTransfer.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'asset_code', 'name', 'status'],
        },
        {
          model: Department,
          as: 'from_department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: Department,
          as: 'to_department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  async getTransferById(id: number): Promise<AssetTransfer> {
    const transfer = await AssetTransfer.findByPk(id, {
      include: [
        {
          model: Asset,
          as: 'asset',
        },
        {
          model: Department,
          as: 'from_department',
        },
        {
          model: Department,
          as: 'to_department',
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
        },
      ],
    });

    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    return transfer;
  }

  async createTransfer(data: CreateTransferInput, requester: ApproverInfo): Promise<AssetTransfer> {
    const asset = await Asset.findByPk(data.asset_id);

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Check if destination department exists
    const toDepartment = await Department.findByPk(data.to_department_id);
    if (!toDepartment) {
      throw new NotFoundError('Destination department not found');
    }

    // Set from_department_id from asset's current department if not provided
    const fromDepartmentId = data.from_department_id || asset.current_department_id;

    // Only allow creating transfer from requester's own department (except admin/director)
    if (requester.role !== 'admin' && requester.role !== 'director') {
      if (!requester.department_id) {
        throw new ForbiddenError('Bạn chưa được gán phòng ban, không thể tạo điều chuyển');
      }
      if (fromDepartmentId !== requester.department_id) {
        throw new ForbiddenError('Bạn chỉ có thể tạo điều chuyển từ phòng ban của mình');
      }
    }

    // Check if asset is already in destination department
    if (fromDepartmentId === data.to_department_id) {
      throw new ConflictError('Asset is already in the destination department');
    }

    // Create transfer request
    const transfer = await AssetTransfer.create({
      asset_id: data.asset_id,
      from_department_id: fromDepartmentId,
      to_department_id: data.to_department_id,
      requested_by: requester.id,
      reason: data.reason,
      notes: data.notes,
      status: 'pending',
    });

    return this.getTransferById(transfer.id);
  }

  async approveTransfer(id: number, approvedBy: number): Promise<AssetTransfer> {
    const transaction = await sequelize.transaction();

    try {
      const transfer = await AssetTransfer.findByPk(id, {
        include: [
          {
            model: Department,
            as: 'to_department',
            attributes: ['id', 'name'],
          },
        ],
      });

      if (!transfer) {
        throw new NotFoundError('Transfer not found');
      }

      if (transfer.status !== 'pending') {
        throw new ConflictError('Only pending transfers can be approved');
      }

      // Update transfer status
      await transfer.update(
        {
          status: 'approved',
          approved_by: approvedBy,
        },
        { transaction }
      );

      // Update asset's department and location
      const asset = await Asset.findByPk(transfer.asset_id);
      if (asset) {
        const toDepartment = (transfer as any).to_department;
        const newLocation = toDepartment ? toDepartment.name : null;
        
        await asset.update(
          {
            current_department_id: transfer.to_department_id,
            location: newLocation, // Cập nhật vị trí theo phòng ban mới
          },
          { transaction }
        );
      }

      // Mark as completed
      await transfer.update({ status: 'completed' }, { transaction });

      await transaction.commit();

      return this.getTransferById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rejectTransfer(id: number, approvedBy: number, notes?: string): Promise<AssetTransfer> {
    const transfer = await AssetTransfer.findByPk(id);

    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new ConflictError('Only pending transfers can be rejected');
    }

    await transfer.update({
      status: 'rejected',
      approved_by: approvedBy,
      notes: notes || transfer.notes,
    });

    return this.getTransferById(id);
  }

  async getTransferHistory(assetId: number): Promise<AssetTransfer[]> {
    const transfers = await AssetTransfer.findAll({
      where: { asset_id: assetId },
      order: [['transfer_date', 'DESC']],
      include: [
        {
          model: Department,
          as: 'from_department',
          attributes: ['id', 'name'],
        },
        {
          model: Department,
          as: 'to_department',
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
        },
      ],
    });

    return transfers;
  }

  /**
   * Process transfer approval by department head
   * Only department head of the source department can approve transfers
   */
  async processTransferApproval(
    id: number,
    approver: ApproverInfo,
    input: TransferApprovalInput
  ): Promise<AssetTransfer> {
    const transfer = await AssetTransfer.findByPk(id, {
      include: [
        {
          model: Department,
          as: 'to_department',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    if (transfer.status !== 'pending') {
      throw new ConflictError('Chỉ có thể duyệt yêu cầu đang chờ xử lý');
    }

    const { decision, reason, notes } = input;

    // Validate rejection reason
    if (decision === 'rejected' && !reason) {
      throw new ConflictError('Lý do từ chối là bắt buộc');
    }

    // Check if approver is department head of source department (or admin)
    if (approver.role !== 'admin') {
      if (approver.role !== 'department_head') {
        throw new ForbiddenError('Bạn không có quyền duyệt yêu cầu điều chuyển');
      }

      if (approver.department_id !== transfer.from_department_id) {
        throw new ForbiddenError('Bạn chỉ có thể duyệt yêu cầu điều chuyển từ phòng ban của mình');
      }
    }

    const transaction = await sequelize.transaction();
    const now = new Date();

    try {
      // Save approval to audit trail
      await RequestApproval.create({
        entity_type: 'asset_transfer',
        entity_id: id,
        approver_id: approver.id,
        approver_role: approver.role === 'admin' ? 'admin' : 'department_head',
        approver_name: approver.fullname,
        approver_email: approver.email,
        decision: decision,
        reason: reason,
        notes: notes,
        approval_level: 1,
        decided_at: now,
      }, { transaction });

      if (decision === 'approved') {
        // Update transfer status
        await transfer.update(
          {
            status: 'approved_by_head',
            approved_by: approver.id,
            head_approved_by: approver.id,
            head_approved_at: now,
            head_notes: notes,
          },
          { transaction }
        );

        // Update asset's department
        const asset = await Asset.findByPk(transfer.asset_id);
        if (asset) {
          const toDepartment = (transfer as any).to_department;
          const newLocation = toDepartment ? toDepartment.name : null;

          await asset.update(
            {
              current_department_id: transfer.to_department_id,
              location: newLocation,
            },
            { transaction }
          );
        }

        // Mark as completed
        await transfer.update({ status: 'completed' }, { transaction });
      } else {
        // Rejected
        await transfer.update(
          {
            status: 'rejected_by_head',
            approved_by: approver.id,
            notes: reason,
            rejection_reason: reason,
          },
          { transaction }
        );
      }

      await transaction.commit();
      return this.getTransferById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get transfers filtered by user role and department
   */
  async getTransfersByRole(
    query: any,
    user: ApproverInfo
  ): Promise<PaginationResult<AssetTransfer>> {
    const { page, limit, sortBy, sortOrder } = getPaginationParams(query);
    const offset = getOffset(page, limit);

    const where: any = {};

    // Apply role-based filtering
    if (user.role === 'admin' || user.role === 'director') {
      // Admin and Director can see all transfers
    } else if (user.role === 'department_head') {
      // Department head can see transfers from/to their department
      where[Op.or] = [
        { from_department_id: user.department_id },
        { to_department_id: user.department_id },
      ];
    } else if (user.role === 'staff') {
      // Staff can only see their own requests
      where.requested_by = user.id;
    }

    // Apply additional filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.asset_id) {
      where.asset_id = query.asset_id;
    }

    if (query.from_department_id) {
      where.from_department_id = query.from_department_id;
    }

    if (query.to_department_id) {
      where.to_department_id = query.to_department_id;
    }

    const assetWhere: any = {};
    if (query.search) {
      assetWhere[Op.or] = [
        { asset_code: { [Op.iLike]: `%${query.search}%` } },
        { name: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await AssetTransfer.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'asset_code', 'name', 'status'],
          where: Object.keys(assetWhere).length ? assetWhere : undefined,
          required: Object.keys(assetWhere).length > 0,
        },
        {
          model: Department,
          as: 'from_department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: Department,
          as: 'to_department',
          attributes: ['id', 'name', 'type'],
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'fullname'],
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname'],
        },
      ],
    });

    return buildPaginationResult(rows, count, page, limit);
  }

  /**
   * Get transfer approval history (audit trail)
   */
  async getTransferApprovalHistory(id: number): Promise<RequestApproval[]> {
    const transfer = await AssetTransfer.findByPk(id);

    if (!transfer) {
      throw new NotFoundError('Transfer not found');
    }

    const approvals = await RequestApproval.findAll({
      where: {
        entity_type: 'asset_transfer',
        entity_id: id,
      },
      include: [
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'username', 'fullname', 'email', 'role'],
        },
      ],
      order: [['decided_at', 'ASC']],
    });

    return approvals;
  }
}

export default new TransferService();
