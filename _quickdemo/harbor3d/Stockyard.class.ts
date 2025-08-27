import * as THREE from "three";
import type { Cargo } from "./Cargo.class.js";

export class StockYard extends THREE.Object3D {
  readonly $$type = "stockyard";
  readonly userData = {
    yard_code: "Yard-A",
    status: "擁擠",
    capacity: 3000,
  };

  constructor(
    readonly origin: THREE.Vector3,
    readonly to: THREE.Vector3,
    readonly dimensions: THREE.Vector3Tuple
  ) {
    super();

    const xA = new THREE.Vector2(to.x - origin.x, to.z - origin.z);
    this.position.copy(origin);
    this.rotation.y = -xA.angle() + Math.PI;
  }

  create(spec: THREE.Vector3Tuple, each: (pt: THREE.Vector3) => Cargo) {
    const [nx, nz, ny] = this.dimensions;
    const [ux, uy, uz] = spec;

    this.position.add({ x: ux / 2, y: uy / 2, z: uz / 2 });
    const gap = ux * 0.1;

    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        for (let iz = 0; iz < nz; iz++) {
          const pt = new THREE.Vector3(
            ix * (ux + gap),
            iy * (uy + gap),
            iz * (uz + gap)
          );
          this.add(each(pt));
        }
      }
    }
  }
}
