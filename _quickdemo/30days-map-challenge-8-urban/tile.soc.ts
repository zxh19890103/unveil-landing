import * as THREE from "three";
import {
  latLonToTile,
  tileToLatLon,
} from "@/30days-map-challenge-shared/core/clac.js";
import {
  __lights__,
  animationLoop,
  whenReady,
} from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";

//#region  Google tile

const getGooTileUrl = (
  xyz: { x: number; y: number; z: number },
  styled = false
) => {
  return `http://0.0.0.0:3003/gtile/${xyz.z}/${xyz.x}/${xyz.y}?styled=${styled}`;
};

function convert4326To3857({ lon, lat }) {
  const R = 6378137; // Earth's radius in meters

  // X coordinate: linear conversion
  let x = lon * (Math.PI / 180) * R;

  // Y coordinate: Mercator projection formula
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * R;

  return [x, y];
}

const dem_segments_by_x = 1266;
const dem_segments_by_y = 1164;
const zoom_basis = 12;

class GoogleTile extends THREE.Group {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  readonly width: number;
  readonly height: number;
  readonly widthSegments: number;
  readonly heightSegments: number;

  readonly meters_per_lon: number;
  readonly meters_per_lat = Meters_per_lat;

  readonly geoCenter: THREE.Vector2;

  readonly texture: THREE.Texture;

  readonly bbox: GoogleTileBBOX;

  googleTileRoot: GoogleTileRoot;

  uvScale: THREE.Vector2 = new THREE.Vector2(1, 1);
  uvOffset: THREE.Vector2 = new THREE.Vector2(0, 0);

  splitPlace:
    | "bottom-left"
    | "bottom-right"
    | "top-left"
    | "top-right"
    | "none" = "none";

  constructor(
    readonly x: number,
    readonly y: number,
    readonly zoom: number,
    root: GoogleTileRoot
  ) {
    super();

    const bbox = calcbbox(x, y, zoom);

    this.bbox = bbox;

    const meters_per_lon = Meters_per_lon(bbox.center.lat);
    const meters_by_x =
      meters_per_lon * (bbox.rightTop.lon - bbox.leftBottom.lon);
    const meters_by_y =
      Meters_per_lat * (bbox.rightTop.lat - bbox.leftBottom.lat);

    this.width = meters_by_x;
    this.height = meters_by_y;
    this.meters_per_lon = meters_per_lon;

    const dZ = zoom - zoom_basis;
    const factor = 1 / Math.pow(2, dZ);

    this.widthSegments = Math.ceil(dem_segments_by_x * factor);
    this.heightSegments = Math.ceil(dem_segments_by_y * factor);

    this.geoCenter = new THREE.Vector2(bbox.center.lon, bbox.center.lat);

    if (root !== null) {
      this.googleTileRoot = root;
    }
  }

  private teardownMesh() {
    this.remove(this.mesh);
  }

  private setupMesh() {
    this.add(this.mesh);
  }

