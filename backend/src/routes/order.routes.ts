import { Router } from 'express';
import Order from '../models/order';
import { login } from '../controllers/auth.controller';
import { verifyAdmin } from '../middlewares/auth.middleware';

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
    const { clientName, clientPhone, address, quantityMembrillo, quantityBatata, deliveryDate } = req.body;
    const newOrder = await Order.create({
      clientName,
      clientPhone,
      address,
      quantityMembrillo,
      quantityBatata,
      deliveryDate,
    });
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el pedido' });
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