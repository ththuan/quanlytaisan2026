import { Op } from 'sequelize';
import { AssetTransfer, Asset, Department, User, RequestApproval } from '../models';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errorHandler';
import { getPaginationParams, buildPaginationResult, getOffset, PaginationResult } from '../utils/pagination';
import sequelize from '../config/database';
import { UserRole } from '../models/User';
import notificationService from './notification.service';

export interface CreateTransferInput {
  asset_id: number;
  from_department_id?: number;
  to_department_id: number;
  reason?: string;
  notes?: string;
}

export interface UpdateTransferInput {
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'approved_by_head' | 'approved_by_destination' | 'rejected_by_head';
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
    const fromDepartment = fromDepartmentId
      ? await Department.findByPk(fromDepartmentId, { attributes: ['id', 'campus'] })
      : null;
    const fromCampus = (fromDepartment as any)?.campus || (asset as any).campus || 'main';
    const toCampus = (toDepartment as any).campus || 'main';

    // Only allow creating transfer from requester's own department (except admin/director)
    if (requester.role !== 'admin') {
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

    const activeTransfer = await AssetTransfer.findOne({
      where: {
        asset_id: data.asset_id,
        status: { [Op.in]: ['pending', 'approved_by_head'] },
      },
    });
    if (activeTransfer) {
      throw new ConflictError('Tài sản đang có một đề nghị điều chuyển chờ phê duyệt');
    }

    // Create transfer request
    const transfer = await AssetTransfer.create({
      asset_id: data.asset_id,
      from_department_id: fromDepartmentId,
      to_department_id: data.to_department_id,
      from_campus: fromCampus,
      to_campus: toCampus,
      requested_by: requester.id,
      reason: data.reason,
      notes: data.notes,
      status: 'pending',
    });

    // Thông báo cho đơn vị nhận (viên chức/trưởng đơn vị) để ký xác nhận
    try {
      const receiverIds = await notificationService.getUserIdsByDepartmentRoles(
        data.to_department_id,
        ['department_head', 'staff'],
      );
      await notificationService.notify({
        userIds: receiverIds,
        type: 'transfer',
        title: 'Yêu cầu điều chuyển chờ đơn vị nhận ký',
        message: `Điều chuyển tài sản ${asset.asset_code} - ${asset.name} đến ${toDepartment.name}, chờ viên chức/Trưởng đơn vị nơi nhận ký số.`,
        link: '/transfers',
        entityType: 'asset_transfer',
        entityId: transfer.id,
        excludeUserId: requester.id,
      });
    } catch { /* bỏ qua lỗi thông báo */ }

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
            campus: (toDepartment as any)?.campus || (transfer as any).to_campus || 'main',
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

    if (!['pending', 'approved_by_head'].includes(transfer.status)) {
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

    if (!['pending', 'approved_by_head', 'approved_by_destination'].includes(transfer.status)) {
      throw new ConflictError('Chỉ có thể duyệt yêu cầu đang chờ xử lý');
    }

    const { decision, reason, notes } = input;

    // Validate rejection reason
    if (decision === 'rejected' && !reason) {
      throw new ConflictError('Lý do từ chối là bắt buộc');
    }

    const approverDept = Number(approver.department_id);
    const isAdmin = approver.role === 'admin';
    const receiverRoles = ['staff', 'department_head'];

    // Luồng ký: người tạo gửi → đơn vị nhận (viên chức hoặc trưởng đơn vị) → quản trị viên.
    // Không cần Trưởng đơn vị nơi giao duyệt.
    if (isAdmin) {
      if (transfer.status !== 'approved_by_destination') {
        throw new ForbiddenError('Quản trị viên chỉ ký duyệt sau khi đơn vị nhận đã ký');
      }
    } else if (transfer.status === 'pending' || transfer.status === 'approved_by_head') {
      if (!receiverRoles.includes(approver.role) || approverDept !== Number(transfer.to_department_id)) {
        throw new ForbiddenError('Chỉ viên chức hoặc Trưởng đơn vị nơi nhận được ký bước này');
      }
    } else {
      throw new ForbiddenError('Bạn không có quyền duyệt yêu cầu điều chuyển');
    }

    const previousStatus = transfer.status;
    const approvalLevel = previousStatus === 'approved_by_destination' ? 3 : 2;

    const transaction = await sequelize.transaction();
    const now = new Date();

    try {
      // Save approval to audit trail
      await RequestApproval.create({
        entity_type: 'asset_transfer',
        entity_id: id,
        approver_id: approver.id,
        approver_role: approver.role,
        approver_name: approver.fullname,
        decision: decision,
        reason: reason,
        notes: notes,
        approval_level: approvalLevel,
        decided_at: now,
      }, { transaction });

      if (decision === 'approved') {
        if (previousStatus === 'pending' || previousStatus === 'approved_by_head') {
          // Đơn vị nhận ký, chờ quản trị viên ký duyệt cuối.
          await transfer.update({
            status: 'approved_by_destination',
            notes: notes || transfer.notes,
          }, { transaction });
        } else {
          // Quản trị viên ký duyệt cuối và chuyển tài sản.
          const asset = await Asset.findByPk(transfer.asset_id);
          if (asset) {
            if (asset.current_department_id !== transfer.from_department_id) {
              throw new ConflictError('Tài sản không còn thuộc đơn vị giao ban đầu');
            }
            const toDepartment = (transfer as any).to_department;
            await asset.update({
              current_department_id: transfer.to_department_id,
              campus: (toDepartment as any)?.campus || (transfer as any).to_campus || 'main',
              location: toDepartment ? toDepartment.name : null,
            }, { transaction });
          }

          await transfer.update({
            status: 'completed',
            approved_by: approver.id,
            notes: notes || transfer.notes,
          }, { transaction });
        }
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

      // Thông báo theo bước duyệt (không nằm trong transaction)
      try {
        const requesterIds = transfer.requested_by ? [transfer.requested_by] : [];
        if (decision === 'approved' && transfer.status === 'approved_by_destination') {
          const adminIds = await notificationService.getAdminIds();
          await notificationService.notify({
            userIds: adminIds,
            type: 'transfer',
            title: 'Yêu cầu điều chuyển chờ quản trị viên ký',
            message: `Yêu cầu điều chuyển #${id} đã được đơn vị nhận ký, chờ quản trị viên ký duyệt cuối.`,
            link: '/transfers',
            entityType: 'asset_transfer',
            entityId: id,
            excludeUserId: approver.id,
          });
        } else if (decision === 'approved' && String(transfer.status) === 'completed') {
          await notificationService.notify({
            userIds: requesterIds,
            type: 'transfer',
            title: 'Yêu cầu điều chuyển đã hoàn tất',
            message: `Yêu cầu điều chuyển #${id} đã hoàn tất.`,
            link: '/transfers',
            entityType: 'asset_transfer',
            entityId: id,
            excludeUserId: approver.id,
          });
        } else if (decision === 'rejected') {
          await notificationService.notify({
            userIds: requesterIds,
            type: 'transfer',
            title: 'Yêu cầu điều chuyển bị từ chối',
            message: `Yêu cầu điều chuyển #${id} bị từ chối.${reason ? ` Lý do: ${reason}` : ''}`,
            link: '/transfers',
            entityType: 'asset_transfer',
            entityId: id,
            excludeUserId: approver.id,
          });
        }
      } catch { /* bỏ qua lỗi thông báo */ }

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
      // Viên chức thấy đề nghị của mình và đề nghị gửi đến đơn vị mình (để ký bước đơn vị nhận).
      where[Op.or] = [
        { requested_by: user.id },
        { to_department_id: user.department_id },
      ];
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
          attributes: ['id', 'username', 'fullname', 'role'],
        },
      ],
      order: [['decided_at', 'ASC']],
    });

    return approvals;
  }
}

export default new TransferService();
