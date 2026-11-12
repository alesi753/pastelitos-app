import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatName } from '../utils/formatName';

interface Order {
  id: number;
  clientName: string;
  clientPhone: string;
  address: string;
  quantityMembrillo: number;
  quantityBatata: number;
  deliveryDate: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);                                    // Estado para almacenar la lista de pedidos
  const [clientName, setClientName] = useState('');                                      // Estado para el nombre del cliente
  const [clientPhone, setClientPhone] = useState('');                                    // Estado para el teléfono (solo números)
  const [address, setAddress] = useState('');                                            // Estado para la dirección de entrega
  const [quantityMembrillo, setQuantityMembrillo] = useState(0);                         // Cantidad de bandejas de membrillo
  const [quantityBatata, setQuantityBatata] = useState(0);                               // Cantidad de bandejas de batata
  const [errorMsg, setErrorMsg] = useState('');                                          // Estado para mostrar mensajes de error de validación
  const [sortBy, setSortBy] = useState<'llegada' | 'fecha' | 'nombre'>('fecha');         // Orden por defecto en 'fecha'
  const [filterFlavor, setFilterFlavor] = useState<'todos' | 'membrillo' | 'batata'>('todos'); // Estado para filtrar por gusto
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = new Date();
  const todayStr = formatDate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDate(tomorrow);
  const [deliveryDate, setDeliveryDate] = useState(todayStr);                            // Estado para la fecha de entrega seleccionada

  const fetchOrders = async () => {                                                      // Función para obtener los pedidos desde el backend
    try {
      const response = await api.get('/orders');                                         // Petición GET para traer los pedidos
      setOrders(response.data);                                                          // Actualiza el estado con los datos obtenidos
    } catch (error) {
      console.error('Error al cargar los pedidos:', error);                              // Captura y muestra errores de red o servidor
    }
  };

  useEffect(() => {
    fetchOrders();                                                                       // Carga los pedidos al montar el componente
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {                 // Manejador del cambio en el input de nombre
    const value = e.target.value;
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {                                      // Expresión regular que bloquea números
      setClientName(value);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {                // Manejador del teléfono (solo números)
    const value = e.target.value;
    if (/^\d*$/.test(value)) {                                                           // Expresión regular que solo permite dígitos numéricos
      setClientPhone(value);
    }
  };

  // Función para eliminar un pedido
  const handleDeleteOrder = async (id: number) => {
    try {
      await api.delete(`/orders/${id}`);                                                 // Petición DELETE al backend
      fetchOrders();                                                                     // Recarga la lista de pedidos
    } catch (error) {
      console.error('Error al eliminar el pedido:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {                                   // Manejador del envío del formulario de pedidos
    e.preventDefault();                                                                  // Previene el comportamiento por defecto del formulario
    setErrorMsg('');                                                                     // Limpia errores previos

    // Validación de la dirección (mínimo 3 caracteres)
    if (address.trim().length < 3) {
      setErrorMsg('Ingresar una dirección válida');
      return;
    }

    // Validación de cantidad mínima (al menos 1 bandeja en total)
    if (Number(quantityMembrillo) + Number(quantityBatata) <= 0) {
      setErrorMsg('Debe pedir al menos una bandeja en total');
      return;
    }

    try {
      const formattedName = formatName(clientName);                                      // Aplica el formato prolijo al nombre/apellido

      await api.post('/orders', {                                                        // Petición POST para guardar el nuevo pedido
        clientName: formattedName,
        clientPhone,
        address,
        quantityMembrillo: Number(quantityMembrillo),
        quantityBatata: Number(quantityBatata),
        deliveryDate,
      });

      setClientName('');                                                                 // Limpia el campo de nombre
      setClientPhone('');                                                                // Limpia el campo de teléfono
      setAddress('');                                                                    // Limpia el campo de dirección
      setQuantityMembrillo(0);                                                           // Resetea membrillo a 0
      setQuantityBatata(0);                                                              // Resetea batata a 0
      setDeliveryDate(todayStr);                                                         // Resetea la fecha al día de hoy
      fetchOrders();                                                                     // Recarga la lista de pedidos en pantalla
    } catch (error) {
      console.error('Error al guardar el pedido:', error);                              // Muestra error si falla el guardado
    }
  };

  // Función auxiliar para traducir la cantidad de bandejas a formato "doc."
  const formatBandejas = (cantidad: number) => {
    if (cantidad <= 0) return '0';
    if (cantidad === 1) return '1 bandeja (1/2 doc.)';
    if (cantidad === 2) return '2 bandejas (1 doc.)';
    
    const docenas = Math.floor(cantidad / 2);
    const resto = cantidad % 2;

    if (resto === 0) {
      return `${cantidad} bandejas (${docenas} doc.)`;
    } else {
      return `${cantidad} bandejas (${docenas} doc. y media)`;
    }
  };

  // Filtrar por gusto seleccionado
  const filteredByFlavor = orders.filter((o) => {
    if (filterFlavor === 'membrillo') return o.quantityMembrillo > 0;
    if (filterFlavor === 'batata') return o.quantityBatata > 0;
    return true; // 'todos'
  });

  // Lógica para ordenar los pedidos según lo que elija el usuario
  const sortedOrders = [...filteredByFlavor].sort((a, b) => {
    if (sortBy === 'fecha') {
      return a.deliveryDate.localeCompare(b.deliveryDate);
    } else if (sortBy === 'nombre') {
      return a.clientName.localeCompare(b.clientName);
    } else {
      return a.id - b.id; // Orden de llegada (por ID original de inserción)
    }
  });

  const kitchenSummaries = [
    { label: 'Hoy', orders: orders.filter((order) => order.deliveryDate === todayStr), accent: '#28a745' },
    { label: 'Mañana', orders: orders.filter((order) => order.deliveryDate === tomorrowStr), accent: '#17a2b8' },
    { label: 'Más adelante', orders: orders.filter((order) => order.deliveryDate > tomorrowStr), accent: '#9b8afb' },
    { label: 'Total', orders, accent: '#ffc107' },
  ].map(({ label, orders: summaryOrders, accent }) => ({
    label,
    accent,
    membrillo: summaryOrders.reduce((total, order) => total + order.quantityMembrillo, 0),
    batata: summaryOrders.reduce((total, order) => total + order.quantityBatata, 0),
  }));

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#121212', minHeight: '100vh' }}>
      <h1>Panel de Administración - Pastelitos</h1>
      
      {/* Contenedor superior en dos columnas (Formulario a la izquierda, Resumen de cocina a la derecha) */}
      <div className="admin-top-layout" style={{ marginBottom: '30px' }}>
        
        {/* Formulario de Carga */}
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
          <h2>Cargar Pedido Manual</h2>
          
          {errorMsg && (
            <div style={{ background: '#ff4d4d', color: '#fff', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <label>Nombre y Apellido</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={handleNameChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />

            <label>Teléfono</label>
            <input
              type="text"
              required
              value={clientPhone}
              onChange={handlePhoneChange}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />

            <label>Dirección</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />

            {/* Aclaración solicitada */}
            <small style={{ color: '#aaa', fontStyle: 'italic' }}>
              * Cada cantidad equivale a 1 bandeja (6 pastelitos) - ($5000 c/u).
            </small>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label>Membrillo (Bandejas)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quantityMembrillo}
                  onChange={(e) => setQuantityMembrillo(Math.max(0, Math.min(100, Number(e.target.value))))}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label>Batata (Bandejas)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quantityBatata}
                  onChange={(e) => setQuantityBatata(Math.max(0, Math.min(100, Number(e.target.value))))}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label>Fecha de Entrega</label>
              <input
                type="date"
                min={todayStr}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
              />
            </div>

            <button type="submit" style={{ padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Guardar Pedido
            </button>
          </form>
        </div>

        {/* Resumen de producción para la cocina (A la derecha) */}
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', width: '100%', boxSizing: 'border-box', border: '1px solid #333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Preparación</h3>
            <span style={{ color: '#999', fontSize: '12px' }}>Por fecha de entrega</span>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {kitchenSummaries.map((summary, index) => {
              const indent = index * 14;
              return (
                <div key={summary.label} style={{ marginLeft: `${indent}px`, width: `calc(100% - ${indent}px)`, boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', background: '#252525', padding: '10px 12px', borderRadius: '5px', borderLeft: `3px solid ${summary.accent}`, ...(summary.label === 'Total' ? { background: '#302b1d' } : {}) }}>
                  <strong style={{ color: summary.accent, fontSize: '13px', whiteSpace: 'nowrap' }}>{summary.label}</strong>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', fontSize: '12px', minWidth: 0 }}>
                    <span style={{ color: '#ddd', textAlign: 'right' }}><span style={{ color: '#999' }}>Membrillo </span><strong>{formatBandejas(summary.membrillo)}</strong></span>
                    <span style={{ color: '#ddd', textAlign: 'right' }}><span style={{ color: '#999' }}>Batata </span><strong>{formatBandejas(summary.batata)}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Lista de Pedidos para Reparto</h2>
        
        {/* Controles de Filtrado y Ordenamiento */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '14px' }}>Filtrar:</label>
            <select 
              value={filterFlavor} 
              onChange={(e) => setFilterFlavor(e.target.value as 'todos' | 'membrillo' | 'batata')}
              style={{ padding: '6px', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
            >
              <option value="todos">Todos los gustos</option>
              <option value="membrillo">Solo Membrillo</option>
              <option value="batata">Solo Batata</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontSize: '14px' }}>Ordenar por:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'llegada' | 'fecha' | 'nombre')}
              style={{ padding: '6px', borderRadius: '4px', background: '#2a2a2a', color: '#fff', border: '1px solid #444' }}
            >
              <option value="llegada">Orden de llegada</option>
              <option value="fecha">Fecha de entrega</option>
              <option value="nombre">Nombre del cliente</option>
            </select>
          </div>
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <p>No hay pedidos registrados con este filtro.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e1e1e' }}>
          <thead>
            <tr style={{ background: '#333', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Cliente</th>
              <th style={{ padding: '10px' }}>Teléfono</th>
              <th style={{ padding: '10px' }}>Dirección</th>
              <th style={{ padding: '10px' }}>Membrillo</th>
              <th style={{ padding: '10px' }}>Batata</th>
              <th style={{ padding: '10px' }}>Fecha</th>
              <th style={{ padding: '10px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map((o) => {
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '10px' }}>{formatName(o.clientName)}</td>
                  <td style={{ padding: '10px' }}>{o.clientPhone}</td>
                  <td style={{ padding: '10px' }}>{o.address}</td>
                  <td style={{ padding: '10px' }}>{formatBandejas(o.quantityMembrillo)}</td>
                  <td style={{ padding: '10px' }}>{formatBandejas(o.quantityBatata)}</td>
                  <td style={{ padding: '10px' }}>{o.deliveryDate}</td>
                  <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                    <button 
                      onClick={() => handleDeleteOrder(o.id)}
                      style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}