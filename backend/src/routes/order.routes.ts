import { Router } from 'express';
import { 
  createOrder, 
  listOrders, 
  getOrderById, 
  updateOrderStatus 
} from '../controllers/order.controller';

const router = Router();

router.post('/', createOrder);                 // Crear un pedido
router.get('/', listOrders);                   // Listar todos los pedidos
router.get('/:id', getOrderById);              // Buscar un pedido por ID
router.patch('/:id/status', updateOrderStatus); // Actualizar el estado de un pedido

export default router;