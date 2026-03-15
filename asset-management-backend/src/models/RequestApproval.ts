import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ApprovalEntityType = 'maintenance_request' | 'asset_transfer';
export type ApprovalDecision = 'approved' | 'rejected';
export type ApproverRole = 'department_head' | 'admin' | 'director';

export interface RequestApprovalAttributes {
  id: number;
  entity_type: ApprovalEntityType;
  entity_id: number;
  approver_id: number;
  approver_role: ApproverRole;
  approver_name?: string;
  approver_email?: string;
  decision: ApprovalDecision;
  reason?: string;
  notes?: string;
  approval_level: number;
  decided_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface RequestApprovalCreationAttributes extends Optional<RequestApprovalAttributes, 'id' | 'decided_at'> {}

class RequestApproval extends Model<RequestApprovalAttributes, RequestApprovalCreationAttributes> implements RequestApprovalAttributes {
  public id!: number;
  public entity_type!: ApprovalEntityType;
  public entity_id!: number;
  public approver_id!: number;
  public approver_role!: ApproverRole;
  public approver_name?: string;
  public approver_email?: string;
  public decision!: ApprovalDecision;
  public reason?: string;
  public notes?: string;
  public approval_level!: number;
  public decided_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RequestApproval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entity_type: {
      type: DataTypes.ENUM('maintenance_request', 'asset_transfer'),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID of the maintenance_request or asset_transfer',
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approver_role: {
      type: DataTypes.ENUM('department_head', 'admin', 'director'),
      allowNull: false,
    },
    approver_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    approver_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    decision: {
      type: DataTypes.ENUM('approved', 'rejected'),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for rejection (required if rejected)',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes',
    },
    approval_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '1=Head, 2=Admin, 3=Director',
    },
    decided_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'request_approvals',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['entity_type', 'entity_id'],
      },
      {
        fields: ['approver_id'],
      },
      {
        fields: ['decided_at'],
      },
    ],
  }
);

export default RequestApproval;
