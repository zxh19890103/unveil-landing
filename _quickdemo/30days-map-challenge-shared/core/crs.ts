import { lonLatToMercator, mercatorToLonLat } from "./clac.js";

type LngLatTuple = [number, number, number?];
type LatLngTuple = [number, number, number?];
type LngLat = { lon: number; lat: number; alt?: number };
type Position = { x: number; y: number; z: number };

export class CRS {
  private readonly originX: number;
  private readonly originY: number;
  readonly center: Position;

  constructor(readonly origin: LatLngTuple) {
    const xy = lonLatToMercator(origin[1], origin[0]);
    this.originX = xy.x;
    this.originY = xy.y;

    this.center = xy;
  }

  project(lnglat: LngLatTuple) {
    const xy = lonLatToMercator(lnglat[0], lnglat[1]) as Position;
    xy.x -= this.originX;
    xy.y -= this.originY;
    xy.z = 0;
    return xy;
  }

  projectLatLng(latlng: LatLngTuple) {
    const xy = lonLatToMercator(latlng[1], latlng[0]) as Position;
    xy.x -= this.originX;
    xy.y -= this.originY;
    xy.z = 0;
    return xy;
  }

  unproject(pos: Position) {
    const x = pos.x + this.originX;
    const y = pos.x + this.originY;
    const lnglat = mercatorToLonLat(x, y);
    lnglat.alt = pos.z;
    return lnglat;
  }
}

export type { LatLngTuple, LngLatTuple, LngLat, Position };
