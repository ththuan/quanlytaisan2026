import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type SignatureEntityType = 'inventory_report' | 'asset_disposal_case' | 'asset_transfer';
export type SignatureAction = 'submit' | 'approve' | 'reject' | 'create' | 'complete';

export interface SignatureAttributes {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  signer_id: number;
  signer_name: string;
  signer_role?: string | null;
  signature_image: string;
  ip_address?: string | null;
  user_agent?: string | null;
  signed_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

type SignatureCreationAttributes = Optional<
  SignatureAttributes,
  'id' | 'signer_role' | 'ip_address' | 'user_agent' | 'signed_at'
>;

class Signature
  extends Model<SignatureAttributes, SignatureCreationAttributes>
  implements SignatureAttributes
{
  public id!: number;
  public entity_type!: string;
  public entity_id!: number;
  public action!: string;
  public signer_id!: number;
  public signer_name!: string;
  public signer_role!: string | null;
  public signature_image!: string;
  public ip_address!: string | null;
  public user_agent!: string | null;
  public signed_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Signature.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    entity_type: { type: DataTypes.STRING(50), allowNull: false },
    entity_id: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING(30), allowNull: false },
    signer_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    signer_name: { type: DataTypes.STRING(255), allowNull: false },
    signer_role: { type: DataTypes.STRING(30), allowNull: true },
    signature_image: { type: DataTypes.TEXT, allowNull: false },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
    signed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'signatures',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['signer_id'] },
    ],
  }
);

export default Signature;
