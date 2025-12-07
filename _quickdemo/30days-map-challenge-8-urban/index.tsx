import * as THREE from "three";
import ReactDOM from "react-dom/client";
import { ThreeJsSetup } from "@/_shared/ThreeJsSetup.class.js";

import {
  getCameraDistanceFromEarthSurface,
  getTileZoomLevel,
  latlngToSphere,
  latLonToTile,
  lonLatToMercator,
  pixelsPerMeter,
  sphereToLatlng,
  tileToLatLon,
} from "../30days-map-challenge-shared/core/index.js";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { memo, useEffect, useState } from "react";

import "@/30days-map-challenge-shared/core/pixel.js";

const threejsContainer = document.querySelector("#threejs-container");
const EARTH_RADIUS = 6378137;

const threeJs = new ThreeJsSetup(
  threejsContainer as HTMLElement,
  75,
  0.01,
  EARTH_RADIUS * 10
);
threeJs.setupControls();

const { scene: world, camera } = threeJs;

const axes = new THREE.AxesHelper(EARTH_RADIUS * 1.5);
world.add(axes);

// const grid = new THREE.GridHelper(1, 10);
// world.add(grid);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);

dirLight.position.set(0, 0, 0.5 * EARTH_RADIUS);
dirLight.target.position.set(0, 0, 0);

world.add(new THREE.AmbientLight(0xffffff, 1));
world.add(dirLight);

threeJs.startAnimation();

const tLoader = new THREE.TextureLoader();

/**
 * | Zoom | Ground resolution (m/pixel at equator) | Tile width (m) | Approx altitude for full tile (m) |
| ---- | -------------------------------------- | -------------- | --------------------------------- |
| 0    | 156,412.0                              | 40,075,016     | ~40,000,000                       |
| 1    | 78,206.0                               | 20,037,508     | ~20,000,000                       |
| 2    | 39,103.0                               | 10,018,754     | ~10,000,000                       |
| 3    | 19,551.5                               | 5,009,377      | ~5,000,000                        |
| 4    | 9,775.8                                | 2,504,688      | ~2,500,000                        |
| 5    | 4,887.9                                | 1,252,344      | ~1,250,000                        |
| 6    | 2,443.9                                | 626,172        | ~625,000                          |
| 7    | 1,221.9                                | 313,086        | ~310,000                          |
| 8    | 610.9                                  | 156,543        | ~155,000                          |
| 9    | 305.4                                  | 78,272         | ~78,000                           |
| 10   | 152.7                                  | 39,136         | ~39,000                           |
| 11   | 76.4                                   | 19,568         | ~19,000                           |
| 12   | 38.2                                   | 9,784          | ~9,000                            |
| 13   | 19.1                                   | 4,892          | ~4,000                            |
| 14   | 9.55                                   | 2,446          | ~2,000                            |
| 15   | 4.78                                   | 1,223          | ~1,000                            |
| 16   | 2.39                                   | 611            | ~500                              |
| 17   | 1.19                                   | 305            | ~250                              |
| 18   | 0.60                                   | 152            | ~125                              |
| 19   | 0.30                                   | 76             | ~60                               |
| 20   | 0.15                                   | 38             | ~30                               |
 */

const orbitControls = threeJs.controls as OrbitControls;

function getSpeedFromZoomLevel(zoomLevel) {
  // Google Maps Zoom 0 = Whole World
  // Google Maps Zoom 20 = House

  // Base speed at Zoom 0
  const baseSpeed = 1;

  // Decay factor: Speed halves every time zoom increases by 1
  // This matches the logic that the view area quarters.
  const speed = baseSpeed / Math.pow(2, zoomLevel);

  // Example outputs:
  // Zoom 0  -> 1.0
  // Zoom 10 -> 0.0009
  // Zoom 20 -> 0.0000009

  return speed;
}

/**
 * Calculates a dynamically decaying pan speed multiplier based on the integer zoom level.
 * @param {number} zoomLevel - The integer zoom level (e.g., 0 for world view, 20 for street view).
 * @returns {number} The panSpeed multiplier for OrbitControls.
 */
function getPanSpeedFromZoom(zoomLevel) {
  // 1. Calculate the decay factor: 1 / 2^Z
  // This ensures the speed drops by 50% for every +1 zoom level.
  const decayFactor = 1 / Math.pow(2, zoomLevel);

  // 2. Apply the sensitivity
  let newPanSpeed = decayFactor * Math.max(1, 14 - zoomLevel);

  // 3. Ensure the speed never drops below a minimum threshold
  newPanSpeed = Math.max(MIN_PAN_SPEED, newPanSpeed);

  return newPanSpeed;
}

