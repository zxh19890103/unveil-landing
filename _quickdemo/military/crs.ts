import * as THREE from "three";
import { geoMercator, type LngLat } from "@/_shared/geo-mercator.js";

export const _geoMercator = geoMercator();

export const setLngLat = (object3d: THREE.Object3D, lnglat: LngLat) => {
  const xy = _geoMercator.project(lnglat);
  object3d.position.x = xy[0];
  object3d.position.y = xy[1];
};

export const lngLat = (lng: number, lat: number): THREE.Vector3 => {
  const xy = _geoMercator.project([lng, lat]);
  return new THREE.Vector3(xy[0], xy[1], 0);
};

export const lngLatOffset = (lng: number, lat: number): THREE.Vector3 => {
  const center = _geoMercator.getCenter();
  const xy = _geoMercator.project([center[0] + lng, center[1] + lat]);
  return new THREE.Vector3(xy[0], xy[1], 0);
};
