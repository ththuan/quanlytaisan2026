import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuthSessionAttributes {
  id: string;
  user_id: number;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at?: Date | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

type AuthSessionCreationAttributes = Optional<AuthSessionAttributes, 'revoked_at' | 'ip_address' | 'user_agent'>;

class AuthSession extends Model<AuthSessionAttributes, AuthSessionCreationAttributes> implements AuthSessionAttributes {
  public id!: string;
  public user_id!: number;
  public refresh_token_hash!: string;
  public expires_at!: Date;
  public revoked_at!: Date | null;
  public ip_address!: string | null;
  public user_agent!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AuthSession.init({
  id: { type: DataTypes.UUID, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  refresh_token_hash: { type: DataTypes.STRING(64), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: { type: DataTypes.DATE, allowNull: true },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },
}, {
  sequelize,
  tableName: 'auth_sessions',
  timestamps: true,
  underscored: true,
  indexes: [{ fields: ['user_id'] }, { fields: ['expires_at'] }],
});

export default AuthSession;