// 2. Min Speed: Prevents controls from completely locking up at very high zooms (Z > 20).
const MIN_PAN_SPEED = 0.0005;
const MIN_GAP_CAM_SURFACE = 500.0; // m
// --------------------

orbitControls.enableDamping = true;
orbitControls.enablePan = true;
orbitControls.minDistance = EARTH_RADIUS + MIN_GAP_CAM_SURFACE;
orbitControls.maxDistance = 10.01 * EARTH_RADIUS;
orbitControls.maxPolarAngle = (160 * Math.PI) / 180;
orbitControls.minPolarAngle = (10 * Math.PI) / 180;

const zoomSpeedLevels = Object.fromEntries(
  new Array(21).fill(0).map((_, i) => {
    return [i, { zoom: getSpeedFromZoomLevel(i), pan: getPanSpeedFromZoom(i) }];
  })
);

let currentZoomLv = 0;

camera.position.set(0, 3 * EARTH_RADIUS, 2 * EARTH_RADIUS);

// world.add(new THREE.AxesHelper(ER * 1.6));

const vec3util = new THREE.Vector3();

class MapTile {
  /**
   * 0 -- 1
   * |     |
   * 2 -- 3
   */
  private _4_corners: Geo.LatLng[] = [];
  private _4_uvs: Geo.UV[] = [];
  private _4_dem_pos: Geo.UV[] = [];

  private southwest_in_meters = new THREE.Vector3();
  private northeast_in_meters = new THREE.Vector3();

  private latlngLerp: (ax: number, ay: number) => Geo.LatLng;
  private uvLerp: (ax: number, ay: number) => THREE.Vector2Like;
  private uv1Lerp: (ax: number, ay: number) => THREE.Vector2Like;

  /**
   * id
   */
  readonly xyz: string;
  readonly n: number;
  readonly normal: THREE.Vector3;

  readonly layers: string;
  readonly bbox: string;
  mesh: THREE.Mesh<
    THREE.BufferGeometry<
      THREE.NormalBufferAttributes,
      THREE.BufferGeometryEventMap
    >,
    THREE.MeshPhongMaterial,
    THREE.Object3DEventMap
  >;

  alpha: number = 1;

  constructor(readonly x: number, readonly y: number, readonly zoom: number) {
    const n = Math.pow(2, zoom);

    this.n = n;
    this.xyz = `${x}.${y}.${zoom}`;

    // left top
    const latlng0 = tileToLatLon(x, y, zoom);
    // right top
    const latlng1 = tileToLatLon(x + 1, y, zoom);
    // left bottom
    const latlng2 = tileToLatLon(x, y + 1, zoom);
    // right bottom
    const latlng3 = tileToLatLon(x + 1, y + 1, zoom);

    this._4_corners.push(latlng0, latlng1, latlng2, latlng3);
    // console.table(this._4_corners[2].lon - this._4_corners[1].lon);

    this.southwest_in_meters.copy(lonLatToMercator(latlng2.lon, latlng2.lat));
    this.northeast_in_meters.copy(lonLatToMercator(latlng1.lon, latlng1.lat));

    this._4_uvs.push(
      new THREE.Vector2(0, 1),
      new THREE.Vector2(1, 1),
      new THREE.Vector2(0, 0),
      new THREE.Vector2(1, 0)
    );

    this._4_dem_pos.push(
      new THREE.Vector2(x / n, 1 - (y + 1) / n),
      new THREE.Vector2((x + 1) / n, 1 - (y + 1) / n),
      new THREE.Vector2(x / n, 1 - y / n),
      new THREE.Vector2((x + 1) / n, 1 - y / n)
    );

    const clat = (latlng1.lat + latlng2.lat) / 2;
    const clon = (latlng1.lon + latlng2.lon) / 2;

    this.normal = new THREE.Vector3().copy(
      latlngToSphere({ lat: clat, lon: clon })
    );

    const southwest = this._4_corners[2];
    const northeast = this._4_corners[1];
    this.layers = this.getLayers();
    this.bbox = `${southwest.lat},${southwest.lon},${northeast.lat},${northeast.lon}`;

    this.latlngLerp = this.createLatlngLerp();
    this.uvLerp = this.createUVLerp();
    this.uv1Lerp = this.createUV1Lerp();
  }

