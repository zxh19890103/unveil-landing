import * as THREE from "three";

export const CargoSpec: THREE.Vector3Tuple = [0.05, 0.05, 0.1];

export class Cargo extends THREE.Mesh {
  readonly size: THREE.Vector3;

  constructor(color: THREE.ColorRepresentation) {
    const geometry = new THREE.BoxGeometry(...CargoSpec);

    super(geometry, new THREE.MeshPhongMaterial({ color }));

    this.size = new THREE.Vector3(5, 5, 15);

    const wrap = new THREE.EdgesGeometry(geometry);

    this.add(
      new THREE.LineSegments(
        wrap,
        new THREE.LineBasicMaterial({ color: 0x000 })
      )
    );
  }
}
