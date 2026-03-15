import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StockIssueLineAttributes {
  id: number;
  issue_id: number;
  item_id: number;
  quantity: number;
  created_at?: Date;
  updated_at?: Date;
}

interface StockIssueLineCreationAttributes extends Optional<StockIssueLineAttributes, 'id'> {}

class StockIssueLine extends Model<StockIssueLineAttributes, StockIssueLineCreationAttributes> implements StockIssueLineAttributes {
  public id!: number;
  public issue_id!: number;
  public item_id!: number;
  public quantity!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

StockIssueLine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    issue_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'stock_issue_lines',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['issue_id'] }, { fields: ['item_id'] }],
  }
);

export default StockIssueLine;
