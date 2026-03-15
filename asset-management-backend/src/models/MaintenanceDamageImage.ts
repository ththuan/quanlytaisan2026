import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { imageFileExists } from '../utils/fileStorage';

export interface MaintenanceDamageImageAttributes {
  id: number;
  maintenance_id: number;
  image_path: string;
  order_number: number;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  url?: string;
  file_exists?: boolean;
}

interface MaintenanceDamageImageCreationAttributes
  extends Optional<MaintenanceDamageImageAttributes, 'id' | 'order_number' | 'description' | 'created_at' | 'updated_at' | 'url' | 'file_exists'> {}

class MaintenanceDamageImage extends Model<MaintenanceDamageImageAttributes, MaintenanceDamageImageCreationAttributes>
  implements MaintenanceDamageImageAttributes {
  public id!: number;
  public maintenance_id!: number;
  public image_path!: string;
  public order_number!: number;
  public description?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  declare readonly url: string;
  declare readonly file_exists: boolean;
}

MaintenanceDamageImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    maintenance_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'maintenance_requests',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    image_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    order_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    url: {
      type: DataTypes.VIRTUAL,
      get() {
        const imgPath = this.getDataValue('image_path');
        if (!imgPath) return '';
        const clean = imgPath.startsWith('/') ? imgPath.substring(1) : imgPath;
        return `/storage/${clean}`;
      },
    },
    file_exists: {
      type: DataTypes.VIRTUAL,
      get() {
        const imgPath = this.getDataValue('image_path');
        return imgPath ? imageFileExists(imgPath) : false;
      },
    },
  },
  {
    sequelize,
    tableName: 'maintenance_damage_images',
    timestamps: true,
    underscored: true,
  }
);

export default MaintenanceDamageImage;
