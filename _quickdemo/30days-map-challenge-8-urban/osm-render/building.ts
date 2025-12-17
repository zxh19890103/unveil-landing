import * as THREE from "three";
import type { GeoJson } from "./_type.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import { latlngToSphere } from "@/30days-map-challenge-shared/core/clac.js";

export default (geojson: GeoJson) => {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({ color: 0xfe01a0 });

  for (const { geometry, properties } of geojson.features) {
    if (geometry.type === "Polygon") {
      for (const polygon of geometry.coordinates) {
        const points = polygon.map((coord) => {
          return new THREE.Vector3().copy(
            latlngToSphere({ lat: coord[1], lng: coord[0] })
          );
        });

        const geometry = new ConvexGeometry(points);
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
      }
    }
  }

  return group;
};
