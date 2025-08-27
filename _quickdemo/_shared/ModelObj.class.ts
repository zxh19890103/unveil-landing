import * as THREE from "three";
import type { LngLat } from "./geo-mercator.js";
import { gltfLoader } from './loader.js';

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

  offset?: THREE.Vector3Tuple;
};

type TraverseCallback = (obj: THREE.Object3D) => void;

const half_PI = Math.PI / 2;

export class ModelObj extends THREE.Object3D {
  readonly __$interactive = true;
  private lod: THREE.LOD = new THREE.LOD();
  private atom: THREE.Object3D;

  shootTarget: LngLat;

  readonly size = new THREE.Vector3();
  readonly wrapper = new THREE.Object3D();

  constructor(
    url: string,
    label: string,
    color: THREE.ColorRepresentation,
    readonly adjustParams: ModelInitializationParams
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
        size: 0.1,
        url: label,
        color,
        distance: 12,
      },
    ]);

    this.add(this.lod);
  }

  async loadLODs(levels: LODLevel[]) {
    for (const { type, url, distance, size, color } of levels) {
      switch (type) {
        case "model": {
          const gltf = await gltfLoader.loadAsync(url);
          const scene = gltf.scene;

          this.atom = scene;
          this.wrapper.add(scene);

          const box3 = new THREE.Box3().setFromObject(scene);
          box3.getSize(this.size);

          // onloaded
          let repeatFn: VoidFunction = null;
          while ((repeatFn = this.repeatFns.shift())) repeatFn();

          let traverseFn: VoidFunction = null;
          while ((traverseFn = this.traverseFns.shift())) traverseFn();

          const { adjustParams, wrapper } = this;
          // Optional: normalize model's center and up-axis
          const s = adjustParams.scaleFactor;
          wrapper.scale.set(s, s, s);

          const r = adjustParams.rotation;
          wrapper.rotation.set(r[0] * half_PI, r[1] * half_PI, r[2] * half_PI);

          if (adjustParams.offset) {
            wrapper.position.set(...adjustParams.offset);
            wrapper.position.multiplyScalar(s);
          }

          this.lod.addLevel(wrapper, distance);
          break;
        }
        case "label":
        case "point": {
          const circleGeometry = new THREE.CircleGeometry(size);
          const circle = new THREE.Mesh(
            circleGeometry,
            new THREE.MeshBasicMaterial({
              color: color,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.78,
            })
          );
          circle.rotation.x = Math.PI / 2;
          this.lod.addLevel(circle, distance);
          break;
        }
      }
    }
  }

  private traverseFns: VoidFunction[] = [];
  override traverse(callback: TraverseCallback): void {
    if (this.atom) {
      this.atom.traverse(callback);
    } else {
      this.traverseFns.push(() => {
        this.atom.traverse(callback);
      });
    }
  }

  private repeatFns: VoidFunction[] = [];

  private _repeat(count: number, along: Axis) {
    for (let i = 1; i <= count; i++) {
      const copy = this.atom.clone();
      copy.position[along] += i * this.size[along];
      this.wrapper.add(copy);
    }
  }

  repeat(count: number, along: Axis) {
    if (this.atom) {
      this._repeat(count, along);
    } else {
      this.repeatFns.push(() => {
        this._repeat(count, along);
      });
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
