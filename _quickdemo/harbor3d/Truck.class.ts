import { ModelObj } from "@/_shared/ModelObj.class.js";

export class Truck<UD extends Record<string, any> = {}> extends ModelObj {
  readonly $$type = 'truck';
  readonly userData: UD;

  constructor() {
    super(
      "./generic_truck/scene.gltf",
      "/quickdemo/harbor3d/icons/truck.svg",
      0xeaa301,
      {
        offset: [0, 0, 0],
        rotation: [0, -1, 0],
        scaleFactor: 0.001,
      }
    );

    this.traverse((child) => {
      if (Object.hasOwn(child, "isMesh")) {
        if (child["material"]) {
          child["material"].depthWrite = true;
        }
      }
    });
  }
}
