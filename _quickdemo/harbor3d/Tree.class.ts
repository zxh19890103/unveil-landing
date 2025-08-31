import { ModelObj } from "@/_shared/ModelObj.class.js";

const trees = {
  "real_tree_models": {
    scaleFactor: 0.07,
  },
  "fir_tree": {
    scaleFactor: 0.5,
  },
  "beech_tree": {
    scaleFactor: 0.5
  },
  "oak_tree": {
    scaleFactor: 0.2
  }
};

type TreeType = keyof typeof trees;

const treesKeys = Object.keys(trees);
const treesLength = treesKeys.length;

const getRandom = () => {
  return treesKeys[Math.floor(Math.random() * treesLength)];
};

export class Tree extends ModelObj {
  constructor(tree: TreeType = null) {
    const key = tree ?? getRandom();

    super(`/quickdemo/harbor3d/${key}/scene.gltf`, "tree", 0xde9103, {
      rotation: [0, 0, 0],
      offset: [0, 0, 0],
      scaleFactor: 0.3,
      scaleFactorToSee: 0.3,
      visibleDistance: 64,
      ...trees[key],
    });
  }
}
