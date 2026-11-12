import { Request, Response } from 'express';                   // Importa tipos de Express para request y response
import Order from '../models/order';                           // Importa el modelo Order de Sequelize

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientName, clientPhone, address, deliveryDate, quantityMembrillo, quantityBatata, latitude, longitude } = req.body;

    // Validación opcional: Si envían coordenadas, verificamos que estén en Bahía Blanca
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      // Rangos aproximados para el radio urbano de Bahía Blanca
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

    const newOrder = await Order.create({                    // Crea el pedido asegurando los campos correctos
      clientName,
      clientPhone,
      address,
      deliveryDate,
      quantityMembrillo,
      quantityBatata,
      latitude,
      longitude,
    });

    res.status(201).json({                                     // Responde con código 201 (Creado) y el pedido
      success: true,
      data: newOrder,
    });
  } catch (error: any) {
    res.status(400).json({                                     // Atrapa errores de validación y responde 400
      success: false,
      message: 'Error al crear el pedido',
      error: error.message,
    });
  }
};

// Obtiene la lista de todos los pedidos registrados
export const listOrders = async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] }); // Busca todos ordenados del más nuevo al más viejo
    res.json({
      success: true,
      count: orders.length,
      data: orders,                                                          // Devuelve la lista y la cantidad total
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error al listar los pedidos',
      error: error.message,
    });
  }
};

// Actualiza el estado de un pedido buscando por su ID
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;                                               // Extrae el ID de la URL
    const { status } = req.body;                                             // Extrae el nuevo estado del body

    const order = await Order.findByPk(id);                                  // Busca el pedido por clave primaria
    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' }); // Retorna 404 si no existe
      return;
    }

    order.status = status;                                                   // Cambia el estado en la instancia
    await order.save();                                                      // Guarda los cambios en la base de datos

    res.json({
      success: true,
      data: order,                                                           // Devuelve el pedido ya actualizado
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el estado',
      error: error.message,
    });
  }
};
// Busca un pedido específico por su ID
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;                                               // Extrae el ID de la URL
    const order = await Order.findByPk(id);                                  // Busca el pedido en la base de datos

    if (!order) {
      res.status(404).json({ success: false, message: 'Pedido no encontrado' }); // Si no existe, devuelve 404
      return;
    }

    res.json({ success: true, data: order });                                // Devuelve el pedido encontrado
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error al buscar el pedido', error: error.message });
  }
};