import { sphereToLatlng } from "@/30days-map-challenge-shared/core/clac.js";
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
export function getWorldBBox(
  camera: THREE.Camera,
  earthMesh: THREE.Object3D,
  top = 1
) {
  const cornerCoordinates = [
    { x: -1, y: top }, // Top-Left
    { x: 1, y: top }, // Top-Right
    { x: -1, y: -1 }, // Bottom-Left
    { x: 1, y: -1 }, // Bottom-Right
  ];

  const points = [];

  // 1. Check the Four Corners
  for (const coords of cornerCoordinates) {
    // Reuse shared objects
    sharedVector2.set(coords.x, coords.y);
    sharedRaycaster.setFromCamera(sharedVector2, camera);
    const ob = sharedRaycaster.intersectObject(earthMesh, true)[0];
    if (ob) {
      points.push(sphereToLatlng(ob.point));
    } else {
      points.push(null);
    }
  }

  return points;
}
