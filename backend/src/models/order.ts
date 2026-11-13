import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Order extends Model {
  declare id: number;
  declare clientName: string;
  declare clientPhone: string;
  declare address: string;
  declare latitude: number | null;
  declare longitude: number | null;
  declare quantityMembrillo: number;
  declare quantityBatata: number;
  declare deliveryDate: string;
  declare status: string;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    clientPhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    quantityMembrillo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantityBatata: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pendiente',
    },
  },
  {
    sequelize,
    tableName: 'orders',
  },
);

export default Order;