import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ImageObj } from "./ImageObj.class.js";
import type { LngLat } from "./geo-mercator.js";

type LODLevel = {
  type: "model" | "label" | "point";
  url?: string;
  size?: number;
  color?: THREE.ColorRepresentation;
  distance: number;
};

type ModelInitializationParams = {
  scaleFactor: number;
  /**
   * all components are times of 1/2 pi
   */
  rotation: THREE.Vector3Tuple;
};

const half_PI = Math.PI / 2;

export class ModelObj extends THREE.Object3D {
  private lod: THREE.LOD = new THREE.LOD();
  private loader = new GLTFLoader();
  shootTarget: LngLat;

  constructor(
    url: string,
    label: string,
    color: THREE.ColorRepresentation,
    readonly asjustParams: ModelInitializationParams
  ) {
    super();

    this.loadLODs([
      {
        type: "model",
        url,
        distance: 0,
      },
      {
        type: "label",
        size: 40,
        url: label,
        color,
        distance: 1000000,
      },
      {
        type: "point",
        size: 1,
        color,
        distance: 300000000,
      },
    ]);

    this.add(this.lod);
  }

  async loadLODs(levels: LODLevel[]) {
    for (const { type, url, distance, size, color } of levels) {
      switch (type) {
        case "model": {
          const gltf = await this.loader.loadAsync(url);
          const scene = gltf.scene;
          // Optional: normalize model's center and up-axis
          const s = this.asjustParams.scaleFactor;
          scene.scale.set(s, s, s);

          const wrapper = new THREE.Object3D();
          wrapper.add(scene);

          const r = this.asjustParams.rotation;
          scene.rotation.set(r[0] * half_PI, r[1] * half_PI, r[2] * half_PI);
          this.lod.addLevel(wrapper, distance);
          break;
        }
        case "label": {
          this.lod.addLevel(new ImageObj(url, size, size), distance);
          break;
        }
        case "point": {
          const sphereGeo = new THREE.SphereGeometry(size);
          const sphere = new THREE.Mesh(
            sphereGeo,
            new THREE.MeshPhongMaterial({ color })
          );
          this.lod.addLevel(sphere, distance);
          break;
        }
      }
    }
  }

  faceTo(to: THREE.Vector3) {
    const xy = to.clone().sub(this.position).normalize();
    const theta = Math.atan2(xy.y, xy.x);
    this.rotation.z = theta;
  }

  setScaleUniform(s: number) {
    this.scale.setScalar(s);
  }

  setRotationY(deg: number) {
    this.rotation.y = THREE.MathUtils.degToRad(deg);
  }

  update(camera: THREE.Camera) {
    this.lod.update(camera);
  }
}
