import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { LatLngBoundsExpression } from 'leaflet';
import api from '../services/api';
import AddressAutocomplete, { type AddressLocation } from '../components/AddressAutocomplete';
import LocationPicker from '../components/LocationPicker';
import { formatName, formatShortAddress } from '../utils/formatName';
import 'leaflet/dist/leaflet.css';

interface Order {
  id: number;
  clientName: string;
  clientPhone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  quantityMembrillo: number;
  quantityBatata: number;
  deliveryDate: string;
}

interface DeliveryRoute {
  geometry: GeoJsonObject;
  distance: number;
  duration: number;
  origin: AddressLocation & { address: string };
  stops: Array<{
    id: number;
    clientName: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;
}

function buildGoogleMapsRouteUrl(route: DeliveryRoute): string | null {
  if (route.stops.length === 0 || route.stops.length > 10) {
    return null;
  }

  const lastStop = route.stops[route.stops.length - 1]!;
  const params = new URLSearchParams({
    api: '1',
    travelmode: 'driving',
    origin: `${route.origin.latitude},${route.origin.longitude}`,
    destination: `${lastStop.latitude},${lastStop.longitude}`,
  });
  if (route.stops.length > 1) {
    params.set(
      'waypoints',
      route.stops.slice(0, -1).map((stop) => `${stop.latitude},${stop.longitude}`).join('|'),
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function FitRouteBounds({ route }: { route: DeliveryRoute }) {
  const map = useMap();

  useEffect(() => {
    const bounds: LatLngBoundsExpression = [
      [route.origin.latitude, route.origin.longitude],
      ...route.stops.map((stop) => [stop.latitude, stop.longitude] as [number, number]),
    ];
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
  }, [map, route]);

  return null;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressLocation, setAddressLocation] = useState<AddressLocation | null>(null);
  const [showAddressLocationPicker, setShowAddressLocationPicker] = useState(false);
  const [quantityMembrillo, setQuantityMembrillo] = useState(0);
  const [quantityBatata, setQuantityBatata] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [sortBy, setSortBy] = useState<'llegada' | 'fecha' | 'nombre'>('fecha');
  const [filterFlavor, setFilterFlavor] = useState<'todos' | 'membrillo' | 'batata'>('todos');
  const [routePlan, setRoutePlan] = useState<DeliveryRoute | null>(null);
  const [routeError, setRouteError] = useState('');
  const [isOptimizingRoute, setIsOptimizingRoute] = useState(false);
  const [ignoredStopIds, setIgnoredStopIds] = useState<number[]>([]);
  const [routeOriginAddress, setRouteOriginAddress] = useState('');
  const [routeOriginLocation, setRouteOriginLocation] = useState<AddressLocation | null>(null);
  const [editingOrderLocation, setEditingOrderLocation] = useState<Order | null>(null);
  const [editingLocation, setEditingLocation] = useState<AddressLocation | null>(null);
  const [locationError, setLocationError] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  
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
  const [deliveryDate, setDeliveryDate] = useState(todayStr);
  const [routeDate, setRouteDate] = useState(todayStr);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error al cargar los pedidos:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
      setClientName(value);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setClientPhone(value);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    try {
      await api.delete(`/orders/${id}`);
      fetchOrders();
    } catch (error) {
      console.error('Error al eliminar el pedido:', error);
    }
  };

  const handleSaveOrderLocation = async () => {
    if (!editingOrderLocation || !editingLocation) {
      setLocationError('Elegí una ubicación en el mapa antes de guardar.');
      return;
    }

    setIsSavingLocation(true);
    setLocationError('');
    try {
      await api.patch(`/orders/${editingOrderLocation.id}/location`, editingLocation);
      setOrders((currentOrders) => currentOrders.map((order) => (
        order.id === editingOrderLocation.id
          ? { ...order, ...editingLocation }
          : order
      )));
      setRoutePlan(null);
      setEditingOrderLocation(null);
      setEditingLocation(null);
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      setLocationError(typeof message === 'string' ? message : 'No se pudo guardar la ubicación. Intentá de nuevo.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!addressLocation) {
      setErrorMsg('Elegí una dirección de las sugerencias para confirmar la ubicación.');
      return;
    }

    if (Number(quantityMembrillo) + Number(quantityBatata) <= 0) {
      setErrorMsg('Debe pedir al menos una bandeja en total');
      return;
    }

    try {
      const formattedName = formatName(clientName);

      await api.post('/orders', {
        clientName: formattedName,
        clientPhone,
        address,
        ...addressLocation,
        quantityMembrillo: Number(quantityMembrillo),
        quantityBatata: Number(quantityBatata),
        deliveryDate,
      });

      setClientName('');
      setClientPhone('');
      setAddress('');
      setAddressLocation(null);
      setShowAddressLocationPicker(false);
      setQuantityMembrillo(0);
      setQuantityBatata(0);
      setDeliveryDate(todayStr);
      fetchOrders();
    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      setErrorMsg('No se pudo guardar el pedido. Revisá los datos e intentá de nuevo.');
    }
  };

  const handleOptimizeRoute = async (excludedIds = ignoredStopIds) => {
    setRouteError('');
    setRoutePlan(null);
    if (!routeOriginLocation) {
      setRouteError('Elegí una dirección de origen de las sugerencias.');
      return;
    }

    setIsOptimizingRoute(true);
    try {
      const response = await api.post<DeliveryRoute>('/orders/optimize-route', {
        deliveryDate: routeDate,
        origin: {
          ...routeOriginLocation,
          address: routeOriginAddress,
        },
        excludedOrderIds: excludedIds,
      });
      setRoutePlan(response.data);
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      setRouteError(typeof message === 'string' ? message : 'No se pudo optimizar la ruta. Intentá de nuevo.');
    } finally {
      setIsOptimizingRoute(false);
    }
  };

  const handleIgnoreStop = (orderId: number) => {
    const nextIgnoredIds = [...ignoredStopIds, orderId];
    setIgnoredStopIds(nextIgnoredIds);
    void handleOptimizeRoute(nextIgnoredIds);
  };

  const handleRestoreStop = (orderId: number) => {
    const nextIgnoredIds = ignoredStopIds.filter((id) => id !== orderId);
    setIgnoredStopIds(nextIgnoredIds);
    void handleOptimizeRoute(nextIgnoredIds);
  };

  const googleMapsRouteUrl = routePlan ? buildGoogleMapsRouteUrl(routePlan) : null;

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

  const filteredByFlavor = orders.filter((o) => {
    if (filterFlavor === 'membrillo') return o.quantityMembrillo > 0;
    if (filterFlavor === 'batata') return o.quantityBatata > 0;
    return true;
  });

  const sortedOrders = [...filteredByFlavor].sort((a, b) => {
    if (sortBy === 'fecha') {
      return a.deliveryDate.localeCompare(b.deliveryDate);
    } else if (sortBy === 'nombre') {
      return a.clientName.localeCompare(b.clientName);
    } else {
      return a.id - b.id;
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
    <div style={{ padding: '20px', color: '#fff', background: 'radial-gradient(ellipse at 12% 8%, rgba(161, 82, 71, 0.18) 0%, transparent 36%), radial-gradient(ellipse at 88% 22%, rgba(109, 83, 145, 0.16) 0%, transparent 34%), linear-gradient(145deg, #17151b 0%, #20191b 48%, #14191f 100%)', backgroundAttachment: 'fixed', minHeight: '100vh' }}>
      <h1>Panel de Administración - Pastelitos</h1>
      
      <div className="admin-top-layout" style={{ marginBottom: '30px' }}>
        
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
            <AddressAutocomplete
              id="admin-delivery-address"
              value={address}
              onChange={setAddress}
              onSelect={(location) => {
                setAddressLocation(location);
                setShowAddressLocationPicker(false);
              }}
              inputStyle={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
            <small style={{ color: '#aaa' }}>Elegí una sugerencia y revisá que el pin marque el domicilio correcto.</small>
            {addressLocation && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddressLocationPicker((shown) => !shown)}
                  style={{ alignSelf: 'flex-start', padding: '7px 10px', border: '1px solid #666', borderRadius: '4px', background: '#2a2a2a', color: '#fff', cursor: 'pointer' }}
                >
                  {showAddressLocationPicker ? 'Ocultar mapa' : 'Revisar o corregir ubicación'}
                </button>
                {showAddressLocationPicker && (
                  <LocationPicker location={addressLocation} onChange={setAddressLocation} />
                )}
              </>
            )}

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

      <section style={{ marginBottom: '28px', padding: '20px', border: '1px solid #333', borderRadius: '8px', background: '#1e1e1e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 6px' }}>Ruta de entregas</h2>
            <p style={{ margin: 0, color: '#aaa', fontSize: '13px' }}>Optimizá el recorrido en auto para los pedidos de una fecha.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '8px', flexWrap: 'wrap' }}>
            <label htmlFor="route-delivery-date">Fecha:</label>
            <input
              id="route-delivery-date"
              type="date"
              value={routeDate}
              onChange={(event) => {
                setRouteDate(event.target.value);
                setRoutePlan(null);
                setRouteError('');
                setIgnoredStopIds([]);
              }}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
            />
            <div style={{ minWidth: '260px', flex: '1 1 260px' }}>
              <label htmlFor="route-origin">Punto de partida:</label>
              <AddressAutocomplete
                id="route-origin"
                value={routeOriginAddress}
                onChange={(value) => {
                  setRouteOriginAddress(value);
                  setRoutePlan(null);
                }}
                onSelect={(location) => {
                  setRouteOriginLocation(location);
                  setRoutePlan(null);
                }}
                inputStyle={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #444', background: '#2a2a2a', color: '#fff' }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleOptimizeRoute()}
              disabled={isOptimizingRoute || !routeDate || !routeOriginLocation}
              style={{ padding: '9px 14px', border: 0, borderRadius: '5px', background: '#28a745', color: '#fff', fontWeight: 'bold', cursor: isOptimizingRoute ? 'wait' : 'pointer' }}
            >
              {isOptimizingRoute ? 'Calculando…' : 'Optimizar ruta'}
            </button>
          </div>
        </div>
        {routeError && (
          <div role="alert" style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '5px', background: '#482a28', color: '#ffd4cc' }}>
            {routeError}
          </div>
        )}
        {routePlan && (
          <div style={{ marginTop: '18px' }}>
            <p style={{ color: '#ddd' }}>
              {routePlan.stops.length} paradas · {(routePlan.distance / 1000).toFixed(1)} km · {Math.ceil(routePlan.duration / 60)} min estimados
            </p>
            {googleMapsRouteUrl ? (
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginBottom: '12px', padding: '10px 14px', borderRadius: '5px', background: '#2784c7', color: '#fff', fontWeight: 'bold', textDecoration: 'none' }}
              >
                Iniciar viaje en Google Maps
              </a>
            ) : (
              <p role="status" style={{ color: '#ffc107' }}>
                Google Maps permite hasta 10 paradas por enlace. Omití algunas paradas para abrir este tramo.
              </p>
            )}
            <MapContainer
              center={[routePlan.stops[0]!.latitude, routePlan.stops[0]!.longitude]}
              zoom={12}
              scrollWheelZoom
              style={{ height: '420px', width: '100%', borderRadius: '6px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON data={routePlan.geometry} style={{ color: '#e18a45', weight: 5, opacity: 0.85 }} />
              <CircleMarker center={[routePlan.origin.latitude, routePlan.origin.longitude]} radius={10} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2784c7', fillOpacity: 1 }}>
                <Tooltip permanent direction="top" offset={[0, -8]}>Inicio</Tooltip>
                <Popup>{routePlan.origin.address}</Popup>
              </CircleMarker>
              {routePlan.stops.map((stop, index) => (
                <CircleMarker key={stop.id} center={[stop.latitude, stop.longitude]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#8d4e2c', fillOpacity: 1 }}>
                  <Tooltip permanent direction="top" offset={[0, -8]}>{index + 1}</Tooltip>
                  <Popup>
                    <strong>{index + 1}. {formatName(stop.clientName)}</strong>
                    <br />
                    {formatShortAddress(stop.address)}
                  </Popup>
                </CircleMarker>
              ))}
              <FitRouteBounds route={routePlan} />
            </MapContainer>
            <p style={{ margin: '8px 0', color: '#aaa', fontSize: '11px' }}>
              Rutas por <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer" style={{ color: '#9fd4ff' }}>Geoapify</a> · Mapa © OpenStreetMap contributors
            </p>
            <ol style={{ display: 'grid', gap: '8px', paddingLeft: '28px', marginTop: '18px' }}>
              {routePlan.stops.map((stop) => (
                <li key={stop.id} style={{ padding: '4px 0', color: '#eee' }}>
                  <strong>{formatName(stop.clientName)}</strong> — {formatShortAddress(stop.address)}{' '}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: '8px', color: '#9fd4ff' }}
                  >
                    Navegar a esta parada
                  </a>
                  <button
                    type="button"
                    onClick={() => handleIgnoreStop(stop.id)}
                    disabled={isOptimizingRoute}
                    style={{ marginLeft: '8px', padding: '3px 7px', border: '1px solid #a87b24', borderRadius: '4px', background: '#3a301e', color: '#ffd36a', cursor: isOptimizingRoute ? 'wait' : 'pointer' }}
                  >
                    Omitir de esta ruta
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
        {ignoredStopIds.length > 0 && (
          <section aria-label="Paradas omitidas" style={{ marginTop: '18px', padding: '12px', border: '1px solid #66552b', borderRadius: '6px', background: '#282419' }}>
            <h4 style={{ margin: '0 0 8px', color: '#ffd36a' }}>Omitidas de esta ruta (el pedido sigue guardado)</h4>
            <ul style={{ display: 'grid', gap: '8px', margin: 0, paddingLeft: '22px' }}>
              {orders.filter((order) => order.deliveryDate === routeDate && ignoredStopIds.includes(order.id)).map((order) => (
                <li key={order.id}>
                  {formatName(order.clientName)} — {formatShortAddress(order.address)}{' '}
                  <button
                    type="button"
                    onClick={() => handleRestoreStop(order.id)}
                    disabled={isOptimizingRoute}
                    style={{ marginLeft: '8px', padding: '3px 7px', border: '1px solid #478854', borderRadius: '4px', background: '#203528', color: '#a7e6b2', cursor: isOptimizingRoute ? 'wait' : 'pointer' }}
                  >
                    Volver a incluir
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Lista de Pedidos para Reparto</h2>
        
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
                  <td style={{ padding: '10px' }}>{formatShortAddress(o.address)}</td>
                  <td style={{ padding: '10px' }}>{formatBandejas(o.quantityMembrillo)}</td>
                  <td style={{ padding: '10px' }}>{formatBandejas(o.quantityBatata)}</td>
                  <td style={{ padding: '10px' }}>{o.deliveryDate}</td>
                  <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingOrderLocation(o);
                        setEditingLocation(
                          o.latitude !== null && o.longitude !== null
                            ? { latitude: o.latitude, longitude: o.longitude }
                            : { latitude: -38.7183, longitude: -62.2663 },
                        );
                        setLocationError('');
                      }}
                      style={{ background: '#355f91', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Corregir pin
                    </button>
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
      {editingOrderLocation && editingLocation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-order-location-title"
          style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'grid', placeItems: 'center', padding: '16px', background: 'rgba(0, 0, 0, 0.75)' }}
        >
          <section style={{ width: 'min(720px, 100%)', padding: '20px', border: '1px solid #444', borderRadius: '8px', background: '#1e1e1e' }}>
            <h2 id="edit-order-location-title" style={{ marginTop: 0 }}>Corregir ubicación</h2>
            <p style={{ color: '#ddd' }}>
              {formatName(editingOrderLocation.clientName)} — {editingOrderLocation.address}
            </p>
            <p style={{ color: '#aaa', fontSize: '13px' }}>Hacé clic en el mapa donde está el domicilio. El pin rojo muestra la ubicación elegida.</p>
            <LocationPicker
              key={editingOrderLocation.id}
              location={editingLocation}
              onChange={setEditingLocation}
              height={360}
            />
            {locationError && <p role="alert" style={{ color: '#ffb4a9' }}>{locationError}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setEditingOrderLocation(null);
                  setEditingLocation(null);
                }}
                disabled={isSavingLocation}
                style={{ padding: '8px 12px', border: '1px solid #666', borderRadius: '4px', background: '#2a2a2a', color: '#fff', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveOrderLocation}
                disabled={isSavingLocation}
                style={{ padding: '8px 12px', border: 0, borderRadius: '4px', background: '#28a745', color: '#fff', cursor: isSavingLocation ? 'wait' : 'pointer' }}
              >
                {isSavingLocation ? 'Guardando…' : 'Guardar ubicación'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}