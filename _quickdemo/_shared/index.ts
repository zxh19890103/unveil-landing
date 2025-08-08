import * as THREE from "three";
import MacWindow from "./Win.js";

export { ThreeJsSetup } from "./ThreeJsSetup.class.js";
export { geoMercator } from "./geo-mercator.js";
export { quickdemoAssets } from "./assets-map.js";
export { ImageObj } from "./ImageObj.class.js";
export { ModelObj } from "./ModelObj.class.js";
export { createWave } from "./Wave.class.js";
export * as sounds from "./sounds.js";
export { MacWindow };

/**
 * Slice a partial segment from a THREE.Curve.
 * @param curve - The input curve.
 * @param tStart - Start position (0 to 1).
 * @param tEnd - End position (0 to 1).
 * @param segments - Number of points to sample.
 * @returns A new CatmullRomCurve3 representing the sliced segment.
 */
export function sliceCurve(
  curve: THREE.Curve<THREE.Vector3>,
  tStart: number = 0,
  tEnd: number = 1,
  segments: number = 50
): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = tStart + (tEnd - tStart) * (i / segments);
    points.push(curve.getPointAt(t));
  }

  return new THREE.CatmullRomCurve3(points);
}
