export type Point = {
  lat: number;
  lng: number;
};

const turkeyBounds = {
  minLat: 35.75,
  maxLat: 42.25,
  minLng: 25.5,
  maxLng: 45.0
};

export const parseNumber = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const isInsideTurkeyBounds = ({ lat, lng }: Point): boolean =>
  lat >= turkeyBounds.minLat &&
  lat <= turkeyBounds.maxLat &&
  lng >= turkeyBounds.minLng &&
  lng <= turkeyBounds.maxLng;
