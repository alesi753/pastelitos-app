import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';

class Order extends Model {
    declare id: number
    declare clientName: string
    declare clientPhone: string
    declare address: string //direccion de entrega
    declare latitude: number
    declare longitude: number
    declare quantityMembrillo: number
    declare quantityBatata: number
    declare deliveryDate: string
    declare status: 'pendiente'| 'en_reparto' | 'entregado'| 'cancelado';

}
Order.init(
    {
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true, //que sea auto incremental (se suma solo 1, 2, 3...)
            primaryKey: true,
        },
        clientName:{
            type: DataTypes.STRING,
            allowNull: false, //obliga a que el campo no sea nulo
        },
        clientPhone:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        address:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        latitude:{
            type: DataTypes.FLOAT,
            allowNull: true, //Opcional (se completa cuando geolocalizamos con Leaflet)
        },
        longitude:{
            type: DataTypes.FLOAT,
            allowNull: true, //Opcional (se completa cuando geolocalizamos con Leaflet)
        },
        quantityMembrillo:{
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        quantityBatata:{
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        deliveryDate:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        status:{
            type: DataTypes.ENUM('pendiente','en_reparto','entregado','cancelado'), // Solo permite estos 4 valores exactos
            defaultValue: 'pendiente',
        },

    },
    {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
    }
);
export default Order;