  private getLayers() {
    // return "NE2_HR_LC_SR_W";
    const zoom = this.zoom;
    if (zoom < 4) {
      return `ne_10m_admin_0_countries_nep,ne_10m_ocean`;
    } else if (zoom < 7) {
      return `ne_10m_ocean,ne_10m_admin_1_states_provinces`;
    } else if (zoom < 10) {
      return `ne_10m_ocean,ne_10m_admin_1_states_provinces,ne_10m_roads`;
    } else {
      return `ne_10m_ocean,ne_10m_admin_1_states_provinces,ne_10m_roads,ADM_ADM_3,ne_50m_urban_areas`;
    }
  }

  private createLatlngLerp() {
    const [p0, p1, p2, p3] = this._4_corners;

    const dlat = p0.lat - p2.lat;
    let dlon = p3.lon - p2.lon;

    if (dlon < 0) dlon += 360;

    return (ax: number, ay: number) => {
      return { lat: p2.lat + dlat * ay, lon: p2.lon + dlon * ax } as Geo.LatLng;
    };
  }

  private createUVLerp() {
    const [p0, p1, p2, p3] = this._4_uvs;
    const dy = p0.y - p2.y;
    const dx = p3.x - p2.x;
    return (ax: number, ay: number) => {
      return { x: p2.x + dx * ax, y: p2.y + dy * ay } as THREE.Vector2Like;
    };
  }

  private createUV1Lerp() {
    const [p0, p1, p2, p3] = this._4_dem_pos;
    const dy = p2.y - p0.y;
    const dx = p1.x - p0.x;
    return (ax: number, ay: number) => {
      return { x: p2.x + dx * ax, y: p2.y + dy * ay } as THREE.Vector2Like;
    };
  }

  compute(segments = 10) {
    const points = [];
    const uvs = [];
    const uvs1 = [];
    const indices = [];
    const normals = [];

    const w = 5400;
    const h = 2700;
    const n = this.n;

    const times = segments + 1;

    for (let ix = 0; ix <= segments; ix++) {
      for (let iy = 0; iy <= segments; iy++) {
        const latlon = this.latlngLerp(ix / segments, iy / segments);
        const pt = latlngToSphere(latlon);
        points.push(pt.x, pt.y, pt.z);
        vec3util.copy(pt).normalize();
        normals.push(...vec3util.toArray());
        const uv = this.uvLerp(ix / segments, iy / segments);
        uvs.push(uv.x, uv.y);

        const uv1 = this.uv1Lerp(ix / segments, iy / segments);
        uvs1.push(uv1.x, uv1.y);

        if (ix < segments && iy < segments) {
          const i0 = ix * times + iy;
          const i1 = (ix + 1) * times + iy;
          const i2 = (ix + 1) * times + iy + 1;
          const i3 = ix * times + iy + 1;
          indices.push(i0, i1, i3, i3, i1, i2);
        }
      }
    }

    this.points = points;
    this.uvs = uvs;
    this.uvs1 = uvs1;
    this.indices = indices;
    this.normals = normals;
  }

  private points: number[] = [];
  getPoints(): number[] {
    return this.points;
  }

  private uvs: number[] = [];
  getUvs(): number[] {
    return this.uvs;
  }

  private uvs1: number[] = [];
  getUvs1(): number[] {
    return this.uvs1;
  }

  private normals: number[] = [];
  getNormals(): number[] {
    return this.normals;
  }

  private indices: number[] = [];
  getIndices(): number[] {
    return this.indices;
  }

  getTileSrc1() {
    return `https://tile.openstreetmap.org/${this.zoom}/${this.x}/${this.y}.png`;
  }

  getTileSrc2() {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief/default/GoogleMapsCompatible_Level8/${this.zoom}/${this.y}/${this.x}.jpg`;
  }

  getTileSrc() {
    return `https://mt1.google.com/vt/lyrs=s&x=${this.x}&y=${this.y}&z=${this.zoom}&scale=4&hl=en`;
  }

  getTileSrc4() {
    return `http://localhost:8080/qgis-server/?SERVICE=WMTS&REQUEST=GetTile&LAYER=ne_10m_admin_0_countries_nep&FORMAT=image/png&TILEMATRIX=${this.zoom}&TILEMATRIXSET=EPSG:3857&TILEROW=${this.y}&TILECOL=${this.x}`;
  }

