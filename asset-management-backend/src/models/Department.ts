import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DepartmentAttributes {
  id: number;
  name: string;
  type?: string;
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: number;
  public name!: string;
  public type?: string;
  public parent_department_id?: number;
  public manager_id?: number;
  public description?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,  // Đổi sang STRING để linh hoạt hơn
      allowNull: true,
    },
    parent_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'departments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['parent_department_id'],
      },
      {
        fields: ['manager_id'],
      },
    ],
  }
);

export default Department;
