import { DataTypes, Model } from 'sequelize'; 
import sequelize from '../database';          

class Order extends Model {
  declare id: number;                          
  declare clientName: string;                  // Nombre y apellido del cliente (obligatorio)
  declare clientPhone: string;                 
  declare address: string;                     
  declare latitude: number | null;             
  declare longitude: number | null;            
  declare quantityMembrillo: number;           // Cantidad de pastelitos de membrillo (con límite)
  declare quantityBatata: number;              // Cantidad de pastelitos de batata (con límite)
  declare deliveryDate: string;                // Fecha de entrega (desde hoy en adelante)
  declare status: string;                      // Estado actual del pedido
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
      allowNull: false,                        // Obligatorio: no se permite dejarlo vacío
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
      allowNull: true,                        // Latitud opcional
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,                        // Longitud opcional
    },
    quantityMembrillo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,                        // Por defecto arranca en 0
    },
    quantityBatata: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,                        // Por defecto arranca en 0
    },
    deliveryDate: {
      type: DataTypes.DATEONLY,               // Usar DATEONLY para guardar la fecha limpia sin horas raras
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