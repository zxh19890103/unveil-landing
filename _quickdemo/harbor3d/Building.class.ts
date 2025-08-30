import * as THREE from "three";
import { ModelObj } from "@/_shared/ModelObj.class.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 *       `/quickdemo/harbor3d/multi_family_resident_1/scene.gltf`,
      "tree",
      0xde9103,
      {
        rotation: [0, 0, 0],
        offset: [-136, 14.5, -30],
        scaleFactor: 0.1,
        scaleFactorToSee: 3,
        visibleDistance: 32,
      }


            `/quickdemo/harbor3d/free_lowpoly_3d_models_house/scene.gltf`,
      "tree",
      0xde9103,
      {
        rotation: [0, 0, 0],
        offset: [-414.5, 2.4, 648.7],
        scaleFactor: 0.07,
        scaleFactorToSee: 3,
        visibleDistance: 32,
      }


            `/quickdemo/harbor3d/eco_tower/scene.gltf`,
      "tree",
      0xde9103,
      {
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        scaleFactor: 0.05,
        scaleFactorToSee: 3,
        visibleDistance: 32,
      }


            `/quickdemo/harbor3d/guangzhou_ctf_finance_centre/scene.gltf`,
      "tree",
      0xde9103,
      {
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        scaleFactor: 0.02,
        scaleFactorToSee: 3,
        visibleDistance: 32,
      }

      residential_complex_modern_apartment_building

      0.05
 */

export class Building extends ModelObj {
  constructor() {
    super(
      `/quickdemo/harbor3d/eco_tower/scene.gltf`,
      "tree",
      0xde9103,
      {
        rotation: [0, 0, 0],
        offset: [0, 0, 0],
        scaleFactor: 0.032,
        scaleFactorToSee: 3,
        visibleDistance: 32,
      }
    );
  }

  gltfTransform(gltf: GLTF) {
    console.log(gltf.scene.children[0]);
    return gltf.scene.children[0];
  }
}
