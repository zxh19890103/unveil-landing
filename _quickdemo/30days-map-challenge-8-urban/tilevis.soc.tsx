import * as THREE from "three";
import { whenReady } from "@/_shared/SoCFramework.js";

whenReady((world, camera, renderer, controls) => {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(1),
    new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0xffffff,
    })
  );

  world.add(ball);

  const Pt = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0)]),
    new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      color: 0xfe0010,
    })
  );

  controls.addEventListener("change", () => {
    Pt.geometry.setFromPoints([
      new THREE.Vector3(0, 0, 0).copy(camera.position).setLength(1.1),
    ]);
  });

  world.add(Pt);
});
