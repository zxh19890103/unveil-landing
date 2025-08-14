import * as THREE from "three";

const loadingMgr = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadingMgr);

export class Land extends THREE.Mesh {
  readonly size: THREE.Vector3;

  constructor() {
    super(
      new THREE.PlaneGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({
        color: "#414141",
        // map: loader.load('./road.jpg'),
      })
    );

    this.size = new THREE.Vector3(1000, 1000);

    this.rotation.x = -Math.PI / 2;
    this.position.x = 0;
    this.position.y = 1;
  }
}
