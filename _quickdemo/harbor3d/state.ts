import { createState } from "@/_shared/state.js";
import type { Object3D } from "three";
import type {
  ShipmentCar,
  ShipmentOrder,
  ShipmentOrderDetail,
} from "./data/types.js";

export type Persipective = "top" | "left" | "right" | "back" | "front";

type State = {
  loading: boolean;
  fullscreen: boolean;
  interactive: boolean;
  panels: boolean;
  persipective: Persipective;
  objects: Object3D[];
  focus: Object3D;
  following: Object3D;
  warnMsg: string;

  cars: ShipmentCar[];
  shipmentOrders: ShipmentOrder[];
  shipmentOrderDetails: ShipmentOrderDetail[];
};

type Computed = {
  stats: {
    ships: number;
    trucks: number;
    stockyards: number;
    cargos: number;
  };
};

export const appState = createState<State, Computed>(
  {
    warnMsg: "",
    persipective: "top",
    loading: true,
    fullscreen: false,
    interactive: false,
    panels: false,
    objects: [],
    cars: [],
    shipmentOrderDetails: [],
    shipmentOrders: [],
    focus: null,
    following: null,
  },
  {
    stats() {
      const objects = this.objects;
      const stockyards = objects.filter((x) => x.$$type === "stockyard");

      return {
        ships: objects.filter((x) => x.$$type === "ship").length,
        trucks: objects.filter((x) => x.$$type === "truck").length,
        stockyards: stockyards.length,
        cargos: stockyards
          .map((x) => x.children.length)
          .reduce((p, n) => p + n, 0),
      };
    },
  }
);
