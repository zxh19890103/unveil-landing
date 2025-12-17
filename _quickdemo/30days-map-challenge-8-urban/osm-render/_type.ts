type LngLat = [number, number];

export type GeometryPolygon = LngLat[];
export type GeometryPolygonFeature = {
  properties: any;
  type: "Feature";
  id: string;
  geometry: {
    type: "Polygon";
    coordinates: GeometryPolygon[];
  };
};

export type GeoJson = {
  features: GeometryPolygonFeature[];
};
