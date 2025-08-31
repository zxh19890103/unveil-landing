import * as THREE from "three";
import {
  ModelObj,
  type ModelInitializationParams,
} from "@/_shared/ModelObj.class.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { KmlParsedResBuilding } from "@/_shared/kml.js";

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

const buildingOpts = {
  eco_tower: {
    _type: "tower",
    scaleFactor: 0.032,
  },
  guangzhou_ctf_finance_centre: {
    _type: "office",
    scaleFactor: 0.015,
  },
  multi_family_resident_1: {
    _type: "villa",
    offset: [-136, 14.5, -30] as THREE.Vector3Tuple,
    scaleFactor: 0.1,
  },
  free_lowpoly_3d_models_house: {
    _type: "villa",
    offset: [-414.5, 2.4, 648.7] as THREE.Vector3Tuple,
    scaleFactor: 0.06,
  },
  residential_complex_modern_apartment_building: {
    _type: "residential",
    scaleFactor: 0.05,
    offset: [0, 8, 0] as THREE.Vector3Tuple,
  },
  hi_rise_apartment_building: {
    _type: "residential",
    scaleFactor: 0.0002,
    offset: [0, 0, 0] as THREE.Vector3Tuple,
  },
};

type BuildingType = keyof typeof buildingOpts;

export const queryBuildingType = (type: string): BuildingType => {
  switch (type) {
    case "office": {
      return "guangzhou_ctf_finance_centre";
    }
    case "residential": {
      return "hi_rise_apartment_building";
    }
    case "tower": {
      return "eco_tower";
    }
    case "villa": {
      return "multi_family_resident_1";
    }
  }
};

export class Building extends ModelObj {
  constructor(name: BuildingType = "hi_rise_apartment_building") {
    super(`/quickdemo/harbor3d/${name}/scene.gltf`, "tree", 0xde9103, {
      rotation: [0, 0, 0],
      offset: [0, 0, 0],
      scaleFactor: 0.032,
      scaleFactorToSee: 0.032,
      visibleDistance: 64,
      ...buildingOpts[name],
    });
  }
}
