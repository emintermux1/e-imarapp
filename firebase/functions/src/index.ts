import express, { Request, Response } from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { getArcGisLayers, queryPlanLayersByPoint } from './arcgis';
import { isInsideTurkeyBounds, parseNumber, Point } from './geo';
import { fail, ok } from './http';
import { ProviderRegistry } from './registry';

const app = express();
const registry = new ProviderRegistry();

app.disable('x-powered-by');
app.use(express.json({ limit: '128kb' }));

const stringQuery = (req: Request, name: string): string | undefined => {
  const value = req.query[name];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
};

const readPoint = (req: Request, res: Response): Point | undefined => {
  const lat = parseNumber(req.query.lat);
  const lng = parseNumber(req.query.lng);

  if (lat === undefined || lng === undefined) {
    fail(res, 400, {
      code: 'bad_request',
      message: 'lat and lng query parameters are required numeric WGS84 coordinates.'
    });
    return undefined;
  }

  const point = { lat, lng };
  if (registry.turkeyOnly() && !isInsideTurkeyBounds(point)) {
    fail(res, 400, {
      code: 'outside_turkey_bounds',
      message: 'This gateway is configured for Turkey-only usage.'
    });
    return undefined;
  }

  return point;
};

app.get('/health', (_req, res) => {
  ok(res, {
    service: 'e-imar-data-gateway',
    status: 'healthy',
    turkeyOnly: registry.turkeyOnly()
  });
});

app.get('/providers', (req, res) => {
  const city = stringQuery(req, 'city');
  ok(res, {
    providers: registry.providersForCity(city)
  });
});

app.get('/regions', (req, res) => {
  const city = stringQuery(req, 'city');
  const providers = registry.providersForCity(city);
  const regions = Array.from(new Set(providers.flatMap((provider) => provider.regions))).sort((a, b) =>
    a.localeCompare(b, 'tr')
  );

  ok(res, { regions, providers });
});

app.get('/layers', async (req, res) => {
  const city = stringQuery(req, 'city');
  const providers = registry.municipalForCity(city);

  if (providers.length === 0) {
    fail(res, 404, {
      code: 'not_configured',
      message: 'No enabled public municipal GIS provider is configured for the requested city.'
    });
    return;
  }

  try {
    const layers = await Promise.all(
      providers.map(async (provider) => ({
        provider: {
          id: provider.id,
          displayName: provider.displayName,
          serviceType: provider.serviceType,
          serviceUrl: provider.serviceUrl
        },
        metadata: await getArcGisLayers(provider)
      }))
    );

    ok(res, { layers }, providers.map((provider) => provider.attribution));
  } catch (error) {
    fail(res, 502, {
      code: 'provider_error',
      message: 'Failed to read public municipal GIS layer metadata.',
      details: error instanceof Error ? error.message : error
    });
  }
});

app.get('/parcel/by-admin', (req, res) => {
  const required = ['city', 'district', 'neighborhood', 'block', 'parcel'];
  const missing = required.filter((name) => !stringQuery(req, name));
  if (missing.length > 0) {
    fail(res, 400, {
      code: 'bad_request',
      message: `Missing required query parameters: ${missing.join(', ')}`
    });
    return;
  }

  const tkgm = registry.tkgm();
  if (!tkgm.enabled) {
    fail(res, 403, {
      code: 'provider_requires_permission',
      message: 'Parcel lookup by administrative identifiers requires a permission-gated TKGM server adapter configuration.',
      providerId: tkgm.id
    });
    return;
  }

  fail(res, 501, {
    code: 'unsupported_operation',
    message: 'TKGM permission is configured, but the parcel-by-admin adapter implementation has not been enabled in this build.',
    providerId: tkgm.id
  });
});

app.get('/parcel/by-point', (req, res) => {
  const point = readPoint(req, res);
  if (!point) {
    return;
  }

  const tkgm = registry.tkgm();
  if (!tkgm.enabled) {
    fail(res, 403, {
      code: 'provider_requires_permission',
      message: 'Parcel lookup by point requires a permission-gated TKGM server adapter configuration.',
      providerId: tkgm.id
    });
    return;
  }

  fail(res, 501, {
    code: 'unsupported_operation',
    message: 'TKGM permission is configured, but the parcel-by-point adapter implementation has not been enabled in this build.',
    providerId: tkgm.id
  });
});

app.get('/plan/by-parcel', async (req, res) => {
  const city = stringQuery(req, 'city');
  const point = req.query.lat || req.query.lng ? readPoint(req, res) : undefined;

  if (req.query.lat || req.query.lng) {
    if (!point) {
      return;
    }
  } else {
    const required = ['city', 'district', 'neighborhood', 'block', 'parcel'];
    const missing = required.filter((name) => !stringQuery(req, name));
    if (missing.length > 0) {
      fail(res, 400, {
        code: 'bad_request',
        message: `Provide lat/lng for public plan lookup or complete parcel identifiers. Missing: ${missing.join(', ')}`
      });
      return;
    }

    fail(res, 403, {
      code: 'provider_requires_permission',
      message: 'Plan lookup from parcel identifiers first requires permission-gated parcel geometry resolution.',
      providerId: registry.tkgm().id
    });
    return;
  }

  const providers = registry.municipalForCity(city);
  if (providers.length === 0) {
    fail(res, 404, {
      code: 'not_configured',
      message: 'No enabled public municipal GIS plan provider is configured for the requested city.'
    });
    return;
  }

  try {
    const settled = await Promise.allSettled(
      providers.map(async (provider) => ({
        providerId: provider.id,
        features: await queryPlanLayersByPoint(provider, point)
      }))
    );
    const plans = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value.features : []));

    ok(
      res,
      {
        query: { city, point },
        plans,
        unavailableProviders: settled.flatMap((result, index) =>
          result.status === 'rejected'
            ? [{ providerId: providers[index].id, error: result.reason instanceof Error ? result.reason.message : result.reason }]
            : []
        )
      },
      providers.map((provider) => provider.attribution)
    );
  } catch (error) {
    fail(res, 502, {
      code: 'provider_error',
      message: 'Failed to query public municipal GIS plan layers.',
      details: error instanceof Error ? error.message : error
    });
  }
});

app.get('/city-map/metadata', (_req, res) => {
  const providers = registry.providersForCity('istanbul').filter((provider) => provider.kind === 'public_city_map');
  ok(res, { providers }, providers.map((provider) => provider.attribution));
});

app.get('/e-plan/metadata', (_req, res) => {
  const provider = registry.ePlan();
  ok(res, { provider }, [provider.attribution]);
});

app.use((_req, res) => {
  fail(res, 404, {
    code: 'unsupported_operation',
    message: 'Unknown gateway endpoint.'
  });
});

export const api = onRequest({ cors: true, region: 'europe-west1' }, app);
