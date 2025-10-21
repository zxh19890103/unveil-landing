import { ModelObj } from "@/_shared/ModelObj.class.js";
import type { ShipmentOrderDetail } from "./data/types.js";

type UserData = {
  tel: string;
  carType: string;
  license_plate: string;
  driver: string;
  status: "運輸中";
  shipmentOrderDetails: ShipmentOrderDetail[];
};

export class Truck extends ModelObj {
  readonly $$type = "truck";

  readonly userData: UserData = {
    tel: "",
    carType: "",
    license_plate: "",
    driver: "",
    status: "運輸中",
    shipmentOrderDetails: [],
  };

  constructor(label: string = "truck") {
    super("./generic_truck/scene.gltf", label, 0x123212, {
      offset: [0, 0, 0],
      rotation: [0, -1, 0],
      scaleFactor: 0.001,
      scaleFactorToSee: 0.004,
      visibleDistance: 34,
    });

    this.traverse((child) => {
      if (Object.hasOwn(child, "isMesh")) {
        if (child["material"]) {
          child["material"].depthWrite = true;
        }
      }
    });
  }
}