  getTileSrc3() {
    return `http://localhost:8080/qgis-server/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=${this.layers}&FORMAT=image/png&STYLES=default,default&SLD_VERSION=1.1.0&CRS=EPSG:4326&BBOX=${this.bbox}&DPI=96&WIDTH=256&HEIGHT=256`;
  }
}

const findTheCenterTile = (zoom: number) => {
  const sphere = camera.position.clone().setLength(EARTH_RADIUS);
  return sphereToLatlng(sphere);
};

const tileIndexToSphere = (x: number, y: number, zoom: number) => {
  const latlng = tileXYZToLeftTopLatLng(x, y, zoom);

  return latlngToSphere({
    lat: latlng.lat,
    lon: latlng.lng,
  });
};

function tileXYZToLeftTopLatLng(x: number, y: number, z: number) {
  // The number of tiles at the given zoom level (2^z)
  const n = Math.pow(2.0, z);

  // Calculate center longitude: use (x + 0.5) to get the center of the tile
  const centerLngDeg = (x / n) * 360.0 - 180.0;

  // Calculate center latitude: use (y + 0.5) for the center
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2.0 * y) / n)));
  const centerLatDeg = (latRad * 180.0) / Math.PI;

  return { lat: centerLatDeg, lng: centerLngDeg };
}

const normUtil = new THREE.Vector3();

const tile4corners = {
  lt: new THREE.Vector3(),
  rt: new THREE.Vector3(),
  lb: new THREE.Vector3(),
  rb: new THREE.Vector3(),
  c: new THREE.Vector3(),
};

const walkTiles = (
  x: number,
  y: number,
  zoom: number,
  walked: Set<string>,
  storage: Set<TileIndex>,
  frustum: THREE.Frustum
) => {
  const tileid = `${x}.${y}.${zoom}`;

  if (walked.has(tileid)) {
    return;
  }

  walked.add(tileid);

  const n = Math.pow(2, zoom);

  tile4corners.lt.copy(tileIndexToSphere(x, y, zoom));
  tile4corners.rt.copy(tileIndexToSphere(x + 1, y, zoom));
  tile4corners.lb.copy(tileIndexToSphere(x, y + 1, zoom));
  tile4corners.rb.copy(tileIndexToSphere(x + 1, y + 1, zoom));
  // tile4corners.c.copy(tileIndexToSphere(x + 0.5, y + 0.5, zoom));

  if (
    !(
      isSpherePointVisible(tile4corners.lt, frustum) ||
      isSpherePointVisible(tile4corners.rt, frustum) ||
      isSpherePointVisible(tile4corners.lb, frustum) ||
      isSpherePointVisible(tile4corners.rb, frustum)
    )
  ) {
    return;
  }

  storage.add({ x, y, z: zoom });

  walkTiles(x > 1 ? x - 1 : n - 1, y, zoom, walked, storage, frustum); // left
  walkTiles((x + 1) % n, y, zoom, walked, storage, frustum); // right

  if (y > 1) {
    walkTiles(x, y - 1, zoom, walked, storage, frustum); // up
  }

  if (y + 1 < n) {
    walkTiles(x, y + 1, zoom, walked, storage, frustum); // down
  }
};

function isSpherePointVisible(p: THREE.Vector3, frustum: THREE.Frustum) {
  normUtil.copy(p);
  const normal = normUtil.normalize();
  const tangent = vec3util.subVectors(camera.position, p).normalize();
  const a = normal.dot(tangent);
  const contains = frustum.containsPoint(p);
  return contains && a > 0;
}

orbitControls.addEventListener("end", () => {
  const { lat } = sphereToLatlng(camera.position);
  const dist = getCameraDistanceFromEarthSurface(camera, lat);
  const ppm = pixelsPerMeter(camera, threejsContainer.clientHeight, lat);
  const zoom = getTileZoomLevel(ppm, lat, 0);

  const speeds = zoomSpeedLevels[zoom];
  // orbitControls.zoomSpeed = speeds.zoom;
  orbitControls.rotateSpeed = speeds.pan;

  // Source - https://stackoverflow.com/a
  // Posted by Leeft, modified by community. See post 'Timeline' for change history
  // Retrieved 2025-12-06, License - CC BY-SA 3.0

  cameraFrustum.setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
  );

  updateTiles(zoom, dist);
});

