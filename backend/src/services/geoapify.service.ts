interface GeoapifyAddressResult {
  formatted: string;
  lat: number;
  lon: number;
}

interface AddressSuggestion {
  address: string;
  latitude: number;
  longitude: number;
}

interface RouteOrder {
  id: number;
  latitude: number;
  longitude: number;
  clientName: string;
  address: string;
}

interface RouteOrigin {
  latitude: number;
  longitude: number;
  address: string;
}

interface GeoapifyRouteFeature {
  geometry: {
    type: string;
    coordinates: unknown;
  } | null;
  properties?: {
    distance?: number;
    time?: number;
    actions?: Array<{ type?: string; job_id?: string; job_index?: number }>;
    waypoints?: Array<{
      actions?: Array<{ job_id?: string; job_index?: number }>;
    }>;
  };
}

export class GeoapifyError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'GeoapifyError';
  }
}

const getApiKey = (): string => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey?.trim()) {
    throw new GeoapifyError('El servicio de direcciones no está configurado.', 503);
  }
  return apiKey.trim();
};

const fetchGeoapify = async (url: URL, init?: RequestInit): Promise<Response> => {
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null) as { message?: unknown } | null;
      const providerMessage = typeof error?.message === 'string'
        ? error.message.slice(0, 300)
        : 'El proveedor de mapas no pudo procesar la solicitud.';
      throw new GeoapifyError(`Geoapify rechazó la solicitud: ${providerMessage}`, 502);
    }
    return response;
  } catch (error) {
    if (error instanceof GeoapifyError) {
      throw error;
    }
    throw new GeoapifyError('No se pudo conectar con el proveedor de mapas.', 502);
  }
};

export const searchAddresses = async (text: string): Promise<AddressSuggestion[]> => {
  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', text);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('lang', 'es');
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetchGeoapify(url);
  const data = await response.json() as { results?: GeoapifyAddressResult[] };
  return (data.results ?? []).filter((result) =>
    typeof result.formatted === 'string'
    && result.formatted.trim().length > 0
    && Number.isFinite(result.lat)
    && Number.isFinite(result.lon))
    .map((result) => ({
      address: result.formatted,
      latitude: result.lat,
      longitude: result.lon,
    }));
};

export const optimizeDeliveryRoute = async (orders: RouteOrder[], origin: RouteOrigin) => {
  const url = new URL('https://api.geoapify.com/v1/routeplanner');
  url.searchParams.set('apiKey', getApiKey());

  const response = await fetchGeoapify(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'drive',
      agents: [{
        id: 'delivery',
        start_location: [origin.longitude, origin.latitude],
      }],
      jobs: orders.map((order) => ({
        id: String(order.id),
        location: [order.longitude, order.latitude],
        duration: 120,
      })),
    }),
  });
  const result = await response.json() as {
    features?: GeoapifyRouteFeature[];
    properties?: {
      issues?: {
        unassigned_jobs?: number[];
        unassignedJobs?: number[];
      };
    };
  };
  const plan = result.features?.[0];
  if (!plan?.geometry || !plan.properties) {
    throw new GeoapifyError('El proveedor no pudo generar una ruta para estos pedidos.', 422);
  }

  const orderIdsByIndex = orders.map((order) => order.id);
  const orderById = new Map(orders.map((order) => [String(order.id), order]));
  const actions = plan.properties.waypoints?.flatMap((waypoint) => waypoint.actions ?? [])
    ?? plan.properties.actions
    ?? [];
  const visitedIds: number[] = [];

  for (const action of actions) {
    const orderId = action.job_id
      ? Number(action.job_id)
      : typeof action.job_index === 'number'
        ? orderIdsByIndex[action.job_index]
        : undefined;
    if (orderId !== undefined && orderById.has(String(orderId)) && !visitedIds.includes(orderId)) {
      visitedIds.push(orderId);
    }
  }

  const unassignedCount = result.properties?.issues?.unassigned_jobs?.length
    ?? result.properties?.issues?.unassignedJobs?.length
    ?? 0;
  if (unassignedCount > 0 || visitedIds.length !== orders.length) {
    throw new GeoapifyError('No se pudieron incluir todos los pedidos en una sola ruta. Probá separarlos por zona.', 422);
  }

  return {
    geometry: plan.geometry,
    distance: plan.properties.distance ?? 0,
    duration: plan.properties.time ?? 0,
    origin,
    stops: visitedIds.map((id) => {
      const order = orderById.get(String(id));
      if (!order) {
        throw new GeoapifyError('La respuesta de rutas contiene un pedido desconocido.', 502);
      }
      return {
        id: order.id,
        clientName: order.clientName,
        address: order.address,
        latitude: order.latitude,
        longitude: order.longitude,
      };
    }),
  };
};