  private buildMesh() {
    console.log(
      `${this.getTileName()} - ${this.splitPlace}`,
      this.uvScale.toArray(),
      this.uvOffset.toArray()
    );

    const map = textLoader.load(getGooTileUrl(this.bbox));
    const styledMap = textLoader.load(getGooTileUrl(this.bbox, true));

    console.log(this.googleTileRoot.elevations);

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        this.width,
        this.height,
        this.widthSegments,
        this.heightSegments
      ),
      new THREE.ShaderMaterial({
        wireframe: false,
        uniforms: {
          map: {
            value: map,
          },
          styledMap: {
            value: styledMap,
          },
          uvScale: {
            value: this.uvScale,
          },
          uCameraPos: {
            value: this.googleTileRoot.cameraPosLive,
          },
          uCameraPolarAngle: {
            value: this.googleTileRoot.cameraPolarAngle,
          },
          uvOffset: {
            value: this.uvOffset,
          },
          displacementMap: {
            value: this.googleTileRoot.demTexture,
          },
          displacementScale: { value: this.googleTileRoot.elevations.span },
          displacementBias: {
            value: this.googleTileRoot.elevations.minElevation + 5,
          },
        },
        transparent: true,
        vertexShader: /*glsl */ `
          uniform sampler2D displacementMap;
          uniform float displacementScale;
          uniform float displacementBias;

          uniform vec2 uvScale;
          uniform vec2 uvOffset;

          varying vec2 vUv;
          varying float vElevation;
          varying vec3 vWorldPos;

          void main() {
            vUv = uv;

            vec3 pos = position.xyz;
            vec2 aUv = uvOffset + uvScale * uv;
            float h = texture2D(displacementMap, aUv).r;
            pos.z += displacementBias + displacementScale * h;

            vElevation = displacementScale * h;
            vec4 worldPos = modelMatrix * vec4(pos, 1.0);
            vWorldPos = worldPos.xyz;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: /*glsl */ `
          uniform sampler2D map;
          uniform sampler2D styledMap;
          uniform vec3 uCameraPos;
          uniform float uCameraPolarAngle;

          varying vec2 vUv;
          varying float vElevation;
          varying vec3 vWorldPos;

          void main() {
            // float camDist = distance(vWorldPos, uCameraPos);
            vec3 baseColor = texture2D(map, vUv).rgb;
            vec3 styledBaseColor = texture2D(styledMap, vUv).rgb;
            // float distMask = smoothstep(100.0, 3000.0, camDist);
            // float elevationMask = step(50.0, vElevation);
            // float finalMask = distMask;
            // baseColor = mix(vec3(0.9, 0.78, 0.11), baseColor, finalMask);
            float angleMask = smoothstep(0.01, 0.65, uCameraPolarAngle);
            baseColor = mix(styledBaseColor, baseColor, angleMask);
            // 增加饱和度
            float luma = dot(baseColor, vec3(0.299, 0.587, 0.114));
            baseColor = mix(vec3(luma), baseColor, 1.5); 
            // 调成暖色调或粉色调
            baseColor.r *= 1.1; 
            baseColor.g *= 1.05;

            float levels = 12.0; // Adjust this for more/less detail
            baseColor = floor(baseColor * levels) / levels;

            gl_FragColor = vec4(baseColor, 1.0);
          }
        `,
      })
    );

    this.add(mesh);
    // @ts-ignore
    this.mesh = mesh;
    return mesh;
  }

  child0: GoogleTile = null;
  child1: GoogleTile = null;
  child2: GoogleTile = null;
  child3: GoogleTile = null;

  children0to3: GoogleTile[] = [];

  getUvOffsetByPlace(pla: number, vec2: THREE.Vector2) {
    if (pla === 0) {
      // bottom left
      vec2.set(0, 0);
    } else if (pla === 1) {
      // bottom right
      vec2.set(0.5, 0);
    } else if (pla === 2) {
      // top left
      vec2.set(0, 0.5);
    } else if (pla === 3) {
      // top right
      vec2.set(0.5, 0.5);
    }
  }

  getTileName() {
    return `${this.zoom}.${this.x}.${this.y}`;
  }

  getTileKey() {
    return `${this.zoom}.${this.x}.${this.y}`;
  }

  private splitted = false;

  private _split24() {
    const to4 = splitDownTo4(this.x, this.y, this.zoom);

    const { tiles, tiles0 } = this.googleTileRoot;
    const { uvScale, uvOffset } = this;
    const childUvScale = { x: uvScale.x * 0.5, y: uvScale.y * 0.5 };

    // bottom left, bottom right; top left, top right
    [to4.bbox2, to4.bbox3, to4.bbox0, to4.bbox1].forEach((bbox, idx) => {
      const tilechild = new GoogleTile(
        bbox.x,
        bbox.y,
        bbox.z,
        this.googleTileRoot
      );

      tiles.add(tilechild);
      tiles0.set(tilechild.getTileKey(), tilechild);
      this.children0to3.push(tilechild);

      this.getUvOffsetByPlace(idx, tilechild.uvOffset);
      tilechild.uvOffset.multiply(uvScale);
      tilechild.uvOffset.add(uvOffset);

      tilechild.uvScale.copy(childUvScale);

      const offset = tilechild.geoCenter.clone().sub(this.geoCenter);
      this.add(tilechild);
      tilechild.splitPlace = bbox.placement;

      this[`child${idx}`] = tilechild;

      const dX = tilechild.meters_per_lon * offset.x;
      const dY = tilechild.meters_per_lat * offset.y;

      tilechild.position.set(dX, dY, this.position.z);
      tilechild.buildMesh();
    });
  }

  split24() {
    this.teardownMesh();

    if (this.splitted) {
      for (const child of this.children) {
        if (child instanceof GoogleTile) {
          child.setupMesh();
        }
      }
      return;
    }

    this._split24();
    this.splitted = true;
  }

  splitChildren0to3To4() {
    for (const child of this.children0to3) {
      child.split24();
    }
  }

  unsplit24() {
    if (this.splitted) {
      this.setupMesh();
      this.teardownAllAncetorMeshes();
    }
  }

  teardownAllAncetorMeshes() {
    for (const child of this.children0to3) {
      child.teardownMesh();
      child.teardownAllAncetorMeshes();
    }
  }
}

class GoogleTileRoot extends GoogleTile {
  readonly demTileUrl: string;

  readonly tiles: Set<GoogleTile> = new Set();
  readonly tiles0: Map<string, GoogleTile> = new Map();

  readonly demTexture: THREE.Texture;

  readonly elevations: DemElevations;
  cameraPosLive: THREE.Vector3 = new THREE.Vector3();
  cameraPolarAngle: number = 90 * THREE.MathUtils.DEG2RAD;

  constructor(x: number, y: number) {
    super(x, y, zoom_basis, null);

    this.googleTileRoot = this;

    this.demTileUrl = `http://0.0.0.0:3003/texture/datadem/${zoom_basis}-${x}-${y}.png`;

    // request dem data from openTopo
    fetch(
      `http://0.0.0.0:3003/dem?bbox=${this.bbox.bbox}&x=${x}&y=${y}&z=${zoom_basis}&regen=false`
    );

    this.demTexture = textLoader.load(this.demTileUrl);
  }

  updateMaterialUniforms() {
    for (const tile of this.tiles) {
      tile.mesh.material.uniforms.uCameraPolarAngle.value =
        this.cameraPolarAngle;
    }
  }

  async prepare() {
    const elevations: DemElevations = await fetch(
      `http://0.0.0.0:3003/texture/datadem/${zoom_basis}-${this.x}-${this.y}.gtiff.elevation.json`
    ).then((r) => r.json());
    elevations.span = elevations.maxElevation - elevations.minElevation;

    // @ts-ignore
    this.elevations = elevations;

    //@ts-ignore
    this.buildMesh();

    // listen the change of camera's pos
  }
}

type DemElevations = {
  minElevation: number;
  maxElevation: number;
  span: number;
};

function splitDownTo4(x: number, y: number, zoom: number): SplitTo4 {
  const z = zoom + 1;

  const topLeft = [2 * x, 2 * y, z] as [number, number, number];
  const topRight = [2 * x + 1, 2 * y, z] as [number, number, number];
  const bttomLeft = [2 * x, 2 * y + 1, z] as [number, number, number];
  const bttomRight = [2 * x + 1, 2 * y + 1, z] as [number, number, number];

  const bbox0 = calcbbox(...topLeft);
  bbox0.placement = "top-left";

  const bbox1 = calcbbox(...topRight);
  bbox1.placement = "top-right";

  const bbox2 = calcbbox(...bttomLeft);
  bbox2.placement = "bottom-left";

  const bbox3 = calcbbox(...bttomRight);
  bbox3.placement = "bottom-right";

  return {
    bbox0,
    bbox1,
    bbox2,
    bbox3,
  };
}

type SplitTo4 = {
  /**
   * top left
   */
  bbox0: GoogleTileBBOX;
  /**
   * top right
   */
  bbox1: GoogleTileBBOX;
  /**
   * bottom left
   */
  bbox2: GoogleTileBBOX;
  /**
   * bottom right
   */
  bbox3: GoogleTileBBOX;
};

function calcbbox(x: number, y: number, z: number): GoogleTileBBOX {
  const leftTop = tileToLatLon(x, y, z);
  const rightTop = tileToLatLon(x + 1, y, z);
  const leftBottom = tileToLatLon(x, y + 1, z);
  const rightBottom = tileToLatLon(x + 1, y + 1, z);
  const center = tileToLatLon(x + 0.5, y + 0.5, z);

  const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon}`;
  const bbox3857 = `${convert4326To3857(leftBottom)},${convert4326To3857(
    rightTop
  )}`;

  return {
    x,
    y,
    z,
    placement: "none",
    leftTop,
    rightTop,
    leftBottom,
    rightBottom,
    center,
    bbox: bbox,
    bbox3857: bbox3857,
    toString: () => {
      return `${z}/${x}/${y} ~ ${bbox} ~ ${bbox3857}`;
    },
  };
}

type GoogleTileBBOX = {
  x: number;
  y: number;
  z: number;
  placement: GoogleTileSplitPlace;
  center: Geo.LatLng;
  bbox: string;
  bbox3857: string;
  [k: string]: any;
};

type GoogleTileSplitPlace =
  | "none"
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right";

//#endregion

/**
 *
 * create a geometry like waterways.
 *
 * but with a very large width, be sure covering all the rivers.
 *
 * create a mask texture using canvas (black-white)
 * create a flowing river texture from a picture.
 *
 * new Mesh(geo, mat)
 *
 * in mat, we only output color when the mask pixel is white;
 */

/**
 * @todo
 *
 *  1. use sharp to convert the gtiff file to png correctly
 *  2. how to access the elevations information before load the dem picture.?
 *  3. access width and height before render it, setting them as segments.
 * 4. how to render it on sphere?
 */

// const EARTH_RADIUS = 6378137;
const Meters_per_lat = 111132;
const Meters_per_lon = (lat: number) =>
  111320 * Math.cos((lat * Math.PI) / 180);

whenReady(async (world, camera, renderer, controls) => {
  const [lat, lng] = [22.03781706922663, 106.81848782285955];
  const zoom = zoom_basis; // it's the best zoom level to load the data of osm and dem.

  const tileIndex = latLonToTile(lat, lng, zoom);

  camera.near = 100;
  camera.far = 100000;
  camera.updateProjectionMatrix();
  camera.position.set(0, 600, 2000);

  controls.zoomSpeed = 1;
  controls.rotateSpeed = 1;

  const rootTile = new GoogleTileRoot(tileIndex[0], tileIndex[1]);

  rootTile.rotation.x = -Math.PI / 2;

  controls.addEventListener("end", () => {
    rootTile.cameraPosLive.copy(camera.position);
    rootTile.cameraPolarAngle = Math.PI / 2 - controls.getPolarAngle();

    console.log(rootTile.cameraPolarAngle);

    rootTile.updateMaterialUniforms();
  });

  rootTile.prepare().then(() => {
    rootTile.split24();
    setTimeout(() => {
      rootTile.splitChildren0to3To4();
    }, 1000);
    // setTimeout(() => {
    //   rootTile.unsplit24();
    //   setTimeout(() => {
    //     rootTile.split24();
    //     setTimeout(() => {
    //       rootTile.splitChildren0to3To4();
    //     }, 3000);
    //   }, 3000);
    // }, 3000);
  });

  world.add(rootTile);
});
