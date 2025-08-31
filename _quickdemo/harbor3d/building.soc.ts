import * as THREE from "three";
import { whenReady } from "@/_shared/SoCFramework.js";
import { Building } from "./Building.class.js";

whenReady((world, camera, _, controls) => {
  const building = new Building();
  // const building2 = new Building();
  world.add(building);
  world.add(new THREE.AxesHelper(6));
});
