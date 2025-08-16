export type LngLat = [number, number];
export type XY = [number, number];
export type XYZ = [number, number, number];

class GeoMercator {
  private λ0: number = 116.3974; // longitude center
  private φ0: number = 40; // latitude center
  private scaleFactorLon: number = 1;
  private scaleFactorLat: number = 80;
  private translateX: number = 0;
  private translateY: number = 0;

  constructor(
    scaleLon = 1,
    scaleLat = 80,
    centerLon = 116.3974,
    centerLat = 40
  ) {
    this.λ0 = centerLon;
    this.φ0 = centerLat;

    this.scaleFactorLon = scaleLon;
    this.scaleFactorLat = scaleLat;
  }

  project([λ, φ]: LngLat): XY {
    const x = this.scaleFactorLon * (λ - this.λ0) + this.translateX;
    const y =
      this.scaleFactorLat *
        Math.log(Math.tan(Math.PI / 4 + ((φ - this.φ0) * Math.PI) / 360)) +
      this.translateY;
    return [x, y];
  }

  getCenter() {
    return [this.λ0, this.φ0];
  }

  center([λc, φc]: LngLat): this {
    this.λ0 = λc;
    this.φ0 = φc;
    return this;
  }

  scale(k: number): this {
    this.scaleFactorLon = k;
    return this;
  }

  translate([x, y]: XY): this {
    this.translateX = x;
    this.translateY = y;
    return this;
  }
}

export function geoMercator(
  scaleLon = 1,
  scaleLat = 80,
  centerLon = 116.3974,
  centerLat = 40
): GeoMercator {
  return new GeoMercator(scaleLon, scaleLat, centerLon, centerLat);
}