const updateTiles = (zoom: number, dist: number) => {
  const latlon = findTheCenterTile(zoom);
  const tileIndex = latLonToTile(latlon.lat, latlon.lng, zoom);

  highlightedTiles = new Set();
  visibleTileIndices = new Set();

  walkTiles(
    tileIndex[0],
    tileIndex[1],
    zoom,
    highlightedTiles,
    visibleTileIndices,
    cameraFrustum
  );

  __setTiles?.([...visibleTileIndices]);
  __setLV?.({ z: zoom, d: dist });
};

const cameraFrustum = new THREE.Frustum();
let highlightedTiles: Set<string> = null;
let visibleTileIndices: Set<TileIndex> = null;

let __setLV: (lv: any) => void;
let __setTiles: (tiles: TileIndex[]) => void;

type TileIndex = {
  x: number;
  y: number;
  z: number;
};

const tileIndexToKey = (ti: TileIndex) => `${ti.x}.${ti.y}.${ti.z}`;

const RenderTiles = memo(() => {
  const [tiles, setTiles] = useState<TileIndex[]>([]);
  __setTiles = setTiles;

  console.log("tiles number", tiles.length);

  return (
    <>
      {tiles.map((ti) => {
        const xyz = tileIndexToKey(ti);
        return <RenderTileOne key={xyz} id={xyz} {...ti} />;
      })}
    </>
  );
});

const createMeshFromMaptile = (tile: MapTile, segments = 1) => {
  tile.compute(segments);

  const points = tile.getPoints();
  const normals = tile.getNormals();
  const uvs = tile.getUvs();
  const indices = tile.getIndices();

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3)
  );

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({
      wireframe: true,
      color: 0x000000,
      transparent: false,
      opacity: 0.3,
    })
  );

  tLoader.load(tile.getTileSrc(), (texture) => {
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    mesh.material.map = texture;
    mesh.material.wireframe = false;
    mesh.material.transparent = false;
    mesh.material.opacity = 1;
    mesh.material.color.setHex(0xffffff);

    mesh.material.needsUpdate = true;
  });

  mesh.userData.tile = tile;

  return mesh;
};

const tilesToRemove: Set<MapTile> = new Set();

threeJs.onAnimate((delta) => {
  for (const tile of tilesToRemove) {
    tile.alpha -= 0.005;

    if (tile.alpha <= 0) {
      tilesToRemove.delete(tile);
      _removeTile(tile);
      continue;
    }

    const mesh = tile.mesh;

    mesh.material.opacity = tile.alpha;
    mesh.material.needsUpdate = true;
  }

  console.log("to remove", tilesToRemove.size);
});

const removeTile = (tile: MapTile) => {
  const mesh = tile.mesh;

  mesh.material.transparent = true;
  mesh.material.depthTest = false;
  mesh.material.needsUpdate = true;

  tilesToRemove.add(tile);
};

const _removeTile = (tile: MapTile) => {
  const mesh = tile.mesh;

  world.remove(mesh);

  mesh.geometry.dispose();
  mesh.material.map?.dispose();
  mesh.material.displacementMap?.dispose();
  mesh.material.dispose();
};

type RenderTileOne = { id: string; x: number; y: number; z: number };

const RenderTileOne = memo(({ x, y, z }: RenderTileOne) => {
  const tile = new MapTile(x, y, z);
  const mesh = createMeshFromMaptile(tile, 20);
  tile.mesh = mesh;
  world.add(mesh);

  useEffect(() => {
    return () => {
      _removeTile(tile);
    };
  }, []);

  return null;
});

const Tile = () => {
  const [lv, setLv] = useState({ z: currentZoomLv, d: 0 });
  __setLV = setLv;
  const latlon = findTheCenterTile(lv.z);
  const tileIndex = latLonToTile(latlon.lat, latlon.lng, lv.z);

  return (
    <div className=" pointer-events-none w-fit bg-green-700/70 text-white fixed top-2 right-2 p-4">
      <div>zoom-level: {lv.z}</div>
      <div>tiles: {Math.pow(Math.pow(2, lv.z), 2)}</div>
      <div>
        latlon: {latlon.lat.toPrecision(5)},{latlon.lng.toPrecision(5)}
      </div>
      <div>tile: {tileIndex.join(",")}</div>
      <div>dist: {(lv.d / 1000).toPrecision(3)} km</div>
      <div>ro speed: {orbitControls.rotateSpeed}</div>
      <RenderTiles />
    </div>
  );
};

ReactDOM.createRoot(document.querySelector(".App"), {}).render(<Tile />);
