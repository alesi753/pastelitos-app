import type { Request, Response } from 'express';
import Order from '../models/order';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientName, clientPhone, address, deliveryDate, quantityMembrillo, quantityBatata, latitude, longitude } = req.body;

    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      // Estos rangos aproximan el área urbana donde se realizan las entregas.
      const isLatValid = latitude >= -38.85 && latitude <= -38.65;
      const isLonValid = longitude >= -62.40 && longitude <= -62.10;

      if (!isLatValid || !isLonValid) {
        res.status(400).json({
          success: false,
          message: 'La ubicación está fuera de Bahía Blanca. Solo realizamos entregas en la ciudad.',
        });
        return;
      }
    }

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

export const listOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al listar los pedidos',
      error: error.message,
    });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (typeof id !== 'string') {
      res.status(400).json({ success: false, message: 'Identificador de pedido inválido.' });
      return;
    }

    const order = await Order.findByPk(id);

    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al buscar el pedido', error: error.message });
  }
};