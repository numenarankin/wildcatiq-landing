/**
 * landing: the global `GeoJSON` namespace the app gets from mapbox-gl's
 * `@types/geojson` dependency. Only what the copied Recon libs reference.
 */
declare namespace GeoJSON {
  type Position = number[];
  type GeoJsonProperties = { [name: string]: unknown } | null;
  interface Geometry {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coordinates: any;
  }
  interface Feature<G = Geometry, P = GeoJsonProperties> {
    type: "Feature";
    id?: string | number;
    geometry: G;
    properties: P;
  }
  interface FeatureCollection<G = Geometry, P = GeoJsonProperties> {
    type: "FeatureCollection";
    features: Array<Feature<G, P>>;
  }
}
