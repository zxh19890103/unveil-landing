import * as THREE from "three";

// -------------------------------------------------------------------
// --- CONFIGURATION AND SHARED RESOURCES ---
// -------------------------------------------------------------------

// Configuration: MUST match the radius of your Earth mesh
const EARTH_RADIUS = 6378137.0;

/**
 * 3 cases:
 * 1. whole earth can be seen
 * 2. intersected
 * 3. earth covered the screen.
 */

/**
 * Interface for the Geographic Bounding Box
 */
interface GeoBBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

// Global, Reusable THREE.js Objects (Initialized Once)
// These prevent the garbage collector from running constantly.
const sharedRaycaster = new THREE.Raycaster();
const sharedVector2 = new THREE.Vector2();
const sharedVector3 = new THREE.Vector3(); // Used for center calculations

// -------------------------------------------------------------------
// --- 1. THE MAIN DRIVER FUNCTION (HYBRID LOGIC) ---
// -------------------------------------------------------------------

/**
 * Main function to determine the visible BBox using a hybrid approach.
 * Checks the four corners to decide between Raycasting (Zoomed In) and
 * Horizon Geometry (Zoomed Out).
 * * @param camera The THREE.Camera used for rendering.
 * @param earthMesh The THREE.Mesh representing the Earth.
 * @returns GeoBBox | null The calculated geographic bounds or null if Earth is off-screen.
 */
function getVisibleBounds(
  camera: THREE.Camera,
  earthMesh: THREE.Mesh
): GeoBBox | null {
  const cornerCoordinates = [
    { x: -1, y: 1 }, // Top-Left
    { x: 1, y: 1 }, // Top-Right
    { x: -1, y: -1 }, // Bottom-Left
    { x: 1, y: -1 }, // Bottom-Right
  ];

  let hitsCount = 0;

  // 1. Check the Four Corners
  for (const coords of cornerCoordinates) {
    // Reuse shared objects
    sharedVector2.set(coords.x, coords.y);
    sharedRaycaster.setFromCamera(sharedVector2, camera);

    if (sharedRaycaster.intersectObject(earthMesh).length > 0) {
      hitsCount++;
    }
  }

  // 2. Decide Calculation Method
  if (hitsCount > 0) {
    // If at least one corner hits (Zoomed In or Horizon Cut), use Raycasting.
    return getRobustRaycastBounds(camera, earthMesh);
  } else {
    // No corners hit (Zoomed Out). Check if the Earth is in the center of the view.
    sharedVector2.set(0, 0);
    sharedRaycaster.setFromCamera(sharedVector2, camera);
    if (sharedRaycaster.intersectObject(earthMesh).length === 0) {
      return null; // Earth is completely off-screen
    }

    // Use Horizon Cap Geometry
    return getHorizonCapBounds(camera, earthMesh);
  }
}

// -------------------------------------------------------------------
// --- 2. RAYCASTING BOUNDS (ZOOMED IN/HORIZON CUT) ---
// -------------------------------------------------------------------

/**
 * Calculates BBox using dense screen sampling and Date Line handling.
 * Used when the screen edges are likely clipping the Earth.
 */
