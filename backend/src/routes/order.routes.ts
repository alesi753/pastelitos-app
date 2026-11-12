import { Router } from 'express';
import { createOrder, listOrders, updateOrderStatus } from '../controllers/order.controller';

const router = Router();

router.post('/', createOrder);         // Endpoint para crear pedido
router.get('/', listOrders);           // Endpoint para listar pedidos
router.patch('/:id/status', updateOrderStatus); // Endpoint para cambiar el estado

export default router;