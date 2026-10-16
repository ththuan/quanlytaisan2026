import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NotificationType =
  | 'transfer'
  | 'maintenance'
  | 'procurement'
  | 'inventory'
  | 'disposal'
  | 'report'
  | 'request'
  | 'system';

export interface NotificationAttributes {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  read_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  'id' | 'message' | 'link' | 'entity_type' | 'entity_id' | 'is_read' | 'read_at'
>;

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: number;
  public user_id!: number;
  public type!: NotificationType;
  public title!: string;
  public message!: string | null;
  public link!: string | null;
  public entity_type!: string | null;
  public entity_id!: number | null;
  public is_read!: boolean;
  public read_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      comment: 'Người nhận thông báo',
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'Loại thông báo: transfer/inventory/disposal/...',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Đường dẫn frontend để mở khi bấm vào thông báo',
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Loại đối tượng liên quan (asset_transfer, inventory_report, ...)',
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id', 'is_read'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Notification;