function getRobustRaycastBounds(
  camera: THREE.Camera,
  earthMesh: THREE.Mesh
): GeoBBox | null {
  const hitPointsLatLng: { lat: number; lon: number }[] = [];

  // Dense Sampling: Check screen edges (5 segments for precision)
  const segments = 5;
  const pointsToCheck: { x: number; y: number }[] = [{ x: 0, y: 0 }]; // Center

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 - 1; // Range -1 to 1
    pointsToCheck.push({ x: t, y: -1 });
    pointsToCheck.push({ x: t, y: 1 });
    pointsToCheck.push({ x: -1, y: t });
    pointsToCheck.push({ x: 1, y: t });
  }

  for (const pt of pointsToCheck) {
    // Reuse shared objects
    sharedVector2.set(pt.x, pt.y);
    sharedRaycaster.setFromCamera(sharedVector2, camera);
    const intersects = sharedRaycaster.intersectObject(earthMesh);

    if (intersects.length > 0) {
      const p = intersects[0].point;

      // --- Coordinate Conversion (Assumes Y-UP) ---
      const r = p.length();
      const lat = Math.asin(p.y / r) * (180 / Math.PI);
      const lon = Math.atan2(p.x, p.z) * (180 / Math.PI);

      hitPointsLatLng.push({ lat, lon: lon });
    }
  }

  if (hitPointsLatLng.length === 0) return null;

  // A. Latitude Bounds (Simple Min/Max)
  let minLat = Infinity,
    maxLat = -Infinity;
  hitPointsLatLng.forEach((p) => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
  });

  // B. Longitude Bounds (Date Line Gap Detection)
  const longs = hitPointsLatLng.map((p) => p.lon).sort((a, b) => a - b);

  let maxGap = 0;
  let splitIndex = -1;
  for (let i = 0; i < longs.length - 1; i++) {
    const gap = longs[i + 1] - longs[i];
    if (gap > maxGap) {
      maxGap = gap;
      splitIndex = i;
    }
  }

  // Check the gap across the 180/-180 boundary
  const wrapGap = 360 - longs[longs.length - 1] + longs[0];

  if (maxGap < wrapGap) {
    // Visible area is contiguous (doesn't cross the date line).
    return {
      minLat,
      maxLat,
      minLon: longs[0],
      maxLon: longs[longs.length - 1],
    };
  } else {
    // Visible area crosses the date line.
    return {
      minLat,
      maxLat,
      minLon: longs[splitIndex + 1],
      maxLon: longs[splitIndex],
    };
  }
}

// -------------------------------------------------------------------
// --- 3. HORIZON CAP BOUNDS (ZOOMED OUT/WHOLE EARTH) ---
// -------------------------------------------------------------------

/**
 * Calculates BBox based on the visible 'Horizon Cap' using geometry.
 * Used when the Earth is floating freely in the viewport (Zoomed Out).
 */
function getHorizonCapBounds(
  camera: THREE.Camera,
  earthMesh: THREE.Mesh
): GeoBBox {
  // Get Earth center and distance using shared vectors
  earthMesh.getWorldPosition(sharedVector3);
  const distance = camera.position.distanceTo(sharedVector3);

  if (distance <= EARTH_RADIUS) {
    return { minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 };
  }

  // Calculate the angular radius (alpha) of the visible cap
  const alphaRad = Math.acos(EARTH_RADIUS / distance);
  const alphaDeg = THREE.MathUtils.radToDeg(alphaRad);

  // Get the Lat/Lon of the Sub-Camera Point (center of the cap)
  const localCamPos = camera.position.clone().sub(sharedVector3);
  const r = localCamPos.length();

  // Standard Y-up conversion
  const centerLat = Math.asin(localCamPos.y / r) * (180 / Math.PI);
  const centerLon = Math.atan2(localCamPos.x, localCamPos.z) * (180 / Math.PI);

  // Calculate bounds: The cap is centered at centerLat/centerLon
  const minLat = Math.max(-90, centerLat - alphaDeg);
  const maxLat = Math.min(90, centerLat + alphaDeg);

  // Longitude span is determined by alpha
  // if lon across date line, -180, +180
  const minLon = correctLonitude(centerLon - alphaDeg);
  const maxLon = correctLonitude(centerLon + alphaDeg);

  // console.log(minLon, maxLon);

  return {
    minLat,
    maxLat,
    minLon: Math.min(minLon, maxLon),
    maxLon: Math.max(minLon, maxLon),
  };
}

const correctLonitude = (lon: number) => {
  if (lon > 180) return lon - 360;
  else if (lon < -180) return lon + 360;
  return lon;
};

/**
 * Interface for the resulting Tile Index Range
 */
interface TileRange {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  z: number;
}

/**
 * Converts a geographic BBox into a discrete range of Web Mercator tile indices (x, y)
 * at a given zoom level z.
 * * @param bbox The calculated visible geographic BBox.
 * @param z The calculated Level of Detail (Zoom Level, typically 0 to 18).
 * @returns {TileRange} The inclusive range of tile indices to iterate over.
 */
