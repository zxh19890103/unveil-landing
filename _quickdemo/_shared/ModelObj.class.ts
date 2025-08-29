import * as THREE from "three";
import type { LngLat } from "./geo-mercator.js";
import { gltfLoader } from "./loader.js";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

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
  /**
   * translation
   */
  offset?: THREE.Vector3Tuple;
  /**
   * the distance where the object cannot be seen!
   */
  visibleDistance?: number;
  /**
   * the scale factor for the scale of thing under the case of unseen!
   * @default scaleFactor * 1.5
   */
  scaleFactorToSee?: number;
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
  readonly wrapper2 = new THREE.Object3D();

  constructor(
    private url: string,
    private label: string,
    private color: THREE.ColorRepresentation,
    readonly adjustParams: ModelInitializationParams
  ) {
    super();

    const { wrapper, wrapper2 } = this;

    const scaleFactorToSee =
      adjustParams.scaleFactorToSee ?? 1.5 * adjustParams.scaleFactor;

    // Optional: normalize model's center and up-axis
    const scaleFactor = adjustParams.scaleFactor;
    wrapper.scale.setScalar(scaleFactor);
    wrapper2.scale.setScalar(scaleFactorToSee);

    const r = adjustParams.rotation;
    wrapper.rotation.set(r[0] * half_PI, r[1] * half_PI, r[2] * half_PI);
    wrapper2.rotation.copy(wrapper.rotation);

    if (adjustParams.offset) {
      wrapper.position.set(...adjustParams.offset);
      wrapper2.position.copy(wrapper.position);

      wrapper.position.multiplyScalar(scaleFactor);
      wrapper2.position.multiplyScalar(scaleFactorToSee);
    }

    this.loadShape();

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
        distance: adjustParams.visibleDistance ?? 12,
      },
    ]);

    this.add(this.lod);
  }

  async loadShape() {
    try {
      const { max, min } = await getGltfBoundingBox(this.url);

      this.wrapper2.add(
        new THREE.Mesh(
          new THREE.BoxGeometry(
            max[0] - min[0],
            max[1] - min[1],
            max[2] - min[2]
          ),
          new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0.65,
            color: this.color,
          })
        )
      );

      return { min, max };
    } catch (error) {
      console.error("Failed to fetch or parse glTF file:", error);
      return null;
    }
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

          this.lod.addLevel(this.wrapper, distance);
          break;
        }
        case "label":
        case "point": {
          this.lod.addLevel(this.wrapper2, distance);
          break;
        }
      }
    }
  }

  private createLabel() {
    const div = document.createElement("div");
    div.style.cssText = `font-size: .7rem; color: white;`;
    const label = new CSS2DObject(div);
    div.innerHTML = `${this.label}`;
    return label;
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

/**
 * Fetches and parses a glTF or glB file to determine the true world-space
 * bounding box by traversing the node hierarchy and considering only
 * POSITION attributes.
 * @param {string} url - The URL of the glTF or glB file.
 * @returns {Promise<{min: number[], max: number[]}>} - The world-space bounding box.
 */
async function getGltfBoundingBox(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let gltfJson;
    if (url.endsWith(".glb")) {
      const arrayBuffer = await response.arrayBuffer();
      const dataView = new DataView(arrayBuffer);
      const magic = dataView.getUint32(0, true);
      if (magic !== 0x46546c67) {
        throw new Error("Not a valid glB file.");
      }
      const jsonChunkLength = dataView.getUint32(12, true);
      const jsonBuffer = new Uint8Array(arrayBuffer, 20, jsonChunkLength);
      const jsonString = new TextDecoder("utf-8").decode(jsonBuffer);
      gltfJson = JSON.parse(jsonString);
    } else if (url.endsWith(".gltf")) {
      gltfJson = await response.json();
    } else {
      throw new Error(
        "Unsupported file type. URL must end with .gltf or .glb."
      );
    }

    let globalMin = [Infinity, Infinity, Infinity];
    let globalMax = [-Infinity, -Infinity, -Infinity];

    function combineBoxes(box) {
      globalMin[0] = Math.min(globalMin[0], box.min[0]);
      globalMin[1] = Math.min(globalMin[1], box.min[1]);
      globalMin[2] = Math.min(globalMin[2], box.min[2]);
      globalMax[0] = Math.max(globalMax[0], box.max[0]);
      globalMax[1] = Math.max(globalMax[1], box.max[1]);
      globalMax[2] = Math.max(globalMax[2], box.max[2]);
    }

    // This is a simplified transformation for a single point.
    // For a real-world scenario, you would transform all 8 corners of the box.
    const transformPoint = (point, matrix) => {
      // Placeholder for 4x4 matrix-vector multiplication
      return point;
    };

    const traverseNodes = (nodeIndex, parentMatrix) => {
      const node = gltfJson.nodes[nodeIndex];
      let matrix = parentMatrix;

      if (node.matrix) {
        // Placeholder for matrix multiplication
        matrix = parentMatrix;
      } else {
        // Placeholder for composing T, R, S into a matrix
        matrix = parentMatrix;
      }

      if (node.mesh !== undefined) {
        const mesh = gltfJson.meshes[node.mesh];
        mesh.primitives.forEach((primitive) => {
          if (primitive.attributes.POSITION !== undefined) {
            const accessorIndex = primitive.attributes.POSITION;
            const accessor = gltfJson.accessors[accessorIndex];
            if (accessor.min && accessor.max) {
              const transformedMin = transformPoint(accessor.min, matrix);
              const transformedMax = transformPoint(accessor.max, matrix);
              combineBoxes({ min: transformedMin, max: transformedMax });
            }
          }
        });
      }

      if (node.children) {
        node.children.forEach((childIndex) => {
          traverseNodes(childIndex, matrix);
        });
      }
    };

    const scene = gltfJson.scenes[gltfJson.scene];
    const identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    scene.nodes.forEach((rootNodeIndex) => {
      traverseNodes(rootNodeIndex, identityMatrix);
    });

    return { min: globalMin, max: globalMax };
  } catch (error) {
    console.error("Failed to process file:", error);
    return null;
  }
}
