import { DataTypes, Model } from 'sequelize';
import sequelize from '../database';
import nodeCrypto = require('node:crypto');

export class order extends model {
    public id!: Number
    public clientName!: string
    public clientPhone!: string
    public address!: string
    public latitude!: number
    public longitude!: number
    public quantityMembrillo!: number
    public quantitiyBatata!: number
    public deliveryDate!: number
    public status!: 'Pendiente'| 'en_reparto' | 'entregado'|'Cancelado';

}
order.init(
    {}
)