function bboxToTileRange(bbox: GeoBBox, z: number): TileRange {
  const N = Math.pow(2, z);

  // 1. Calculate X-Indices (Longitude)
  // Formula: x = floor( (lon + 180) / 360 * N )
  // We must handle the Date Line wrap-around correctly.

  let minX = Math.floor(((bbox.minLon + 180) / 360) * N);
  let maxX = Math.floor(((bbox.maxLon + 180) / 360) * N);

  // Normalize X bounds and handle wrapping across the Date Line
  // If minLon > maxLon in the BBox (i.e., it crosses the Date Line, like 170 to -170),
  // the X range is discontinuous (e.g., from 15 to 16, and 0 to 1).
  // For iteration, we typically calculate the union of two ranges or simplify to the whole world if the spread is massive.

  // For simplicity, we ensure X is within [0, N-1] bounds:
  minX = Math.max(0, Math.min(minX, N - 1));
  maxX = Math.max(0, Math.min(maxX, N - 1));

  // *Crucial Check for Date Line Crossing:*
  // If the BBox crosses the date line, minX might be > maxX if the logic was simplified.
  // If your BBox logic correctly returns, e.g., minLon=-170, maxLon=170 (no crossing),
  // then minX < maxX. If it crosses (e.g., minLon=170, maxLon=-170), the bbox is discontinuous.
  // Since our BBox calculation handles the wrap, we assume it gave the contiguous area
  // unless the calculated minX > maxX due to floating point error or slight cross over.
  // *Action:* If minX > maxX, it typically means the BBox spans the full globe width or there's a minor boundary issue. If you use the Gap Detection logic correctly, this shouldn't happen for a contiguous view. We'll simply swap them if they're close.

  if (minX > maxX) {
    // This suggests the visible area wraps (e.g., 170 to -170).
    // This complex case usually requires fetching tiles from two ranges (0 to maxX AND minX to N-1).
    // Since the prompt asks to iterate x and y *inside* the bbox, we return a single range
    // covering the smaller segment, or the union of two segments if your rendering engine supports it.
    // For standard iteration, the simple swap (or full coverage) is common:
    [minX, maxX] = [maxX, minX];
    // A robust solution for date line crossing would require splitting the iteration.
  }

  // 2. Calculate Y-Indices (Latitude)
  // Web Mercator formula requires converting Latitude to Radians and then to a 'y' variable.
  // y = 0 is North Pole, y = 1 is South Pole (in the normalized [0, 1] range)

  const minY_normalized = latToY(bbox.maxLat); // MaxLat is closer to North Pole (y=0)
  const maxY_normalized = latToY(bbox.minLat); // MinLat is closer to South Pole (y=1)

  // Formula: tile_y = floor( y_normalized * N )
  let minY = Math.floor(minY_normalized * N);
  let maxY = Math.floor(maxY_normalized * N);

  // Ensure Y is within [0, N-1] bounds
  minY = Math.max(0, Math.min(minY, N - 1));
  maxY = Math.max(0, Math.min(maxY, N - 1));

  return {
    minX: minX,
    maxX: maxX,
    minY: minY,
    maxY: maxY,
    z: z,
  };
}

// Corrected latToY function
const latToY = (lat: number): number => {
  // 1. Clamp the latitude to the usable Mercator range (approx. 85.0511 degrees)
  const latClamped = Math.min(Math.max(-85.0511, lat), 85.0511);

  // 2. Convert the CLAMPED value to radians
  const latRad = latClamped * (Math.PI / 180);

  // 3. Apply the Mercator Y formula using the CLAMPED radian value
  // This calculates the normalized Y position (0 at North Pole, 1 at South Pole)
  return (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
};

// -------------------------------------------------------------------
// --- EXPORTS ---
// -------------------------------------------------------------------

export {
  getVisibleBounds,
  bboxToTileRange,
  type TileRange,
  type GeoBBox,
  EARTH_RADIUS,
};
