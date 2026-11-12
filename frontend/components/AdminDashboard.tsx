// src/components/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { getOrders, createOrder, updateOrderStatus, deleteOrder, Order } from '../services/orderService';
import { formatTrayToKitchen } from '../utils/kitchenFormat';

export const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterFlavor, setFilterFlavor] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'deliveryDate' | 'clientName'>('deliveryDate');

  // Formulario state
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [flavor, setFlavor] = useState<'Membrillo' | 'Batata' | 'Mixto'>('Membrillo');
  const [traysCount, setTraysCount] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState('');

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error al cargar los pedidos:", error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({
        clientName,
        phone,
        address,
        flavor,
        traysCount,
        deliveryDate,
        status: 'Pendiente',
      });
      // Limpiar form y recargar
      setClientName('');
      setPhone('');
      setAddress('');
      setTraysCount(1);
      setDeliveryDate('');
      loadOrders();
    } catch (error) {
      console.error("Error al crear el pedido:", error);
    }
  };

  const handleStatusChange = async (id: number | undefined, currentStatus: Order['status']) => {
    console.log("ID recibido al hacer clic:", id); // Control en consola del navegador (F12)
    
    if (!id) {
      alert("Error: Este pedido no tiene un ID válido asignado.");
      return;
    }

    const nextStatus: Record<Order['status'], Order['status']> = {
      'Pendiente': 'En camino',
      'En camino': 'Entregado',
      'Entregado': 'Pendiente',
    };

    try {
      await updateOrderStatus(id, nextStatus[currentStatus]);
      loadOrders(); // Recarga la lista desde la base de datos
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      await deleteOrder(id);
      loadOrders();
    } catch (error) {
      console.error("Error al eliminar el pedido:", error);
    }
  };

  // Filtrado y ordenamiento
  const filteredOrders = orders
    .filter(order => filterFlavor === 'Todos' || order.flavor === filterFlavor)
    .sort((a, b) => {
      if (sortBy === 'deliveryDate') {
        return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
      }
      return a.clientName.localeCompare(b.clientName);
    });

  return (
    <div className="admin-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Panel de Administración - Pastelitos</h1>

      {/* Formulario de Carga */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Nuevo Pedido</h3>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <input type="text" placeholder="Nombre del cliente" value={clientName} onChange={e => setClientName(e.target.value)} required />
          <input type="text" placeholder="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input type="text" placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} required />
          <select value={flavor} onChange={e => setFlavor(e.target.value as any)}>
            <option value="Membrillo">Membrillo</option>
            <option value="Batata">Batata</option>
            <option value="Mixto">Mixto</option>
          </select>
          <input type="number" min="1" value={traysCount} onChange={e => setTraysCount(Number(e.target.value))} required />
          <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required />
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '8px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Registrar Pedido
        </button>
      </form>

      {/* Filtros y Orden */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
        <div>
          <label>Filtrar por gusto: </label>
          <select value={filterFlavor} onChange={e => setFilterFlavor(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Membrillo">Membrillo</option>
            <option value="Batata">Batata</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>
        <div>
          <label>Ordenar por: </label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="deliveryDate">Fecha de entrega</option>
            <option value="clientName">Nombre del cliente</option>
          </select>
        </div>
      </div>

      {/* Listado de Pedidos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#ddd', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Cliente</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Gusto</th>
            <th>Cantidad (Cocina)</th>
            <th>Entrega</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{order.clientName}</td>
              <td>{order.phone}</td>
              <td>{order.address}</td>
              <td>{order.flavor}</td>
              <td>{formatTrayToKitchen(order.traysCount)}</td>
              <td>{order.deliveryDate}</td>
              <td>
                <span style={{ padding: '4px 8px', borderRadius: '4px', background: order.status === 'Entregado' ? '#d4edda' : '#fff3cd' }}>
                  {order.status}
                </span>
              </td>
              <td>
                <button onClick={() => handleStatusChange(order.id, order.status)}>Estado</button>
                <button onClick={() => handleDelete(order.id)} style={{ color: 'red' }}>Borrar</button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};