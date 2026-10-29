import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';
import bcryptConfig from '../config/bcrypt';

export type UserRole = 'admin' | 'director' | 'department_head' | 'staff';

export interface UserAttributes {
  id: number;
  username: string;
  password_hash: string | null;
  fullname?: string;
  job_title?: string;
  role: UserRole;
  department_id?: number;
  is_active: boolean;
  last_login?: Date;
  totp_secret?: string | null;
  totp_enabled: boolean;
  last_totp_step?: number | null;
  failed_login_attempts: number;
  locked_until?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'is_active' | 'role'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password_hash!: string | null;
  public fullname?: string;
  public job_title?: string;
  public role!: UserRole;
  public department_id?: number;
  public is_active!: boolean;
  public last_login?: Date;
  public totp_secret!: string | null;
  public totp_enabled!: boolean;
  public last_totp_step!: number | null;
  public failed_login_attempts!: number;
  public locked_until!: Date | null;
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
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fullname: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    job_title: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: 'Chức danh (Trưởng phòng, Giảng viên, Nhân viên...)',
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
    last_totp_step: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
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
        fields: ['department_id'],
      },
    ],
  }
);

export default User;
