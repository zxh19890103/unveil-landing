/**
 * EPSG:3857 (Web Mercator)
 */
const R = 6378137.0;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const MAX_LAT = 85.05112877980659;
const CIRCLE_LENGTH_OF_EARTH = 2 * Math.PI * R;
const TILE_SIZE_PIXELS = 256;

export function lonLatToMercator(lon, lat) {
  // clamp latitude
  const clampedLat = Math.max(Math.min(lat, MAX_LAT), -MAX_LAT);
  const lambda = lon * DEG2RAD;
  const phi = clampedLat * DEG2RAD;
  const x = R * lambda;
  const y = R * Math.log(Math.tan(Math.PI / 4 + phi / 2));
  return { x, y, z: 0 };
}
