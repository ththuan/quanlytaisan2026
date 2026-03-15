import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProcurementDocumentAttributes {
  id: number;
  procurement_id: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  content: Buffer;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ProcurementDocumentCreationAttributes extends Optional<ProcurementDocumentAttributes, 'id'> {}

class ProcurementDocument
  extends Model<ProcurementDocumentAttributes, ProcurementDocumentCreationAttributes>
  implements ProcurementDocumentAttributes
{
  public id!: number;
  public procurement_id!: number;
  public file_name!: string;
  public mime_type!: string;
  public size_bytes!: number;
  public content!: Buffer;
  public created_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProcurementDocument.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    procurement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'procurements',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'application/pdf',
    },
    size_bytes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    content: {
      type: DataTypes.BLOB('long'),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'procurement_documents',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['procurement_id'] }],
  }
);

export default ProcurementDocument;
