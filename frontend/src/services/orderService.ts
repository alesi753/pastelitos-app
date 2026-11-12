// src/services/orderService.ts
const API_URL = 'http://localhost:3000/api'; 

export interface Order {
  id?: number;
  clientName: string;
  phone: string;
  address: string;
  flavor: 'Membrillo' | 'Batata' | 'Mixto';
  traysCount: number; // Cantidad de bandejas
  deliveryDate: string;
  status: 'Pendiente' | 'En camino' | 'Entregado';
}

export const getOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_URL}/orders`);
  if (!response.ok) throw new Error('Error al obtener los pedidos');
  return response.json();
};

export const createOrder = async (order: Order): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error('Error al crear el pedido');
  return response.json();
};

export const updateOrderStatus = async (id: number, status: Order['status']): Promise<Order> => {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Error al actualizar el estado');
  return response.json();
};

export const deleteOrder = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/orders/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar el pedido');
};