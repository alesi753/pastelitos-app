import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeoapifyError, optimizeDeliveryRoute, searchAddresses } from '../services/geoapify.service';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Geoapify service', () => {
  it('returns worldwide address suggestions with normalized coordinates', async () => {
    vi.stubEnv('GEOAPIFY_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [
        { formatted: '10 Downing Street, London, UK', lat: 51.5034, lon: -0.1276 },
        { formatted: '', lat: 0, lon: 0 },
      ],
    })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchAddresses('10 Downing Street')).resolves.toEqual([
      {
        address: '10 Downing Street, London, UK',
        latitude: 51.5034,
        longitude: -0.1276,
      },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('geocode/autocomplete');
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('apiKey=test-key');
  });

  it('returns optimized stop order and route details', async () => {
    vi.stubEnv('GEOAPIFY_API_KEY', 'test-key');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      features: [{
        geometry: { type: 'MultiLineString', coordinates: [[[ -0.1276, 51.5034], [-0.1419, 51.5014]]] },
        properties: {
          distance: 2400,
          time: 600,
          waypoints: [
            { actions: [{ type: 'job', job_id: '2', job_index: 1 }] },
            { actions: [{ type: 'job', job_id: '1', job_index: 0 }] },
          ],
        },
      }],
    })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(optimizeDeliveryRoute([
      { id: 1, latitude: 51.5034, longitude: -0.1276, clientName: 'Cliente uno', address: 'Address 1' },
      { id: 2, latitude: 51.5014, longitude: -0.1419, clientName: 'Cliente dos', address: 'Address 2' },
    ], {
      latitude: 51.5155,
      longitude: -0.1419,
      address: 'Starting address',
    })).resolves.toMatchObject({
      distance: 2400,
      duration: 600,
      origin: { latitude: 51.5155, longitude: -0.1419 },
      stops: [{ id: 2 }, { id: 1 }],
    });
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain('"start_location":[-0.1419,51.5155]');
  });

  it('surfaces provider validation errors', async () => {
    vi.stubEnv('GEOAPIFY_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      message: '"agents[0]" must contain a start location',
    }), { status: 400 })));

    await expect(searchAddresses('Paris')).rejects.toMatchObject<Partial<GeoapifyError>>({
      statusCode: 502,
      message: 'Geoapify rechazó la solicitud: "agents[0]" must contain a start location',
    });
  });

  it('reports a missing API key explicitly', async () => {
    vi.stubEnv('GEOAPIFY_API_KEY', '');

    await expect(searchAddresses('Paris')).rejects.toMatchObject<Partial<GeoapifyError>>({
      statusCode: 503,
      message: 'El servicio de direcciones no está configurado.',
    });
  });
});
