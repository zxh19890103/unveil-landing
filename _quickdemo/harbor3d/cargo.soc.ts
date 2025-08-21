import * as THREE from "three";
import { whenReady } from "@/_shared/SoCFramework.js";

whenReady((world, camera) => {
  world.add(new THREE.DirectionalLight(0xffffff, 1.2));
  world.add(new THREE.AmbientLight(0xffffff, 1.2));

  const cargoGeo = new THREE.BoxGeometry(1, 1, 2);

  const loader = new THREE.TextureLoader();

  const texture = loader.load("/quickdemo/harbor3d/cargo.jpg");

  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.NearestFilter;

  const cargo = new THREE.Mesh(
    cargoGeo,
    new THREE.MeshPhongMaterial({
      map: texture,
    })
  );

  world.add(cargo);
});
