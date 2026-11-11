import { Request, Response } from 'express';
import Order from '../models/order';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientName, clientPhone, address, deliveryDate, quantityMembrillo, quantityBatata, latitude, longitude } = req.body;

    const newOrder = await Order.create({
      clientName,
      clientPhone,
      address,
      deliveryDate,
      quantityMembrillo,
      quantityBatata,
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error al crear el pedido',
      error: error.message,
    });
  }
};