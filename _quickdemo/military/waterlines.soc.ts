import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";

import {
  __lights__,
  animationLoop,
  whenReady,
} from "@/_shared/SoCFramework.js";
import { ModelObj } from "@/_shared/ModelObj.class.js";
import { quickdemoAssets } from "@/_shared/assets-map.js";

whenReady((scene) => {
  scene.add(new THREE.AxesHelper(20000));

  // --- Create a simple "Boat" (a cube for visualization) ---
  const boatGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boatMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // 棕色
  const boat = new THREE.Mesh(boatGeometry, boatMaterial);
  boat.position.y = 1; // 讓船稍微浮起來
  scene.add(boat);

  const speed = 0.3;


  


  animationLoop((delta) => {
    boat.position.z += speed * delta;
  });
});
