import * as THREE from "three";

export class Grid extends THREE.Object3D {
  readonly cells = [];

  constructor(
    private readonly _4pts: THREE.Vector3[],
    readonly size: THREE.Vector2Tuple
  ) {
    super();

    const lx = 1;
    const ly = 1;

    const [sX, sY] = size;

    const nX = Math.ceil(lx / sX);
    const nY = Math.ceil(ly / sY);

    for (let i = 0; i < nX; i++) {
      for (let j = 0; j < nY; j++) {
        this.cells.push({
          id: `${i}-${j}`,
          coords: [(i + 0.5) * sX, (j + 0.5) * sY],
        });
      }
    }
  }
}
