import type { Vector3 } from "three";

/**
 * EPSG:3857 (Web Mercator)
 */
const R = 6378137.0;
/**
 * on polars
 */
const R1 = 6.356752 * 1e6;
/**
 * on equator
 */
const R2 = 6.378137 * 1e6;
const DR21 = R2 - R1;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const MAX_LAT = 85.05112877980659;
/**
 * meters
 */
const EARTH_CIRCUMFERENCE = 2 * Math.PI * R;
/**
 * texel
 */
const TILE_SIZE_PIXELS = 256;
/**
 * Factor to calculate mpp;
 */
const TILES_COUNT_ON_EQUATOR = EARTH_CIRCUMFERENCE / TILE_SIZE_PIXELS;

export function lonLatToMercator(lon: number, lat: number) {
  // clamp latitude
  const clampedLat = Math.max(Math.min(lat, MAX_LAT), -MAX_LAT);
  const lambda = lon * DEG2RAD;
  const phi = clampedLat * DEG2RAD;
  const x = R * lambda;
  const y = R * Math.log(Math.tan(Math.PI / 4 + phi / 2));
  return { x, y, z: 0 };
}

export function mercatorToLonLat(x, y): Geo.LatLng {
  const lon = (x / R) * RAD2DEG;
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * RAD2DEG;
  return { lon, lat, alt: 0 };
}

export function latLonToTile(lat: number, lon: number, zoom: number) {
  const latRad = lat * DEG2RAD;
  const n = Math.pow(2, zoom);
  const x = n * ((lon + 180) / 360);
  const y =
    (n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2;
  return [Math.floor(x), Math.floor(y)];
}

export const getEarthRadiusOnLat = (lat: number) => {
  return R2 - DR21 * Math.pow(Math.sin(lat * DEG2RAD), 2);
};

export const latlngToSphere = ({
  lat,
  lon,
  lng,
}: {
  lng?: number;
  lat: number;
  lon?: number;
}) => {
  const latRad = lat * DEG2RAD;
  const lngRad = (lon ?? lng) * DEG2RAD;

  const R = getEarthRadiusOnLat(lat);
  const r = R * Math.cos(latRad);

  return {
    x: r * Math.sin(lngRad),
    y: R * Math.sin(latRad),
    z: r * Math.cos(lngRad),
  };
};

export const sphereToLatlng = ({
  x,
  y,
  z,
}: {
  x: number;
  y: number;
  z: number;
}) => {
  // 1. Calculate Radius
  const r = Math.hypot(x, y, z);

  // Safety check: If point is at (0,0,0), return 0
  if (r === 0) return { lat: 0, lng: 0 };

  // 2. Calculate Latitude (Phi)
  // Since Y is Up, we use asin(y / r) to get the angle from the XZ plane.
  const latRad = Math.asin(y / r);

  // 3. Calculate Longitude (Theta)
  // The angle is now on the XZ plane.
  // Standard Math: atan2(z, x) usually puts 0 degrees at the positive X axis.
  const lngRad = Math.atan2(x, z);

  // 4. Convert to Degrees
  const radToDeg = 180 / Math.PI;

  return {
    lat: latRad * radToDeg,
    lng: lngRad * radToDeg,
  };
};

/**
 * If you ever need to get the top-left corner latitude/longitude of a tile:
 *  */
export function tileToLatLon(x: number, y: number, zoom: number): Geo.LatLng {
  const n = Math.pow(2, zoom);
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = latRad * RAD2DEG;
  return { lat, lon };
}

/**
 * get the count of pixels `one meter` contains on the screen.
 * `one meter` means `1` in threejs.
 */
export function pixelsPerMeter(
  camera: Camera,
  screenHeightPx: number,
  lat: number
) {
  const fovRad = camera.fov * DEG2RAD;
  const r = getEarthRadiusOnLat(lat);
  const heightInMeters = camera.position.length() - r;
  console.log(heightInMeters);
  const visibleWorldHeight = 2 * heightInMeters * Math.tan(fovRad / 2);
  return screenHeightPx / visibleWorldHeight;
}

export function getCameraDistanceFromEarthSurface(camera: Camera, lat: number) {
  const r = getEarthRadiusOnLat(lat);
  return camera.position.length() - r;
}

/**
 * resolution def:
 */
export function zoomToResolution(z: number, lat: number) {
  /**
   * meters per pixel:
   */
  const mpp = TILES_COUNT_ON_EQUATOR / Math.pow(2, z);
  return mpp * Math.cos(lat * DEG2RAD);
}

function resolutionToZoom(resolution: number, lat: number) {
  const latFactor = Math.cos(lat * DEG2RAD);
  const mpp = resolution / latFactor;
  const power = TILES_COUNT_ON_EQUATOR / mpp;
  return Math.log2(power);
}

export function getScaleZoom(ppm: number, lat: number) {
  const resolution = 1 / ppm;
  return resolutionToZoom(resolution, lat);
}

export function getZoomScale(z: number) {
  return TILES_COUNT_ON_EQUATOR / Math.pow(2, z);
}

export function getTileZoomLevel(
  ppm: number,
  lat: number,
  adjustment: number = 0,
  max = 19
) {
  const resolution = 1 / ppm;
  let zoom = Math.round(resolutionToZoom(resolution, lat));
  zoom = Math.min(max, Math.max(zoom, 0));
  zoom += adjustment;
  zoom = Math.min(max, Math.max(zoom, 0));
  return zoom;
}

type Camera = {
  fov: number;
  position: Vector3;
};
