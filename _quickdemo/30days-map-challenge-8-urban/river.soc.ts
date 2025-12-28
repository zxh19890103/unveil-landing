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
import { Sky } from "three/addons/objects/Sky.js";
import { pointToPolygonDistance } from "@turf/point-to-polygon-distance";
import { bbox as turfBbox } from "@turf/bbox";

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
  const [lat, lng] = [29.56538468258404, 106.5875480740474];
  // const [lng, lat] = [106.5774281, 29.5526704];
  const zoom = 12; // it's the best zoom level to load the data of osm and dem.

  const __ti__ = latLonToTile(lat, lng, zoom);
  const reGen = false;

  // bbox;
  const leftTop = tileToLatLon(__ti__[0], __ti__[1], zoom);
  const rightTop = tileToLatLon(__ti__[0] + 1, __ti__[1], zoom);
  const leftBottom = tileToLatLon(__ti__[0], __ti__[1] + 1, zoom);
  const rightBottom = tileToLatLon(__ti__[0] + 1, __ti__[1] + 1, zoom);
  const center = tileToLatLon(__ti__[0] + 0.5, __ti__[1] + 0.5, zoom);

  const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon}`;

  const getGooTileUrl = (xyz: { x: number; y: number; z: number }) => {
    return `http://0.0.0.0:3003/gtile/${xyz.z}/${xyz.x}/${xyz.y}`;
  };

  const meters_per_lon = Meters_per_lon(center.lat);

  const meters_by_x = meters_per_lon * (rightTop.lon - leftBottom.lon);
  const meters_by_y = Meters_per_lat * (rightTop.lat - leftBottom.lat);

  camera.near = 100;
  camera.far = 100000;
  camera.updateProjectionMatrix();
  camera.position.set(0, 600, 2000);

  controls.zoomSpeed = 1;
  controls.rotateSpeed = 1;

  const segments_by_x = 1266;
  const segments_by_y = 1164;

  const waterwayGeojson = await fetch(
    `http://0.0.0.0:3003/osm?bbox=${bbox}&way=waterway&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  ).then((r) => r.json());

  const naturalGeojson = await fetch(
    `http://0.0.0.0:3003/osm?bbox=${bbox}&way=natural&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  ).then((r) => r.json());

  const calcXYZFromLatlng = (lat: number, lng: number) => {
    const dlat = lat - leftBottom.lat;
    const dlng = lng - leftBottom.lon;

    const x = meters_per_lon * dlng;
    const y = Meters_per_lat * dlat;

    return [x, y, 0];
  };

  const projectFn: Projector = (lnglat) => {
    return calcXYZFromLatlng(lnglat[1], lnglat[0]) as XY;
  };

  const waterways = waterwayGeojson.features
    .filter((feature) => {
      return (
        feature.properties.waterway === "river" &&
        feature.properties.id !== "relation/288614" &&
        feature.properties.name === "长江" &&
        !(feature.properties.layer === "-1") &&
        feature.geometry.type === "LineString"
      );
    })
    .map(({ geometry, properties }) => {
      return {
        name: properties.name,
        name2: properties["name:en"],
        code: properties.code,
        id: properties.id,
        waterway: geometry,
      };
    });

  const canvas = rasterPolygons(
    naturalGeojson.features
      .filter((feature) => {
        return (
          feature.properties.natural === "water" &&
          feature.properties.water === "river" &&
          feature.geometry.type === "Polygon"
        );
      })
      .map((feature) => {
        return feature.geometry;
      }),
    waterways,
    projectFn,
    new THREE.Vector2(meters_by_x, meters_by_y),
    1024,
    900,
    false
  );

  const texture = new THREE.CanvasTexture(canvas);

  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;

  const riverMap = textLoader.load(
    "/quickdemo/30days-map-challenge-8-urban/river-huge.jpeg"
  );

  riverMap.wrapS = THREE.RepeatWrapping;
  riverMap.wrapT = THREE.RepeatWrapping;
  riverMap.minFilter = THREE.LinearFilter;
  riverMap.magFilter = THREE.LinearFilter;

  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(
      meters_by_x,
      meters_by_y,
      segments_by_x,
      segments_by_y
    ),
    new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        map: {
          value: textLoader.load(
            getGooTileUrl({
              x: __ti__[0],
              y: __ti__[1],
              z: zoom,
            })
          ),
        },
        riverMask: {
          value: texture,
        },
      },
      vertexShader: `

      varying vec2 vUv;

      void main() {
        vec4 pos = vec4(position, 1.0);
        vUv = uv;
        gl_Position=projectionMatrix * modelViewMatrix * pos;
      }
        `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D riverMask;

        varying vec2 vUv;

        void main() {
            vec4 color = texture2D(riverMask, vec2(vUv.x, 1.0 - vUv.y));
            vec4 color2 = texture2D(map, vUv);

            if (length(color.rgb) == 0.0) {
                gl_FragColor = vec4(color2.rgb, 1.0);
            } else {
                gl_FragColor = vec4(0.6 * color2.rgb, 1.0);
            }
        }
        `,
    })
  );

  tile.rotation.x = -Math.PI / 2;
  world.add(tile);

  const flowRiverGeo = creatWaterwayGeometry(waterways, 1024, 1100);

  const myMat = new THREE.ShaderMaterial({
    uniforms: {
      map: {
        value: riverMap,
      },
      riverMask: {
        value: texture,
      },
      utime: {
        value: 0,
      },
    },
    transparent: true,
    wireframe: false,
    vertexColors: true,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.MaxEquation,
    blendDst: THREE.OneFactor,
    blendSrc: THREE.OneFactor,
    // blending: THREE.SubtractiveBlending,
    // premultipliedAlpha: true,
    vertexShader: `
      attribute vec2 uv1;

      // uniform sampler2D riverMask;

      varying vec2 vUv;
      varying vec2 vUv1;
      varying vec3 vColor;

      uniform float utime;

      void main() {
        vec4 pos = vec4(position, 1.0);
        vUv = uv;
        vUv1 = uv1;
        vColor = color;
        gl_Position=projectionMatrix * modelViewMatrix * pos;
      }
        `,
    fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D riverMask;
        uniform float utime;

        varying vec3 vColor;
        varying vec2 vUv;
        varying vec2 vUv1;

        void main() {
            vec4 color = texture2D(riverMask, vec2(vUv.x, 1.0 - vUv.y));

            vec2 uv1 = vec2(vUv1.x, vUv1.y + 0.1 * utime);

            vec4 color2 = texture2D(map, uv1);

            if (length(color.rgb) == 0.0) {
                discard;
            } else {
                gl_FragColor = vec4(color2.rgb, 0.5);
            }
        }
        `,
  });

  animationLoop((delta, elapsed) => {
    myMat.uniforms.utime.value = elapsed;
  });

  const flowRiver = new THREE.Mesh(
    flowRiverGeo,
    myMat
    // new THREE.MeshBasicMaterial({
    //   wireframe: true,
    //   color: 0xffffff,
    // })
  );

  flowRiver.position.set(-meters_by_x / 2, -meters_by_y / 2, 0);

  tile.add(flowRiver);

  function creatWaterwayGeometry(
    waterways: OsmWaterway[],
    dimension = 1024,
    width_half = 900
  ) {
    const geometry = new THREE.BufferGeometry();

    const positions: number[] = [];
    const indices: number[] = [];
    const uv: number[] = [];
    const uv1: number[] = [];
    const colors: number[] = [];

    const P = new THREE.Vector2();
    const P1 = new THREE.Vector2();
    const P2 = new THREE.Vector2();
    const tan = new THREE.Vector2();
    const S = new THREE.Vector2();

    const scale = dimension / meters_by_x;

    let curve: THREE.SplineCurve;
    let cursor = 0;

    waterways.forEach(({ name, waterway }) => {
      curve = new THREE.SplineCurve(
        waterway.coordinates.map((coord) => {
          return new THREE.Vector2(...projectFn(coord));
        })
      );

      const distance = curve.getLength();
      const times = Math.ceil(scale * distance);
      const color = new THREE.Color(Math.random() * 0xffffff);
      console.log(`%c${name}`, `background: ${color.getStyle()}; color: white`);

      let v = 0;
      let v_delta = 0.005;
      const v_max = 1;

      for (let i = 0; i <= times; i++) {
        if (v > v_max) {
          v_delta = -0.005;
        }

        if (v < 0) {
          v_delta = 0.005;
        }

        v += v_delta;

        console.log(v);
        curve.getPointAt(i / times, P);
        curve.getTangentAt(i / times, tan);

        S.x = tan.y;
        S.y = -tan.x;

        S.setLength(width_half).add(P);
        P1.copy(S);

        S.x = tan.y;
        S.y = -tan.x;
        S.negate();

        S.setLength(width_half).add(P);
        P2.copy(S);

        positions.push(P1.x, P1.y, 0, P2.x, P2.y, 0);
        colors.push(color.r, color.g, color.b, color.r, color.g, color.b);

        uv.push(
          P1.x / meters_by_x,
          P1.y / meters_by_y,
          P2.x / meters_by_x,
          P2.y / meters_by_y
        );
        uv1.push(0.0, v, 1.0, v);

        if (i < times) {
          indices.push(
            cursor,
            cursor + 2,
            cursor + 1,
            cursor + 1,
            cursor + 2,
            cursor + 3
          );
        }

        cursor += 2;
      }
    });

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setAttribute("uv1", new THREE.Float32BufferAttribute(uv1, 2));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);

    return geometry;
  }

  function isOneThing(waterway0: OsmWaterway, waterway1: OsmWaterway) {
    if (waterway0.code && waterway1.code)
      return waterway0.code === waterway1.code;

    if (waterway0.name && waterway1.name)
      return waterway0.name === waterway1.name;

    if (waterway0.name2 && waterway1.name2)
      return waterway0.name2 === waterway1.name2;

    return false;
  }

  function fixOsmWaterwayDuplication(waterways: OsmWaterway[]) {
    // code first, and them name, finally name:en,
    // preseve the one of relation if duplicated.
  }
});

