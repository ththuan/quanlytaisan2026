import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface TableLayoutAttributes {
  id: number;
  table_key: string;
  columns: Record<string, number>;
  layout_version: number;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface TableLayoutCreationAttributes
  extends Optional<TableLayoutAttributes, 'id' | 'layout_version' | 'updated_by'> {}

class TableLayout
  extends Model<TableLayoutAttributes, TableLayoutCreationAttributes>
  implements TableLayoutAttributes
{
  public id!: number;
  public table_key!: string;
  public columns!: Record<string, number>;
  public layout_version!: number;
  public updated_by?: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TableLayout.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    table_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    columns: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    layout_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    tableName: 'table_layouts',
    timestamps: true,
    underscored: true,
  },
);

export default TableLayout;
