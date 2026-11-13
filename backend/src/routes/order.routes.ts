import { Router } from 'express';
import Order from '../models/order';
import { login } from '../controllers/auth.controller';
import { verifyAdmin } from '../middlewares/auth.middleware';
import { GeoapifyError, optimizeDeliveryRoute } from '../services/geoapify.service';

const router = Router();

router.post('/login', login);

router.get('/', verifyAdmin, async (_req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      clientName,
      clientPhone,
      address,
      latitude,
      longitude,
      quantityMembrillo,
      quantityBatata,
      deliveryDate,
    } = req.body;
    if (
      typeof address !== 'string'
      || address.trim().length < 3
      || typeof latitude !== 'number'
      || !Number.isFinite(latitude)
      || latitude < -90
      || latitude > 90
      || typeof longitude !== 'number'
      || !Number.isFinite(longitude)
      || longitude < -180
      || longitude > 180
    ) {
      res.status(400).json({ message: 'Seleccioná una dirección válida de las sugerencias.' });
      return;
    }

    const newOrder = await Order.create({
      clientName,
      clientPhone,
      address: address.trim(),
      latitude,
      longitude,
      quantityMembrillo,
      quantityBatata,
      deliveryDate,
    });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el pedido' });
  }
});

router.post('/optimize-route', verifyAdmin, async (req, res) => {
  const { deliveryDate, origin, excludedOrderIds } = req.body as {
    deliveryDate?: unknown;
    origin?: { latitude?: unknown; longitude?: unknown; address?: unknown };
    excludedOrderIds?: unknown;
  };
  if (typeof deliveryDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
    res.status(400).json({ message: 'Seleccioná una fecha de entrega válida.' });
    return;
  }
  if (
    !origin
    || typeof origin.latitude !== 'number'
    || !Number.isFinite(origin.latitude)
    || origin.latitude < -90
    || origin.latitude > 90
    || typeof origin.longitude !== 'number'
    || !Number.isFinite(origin.longitude)
    || origin.longitude < -180
    || origin.longitude > 180
    || typeof origin.address !== 'string'
    || !origin.address.trim()
  ) {
    res.status(400).json({ message: 'Elegí una dirección de origen de las sugerencias.' });
    return;
  }
  if (
    excludedOrderIds !== undefined
    && (!Array.isArray(excludedOrderIds)
      || excludedOrderIds.some((id) => !Number.isSafeInteger(id) || id < 1))
  ) {
    res.status(400).json({ message: 'La lista de paradas omitidas no es válida.' });
    return;
  }

  try {
    const allOrders = await Order.findAll({ where: { deliveryDate } });
    if (allOrders.length === 0) {
      res.status(404).json({ message: 'No hay pedidos para esa fecha.' });
      return;
    }

    const excludedIds = new Set(excludedOrderIds as number[] | undefined);
    const orders = allOrders.filter((order) => !excludedIds.has(order.id));
    if (orders.length === 0) {
      res.status(422).json({ message: 'Todas las paradas están omitidas. Volvé a incluir al menos una para armar la ruta.' });
      return;
    }

    const ordersWithoutCoordinates = orders.filter(
      (order) => !Number.isFinite(order.latitude) || !Number.isFinite(order.longitude),
    );
    if (ordersWithoutCoordinates.length > 0) {
      res.status(422).json({
        message: `${ordersWithoutCoordinates.length} pedido(s) de esa fecha no tienen una ubicación validada. Actualizá esas direcciones antes de optimizar.`,
      });
      return;
    }

    const route = await optimizeDeliveryRoute(orders.map((order) => ({
      id: order.id,
      clientName: order.clientName,
      address: order.address,
      latitude: order.latitude as number,
      longitude: order.longitude as number,
    })), {
      latitude: origin.latitude,
      longitude: origin.longitude,
      address: origin.address.trim(),
    });
    res.json(route);
  } catch (error) {
    if (error instanceof GeoapifyError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    console.error('Error al optimizar la ruta de entrega:', error);
    res.status(500).json({ message: 'No se pudo optimizar la ruta de entrega.' });
  }
});

router.patch('/:id/location', verifyAdmin, async (req, res) => {
  const orderId = req.params.id;
  if (typeof orderId !== 'string') {
    res.status(400).json({ message: 'Identificador de pedido inválido.' });
    return;
  }

  const { latitude, longitude } = req.body as {
    latitude?: unknown;
    longitude?: unknown;
  };
  if (
    typeof latitude !== 'number'
    || !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || typeof longitude !== 'number'
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  ) {
    res.status(400).json({ message: 'Seleccioná una ubicación válida en el mapa.' });
    return;
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      res.status(404).json({ message: 'No se encontró el pedido a corregir.' });
      return;
    }

    await order.update({ latitude, longitude });
    res.json(order);
  } catch (error) {
    console.error('Error al corregir la ubicación del pedido:', error);
    res.status(500).json({ message: 'No se pudo guardar la ubicación del pedido.' });
  }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Order.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el pedido' });
  }
});

export default router;