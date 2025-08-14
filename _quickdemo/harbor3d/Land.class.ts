import * as THREE from "three";

export class Land extends THREE.Mesh {
  constructor() {
    super(
      new THREE.BoxGeometry(1000, 5, 30),
      new THREE.MeshPhongMaterial({ color: 0xfe9103 })
    );

    this.position.x = 0;
    this.position.z = 0;
  }
}
