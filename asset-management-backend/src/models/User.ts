import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import bcryptConfig from '../config/bcrypt';

export type UserRole = 'admin' | 'director' | 'department_head' | 'staff';

export interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password_hash: string | null;
  fullname?: string;
  role: UserRole;
  department_id?: number;
  is_active: boolean;
  last_login?: Date;
  totp_secret?: string | null;
  totp_enabled: boolean;
  google_id?: string | null;
  auth_provider: 'local' | 'google';
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'role'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password_hash!: string | null;
  public fullname?: string;
  public role!: UserRole;
  public department_id?: number;
  public is_active!: boolean;
  public last_login?: Date;
  public totp_secret!: string | null;
  public totp_enabled!: boolean;
  public google_id!: string | null;
  public auth_provider!: 'local' | 'google';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Method to compare password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  // Method to hash password
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, bcryptConfig.saltRounds);
  }

  // Remove sensitive data before sending to client
  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() } as any;
    delete values.password_hash;
    delete values.totp_secret; // Never expose the TOTP secret in API responses
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100],
        isAlphanumeric: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    auth_provider: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'local',
    },
    fullname: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'director', 'department_head', 'staff'),
      allowNull: false,
      defaultValue: 'staff',
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totp_secret: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    totp_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['username'],
      },
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['department_id'],
      },
    ],
  }
);

export default User;
