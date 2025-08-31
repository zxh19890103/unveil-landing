import { ModelObj } from "@/_shared/ModelObj.class.js";

export class Ship extends ModelObj {
  readonly $$type = "ship";

  readonly userData = {
    imo_number: "IMO9876543",
    vessel_name: "Ever Given",
    status: "離港中",
    eta: "2025-08-27T10:00:00Z",
  };

  constructor(label: string = "vessel") {
    super("./cargo_ship/scene.gltf", label, 0x0d1e93, {
      offset: [0, -1.5, 0],
      rotation: [0, 1, 0],
      scaleFactor: 0.1,
      scaleFactorToSee: 0.1,
      visibleDistance: 64,
    });
  }
}
