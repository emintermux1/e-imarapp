import { findStructuredParcel, parseCoordinateQuery, structuredParcelLabel } from '../apps/e_imar_web/src/lib/search/mvp-query';
import { getAllParcels } from '../apps/e_imar_web/src/data/parcels';

describe('canonical web MVP parcel query flow helpers', () => {
  it('resolves structured il/ilçe/mahalle/ada/parsel input to a selectable parcel', () => {
    const parcel = getAllParcels()[0];
    expect(parcel).toBeDefined();

    const result = findStructuredParcel({
      il: parcel.properties.il,
      ilce: parcel.properties.ilce,
      mahalle: parcel.properties.mahalle,
      ada: parcel.properties.ada,
      parsel: parcel.properties.parsel
    });

    expect(result?.properties.id).toBe(parcel.properties.id);
    expect(structuredParcelLabel({
      il: parcel.properties.il,
      ilce: parcel.properties.ilce,
      mahalle: parcel.properties.mahalle,
      ada: parcel.properties.ada,
      parsel: parcel.properties.parsel
    })).toContain(`${parcel.properties.ada}/${parcel.properties.parsel}`);
  });

  it('accepts coordinate queries in lat/lng or lng/lat order inside Turkey', () => {
    expect(parseCoordinateQuery('41.04321, 29.00821')).toEqual({ lat: 41.04321, lng: 29.00821 });
    expect(parseCoordinateQuery('29.00821 41.04321')).toEqual({ lat: 41.04321, lng: 29.00821 });
    expect(parseCoordinateQuery('1, 1')).toBeNull();
  });
});
