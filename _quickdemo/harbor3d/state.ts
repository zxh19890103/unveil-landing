import { createState } from "@/_shared/state.js";
import type { Object3D } from "three";

type State = {
  loading: boolean;
  fullscreen: boolean;
  interactive: boolean;
  panels: boolean;
  objects: Object3D[];
  focus: Object3D;
  following: Object3D;
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
    loading: true,
    fullscreen: false,
    interactive: false,
    panels: true,
    objects: [],
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
