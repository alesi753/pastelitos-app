import { Router } from 'express';
import Order from '../models/order';

const router = Router();

// GET: Obtener todos los pedidos
router.get('/', async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
});

// POST: Crear un nuevo pedido
router.post('/', async (req, res) => {
  try {
    const { clientName, clientPhone, address, quantityMembrillo, quantityBatata, deliveryDate } = req.body;
    const newOrder = await Order.create({
      clientName,
      clientPhone,
      address,
      quantityMembrillo,
      quantityBatata,
      deliveryDate,
      status: 'pendiente' // Nace como pendiente por defecto
    });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el pedido' });
  }
});

// PATCH: Cambiar el estado del pedido (pendiente / en camino)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el estado' });
  }
});

// DELETE: Eliminar un pedido por ID
router.delete('/:id', async (req, res) => {
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