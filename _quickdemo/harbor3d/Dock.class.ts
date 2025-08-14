import * as THREE from "three";

const size = new THREE.Vector3(100, 550);

export class Dock extends THREE.Mesh {
  readonly size = size;

  constructor() {
    super(
      new THREE.BoxGeometry(size.x, size.y, 1),
      new THREE.MeshBasicMaterial({ color: "#616161" })
    );
  }
}
