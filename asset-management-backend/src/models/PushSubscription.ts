import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PushSubscriptionAttributes {
  id: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface PushSubscriptionCreationAttributes
  extends Optional<PushSubscriptionAttributes, 'id' | 'user_agent'> {}

class PushSubscription
  extends Model<PushSubscriptionAttributes, PushSubscriptionCreationAttributes>
  implements PushSubscriptionAttributes {
  public id!: number;
  public user_id!: number;
  public endpoint!: string;
  public p256dh!: string;
  public auth!: string;
  public user_agent?: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PushSubscription.init(
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
      onDelete: 'CASCADE',
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    p256dh: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    auth: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'push_subscriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['endpoint'], name: 'push_subscriptions_endpoint_unique' },
      { fields: ['user_id'] },
    ],
  }
);

export default PushSubscription;