type LngLat = [number, number];
type XY = [number, number];
type Projector = (lnglat: LngLat) => XY;
type Polygon = { type: "Polygon"; coordinates: LngLat[][] };
type LineString = { type: "LineString"; coordinates: LngLat[] };
type OsmWaterway = {
  name: string;
  name2: string;
  code: string;
  id: string;
  waterway: LineString;
};

function rasterPolygons(
  polygons: Polygon[],
  waterways: OsmWaterway[],
  project: Projector,
  tileSize: THREE.Vector2,
  dimension = 64,
  radius = 900,
  mount = true
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = dimension;
  canvas.height = dimension;

  const scaleX = dimension / tileSize.x;
  const scaleY = dimension / tileSize.y;

  const ctx2d = canvas.getContext("2d");
  ctx2d.fillStyle = "#000000";
  ctx2d.fillRect(0, 0, dimension, dimension);

  ctx2d.fillStyle = "white";

  let positions: LngLat[];
  let size = 0;
  let coord: LngLat;
  let x: number;
  let y: number;
  let cursor = 0;

  const line = () => {
    coord = positions[cursor];
    [x, y] = project(coord);
    x *= scaleX;
    y *= scaleY;
    // y = dimension - y;
  };

  const render = () => {
    for (const polygon of polygons) {
      ctx2d.beginPath();

      positions = polygon.coordinates[0];
      size = positions.length;

      cursor = 0;

      line();
      ctx2d.moveTo(x, y);

      cursor = 1;
      for (; cursor < size; cursor++) {
        line();
        ctx2d.lineTo(x, y);
      }

      ctx2d.closePath();
      ctx2d.fill();
    }
  };

  render();

  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 999;
  `;

  if (mount) {
    document.body.appendChild(canvas);
  }

  return canvas;
}

const fillFlowUV = (
  // mask
  canvas: HTMLCanvasElement,
  // flow fields
  canvas2: HTMLCanvasElement,
  dimension: number
) => {
  const ctx2d = canvas.getContext("2d");
  const ctx2d2 = canvas2.getContext("2d");
  const size = dimension * dimension;
  const data = new Float32Array(size * 4);

  const imageData = ctx2d.getImageData(0, 0, dimension, dimension);
  const imageData2 = ctx2d2.getImageData(0, 0, dimension, dimension);
  const imageDataData = imageData.data;
  const imageDataData2 = imageData2.data;

  const color = new THREE.Color();

  for (let y = 0; y < dimension; y++) {
    for (let x = 0; x < dimension; x++) {
      const idx = 4 * (y * dimension + x);

      const r2 = imageDataData[idx];

      if (r2 > 0) {
        // 0xfeaded
        const r = imageDataData2[idx];
        const g = imageDataData2[idx + 1];
        const b = imageDataData2[idx + 2];

        color.setRGB(r / 255, g / 255, b / 255);

        const idx2 = 4 * (y * dimension + x);
        // compute uv according to the river flow dir at this position.
        // uv = getUV(x, y);
        data[idx2] = 0.0;
        data[idx2 + 1] = color.g;
        data[idx2 + 2] = color.b;
      }
    }
  }

  const texture = new THREE.DataTexture(
    data,
    dimension,
    dimension,
    THREE.RGBAFormat,
    THREE.FloatType,
    THREE.UVMapping,
    THREE.ClampToEdgeWrapping,
    THREE.ClampToEdgeWrapping,
    THREE.NearestFilter,
    THREE.NearestFilter
  );

  texture.needsUpdate = true;

  return texture;
};

function rasterLineStrings(
  canvas: HTMLCanvasElement,
  lineStrings: LineString[],
  project: Projector,
  tileSize: THREE.Vector2,
  dimension = 64
) {
  const ctx2d = canvas.getContext("2d");

  const scaleX = dimension / tileSize.x;
  const scaleY = dimension / tileSize.y;

  ctx2d.beginPath();
  ctx2d.strokeStyle = "#019f0e";

  let positions: LngLat[];
  let size = 0;
  let coord: LngLat;
  let x: number;
  let y: number;
  let cursor = 0;

  const line = () => {
    coord = positions[cursor];
    [x, y] = project(coord);
    x *= scaleX;
    y *= scaleY;
    y = dimension - y;
  };

  const render = () => {
    for (const lineStr of lineStrings) {
      positions = lineStr.coordinates;
      size = positions.length;

      cursor = 0;

      line();
      ctx2d.moveTo(x, y);

      cursor = 1;
      for (; cursor < size; cursor++) {
        line();
        ctx2d.lineTo(x, y);
      }

      ctx2d.stroke();
    }
  };

  render();
  return canvas;
}

/**
 * use SplineCurve
 */
function rasterLineStrings2(
  canvas: HTMLCanvasElement,
  lineStrings: LineString[],
  project: Projector,
  tileSize: THREE.Vector2,
  dimension = 64
) {
  const ctx2d = canvas.getContext("2d");

  const scaleX = dimension / tileSize.x;
  const scaleY = dimension / tileSize.y;

  let size = 0;
  let x: number;
  let y: number;
  let cursor = 0;

  let path: THREE.SplineCurve;

  const line = () => {
    const coord = path.getPointAt(cursor / size);
    x = coord.x;
    y = coord.y;

    x *= scaleX;
    y *= scaleY;
    y = dimension - y;
  };

  const getPointAt = (u: number, target: THREE.Vector2) => {
    path.getPointAt(u, target);
    let x = target.x;
    let y = target.y;

    x *= scaleX;
    y *= scaleY;
    y = dimension - y;

    target.x = x;
    target.y = y;
  };

  const createPath = (lineStr: LineString) => {
    path = new THREE.SplineCurve(
      lineStr.coordinates.map((coord) => {
        return new THREE.Vector2(...project(coord));
      })
    );

    size = Math.ceil(scaleX * path.getLength());
  };

  const vec2 = new THREE.Vector2(0, 0);
  const vec2_1 = new THREE.Vector2(0, 0);

  const getDir = (u: number) => {
    getPointAt(u, vec2);
    getPointAt(Math.min(1, u + 0.01), vec2_1);

    return vec2_1.sub(vec2);
  };

  const renderDir = () => {
    cursor = 0;

    line();
    ctx2d.moveTo(x, y);

    cursor = 1;
    for (; cursor < size; cursor++) {
      line();
      ctx2d.lineTo(x, y);
    }

    ctx2d.stroke();
  };

  const renderScan = () => {
    cursor = 0;
    // console.log(size, cursor);

    for (; cursor < size; cursor++) {
      line();

      ctx2d.beginPath();
      ctx2d.strokeStyle = "#ad01a9";
      ctx2d.moveTo(x, y);
      //   console.log(cursor / size);
      const tangent = getDir(cursor / size);
      const hx = tangent.y;
      const hy = -tangent.x;
      tangent.set(hx, hy).negate();
      tangent.setLength(100).add({ x, y });
      ctx2d.lineTo(tangent.x, tangent.y);
      ctx2d.stroke();
    }
  };

  const render = () => {
    for (const lineStr of lineStrings) {
      createPath(lineStr);

      ctx2d.beginPath();
      ctx2d.strokeStyle = "#de019a";
      renderDir();
      //   renderScan();
    }
  };

  render();

  return canvas;
}

function rasterLineStrings2AsFlowFields(
  lineStrings: LineString[],
  project: Projector,
  tileSize: THREE.Vector2,
  dimension = 64
) {
  const canvas = document.createElement("canvas");
  canvas.width = dimension;
  canvas.height = dimension;

  const scanWidthHalf = 150;

  const ctx2d = canvas.getContext("2d");

  ctx2d.fillStyle = "0x000000";
  ctx2d.lineWidth = 2;

  ctx2d.fillRect(0, 0, dimension, dimension);

  const scaleX = dimension / tileSize.x;
  const scaleY = dimension / tileSize.y;

  let size = 0;
  let x: number;
  let y: number;
  let cursor = 0;

  let path: THREE.SplineCurve;

  const line = () => {
    const coord = path.getPointAt(cursor / size);
    x = coord.x;
    y = coord.y;

    x *= scaleX;
    y *= scaleY;
    // y = dimension - y;
  };

  const getPointAt = (u: number, target: THREE.Vector2) => {
    path.getPointAt(u, target);
    let x = target.x;
    let y = target.y;

    x *= scaleX;
    y *= scaleY;
    // y = dimension - y;

    target.x = x;
    target.y = y;
  };

  const createPath = (lineStr: LineString) => {
    path = new THREE.SplineCurve(
      lineStr.coordinates.map((coord) => {
        return new THREE.Vector2(...project(coord));
      })
    );

    size = Math.ceil(scaleX * path.getLength());
  };

  const vec2 = new THREE.Vector2(0, 0);
  const vec2_1 = new THREE.Vector2(0, 0);

  const getDir = (u: number) => {
    getPointAt(u, vec2);
    getPointAt(Math.min(1, u + 0.01), vec2_1);

    return vec2_1.sub(vec2);
  };

  const renderScan = () => {
    cursor = 0;

    const colorBase = 0x000000;
    const color = new THREE.Color();
    // const delta = 1 / size;

    for (; cursor < size; cursor++) {
      line();

      ctx2d.beginPath();
      color.setHex(colorBase + cursor);

      ctx2d.strokeStyle = color.getStyle();
      ctx2d.moveTo(x, y);

      const tangent = getDir(cursor / size);
      const hx = tangent.y;
      const hy = -tangent.x;
      tangent.set(hx, hy);

      // left
      tangent.setLength(scanWidthHalf).add({ x, y });
      ctx2d.lineTo(tangent.x, tangent.y);
      ctx2d.stroke();

      // right
      tangent.set(hx, hy).negate();
      tangent.setLength(scanWidthHalf).add({ x, y });
      ctx2d.lineTo(tangent.x, tangent.y);
      ctx2d.stroke();
    }
  };

  const render = () => {
    for (const lineStr of lineStrings) {
      createPath(lineStr);
      console.log(lineStr);
      renderScan();
    }
  };

  render();

  return canvas;
}

function polygonizedRasterToBiArray(canvas: HTMLCanvasElement, size: number) {}
