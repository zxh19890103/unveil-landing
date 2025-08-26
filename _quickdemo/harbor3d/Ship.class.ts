import { ModelObj } from "@/_shared/ModelObj.class.js";

export class Ship extends ModelObj {
  readonly $$type = 'ship';

  constructor() {
    super(
      "./cargo_ship/scene.gltf",
      "/quickdemo/harbor3d/icons/ship.svg",
      0x0d1e93,
      {
        offset: [0, -1.5, 0],
        rotation: [0, 1, 0],
        scaleFactor: 0.1,
      }
    );
  }
}
