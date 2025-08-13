import * as THREE from "three";
import React from "react";
import ReactDOM from "react-dom/client";
import { _geoMercator, lngLat } from "./crs.js";
import Sidebar from "./sidebar.js";
import { ThreeJsSetup } from "@/_shared/ThreeJsSetup.class.js";
import { ModelObj, quickdemoAssets, sounds } from "@/_shared/index.js";
import { Missile } from "./Missile.class.js";
import type { LngLat } from "@/_shared/geo-mercator.js";
import { gsap } from "gsap";

const threejsContainer = document.querySelector(
  "#threejs-container"
) as HTMLElement;

const threeJs = new ThreeJsSetup(threejsContainer);
threeJs.setupControls();

const staticWorld = threeJs.createWorld();

const { camera, scene: world } = threeJs;
camera.position.set(0, -18, 10);
camera.lookAt(0, 0, 0);
camera.add(sounds.audioLis);

threeJs.addCSS2DRenderer();

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(0, 1000, 0);
world.add(dirLight, dirLight.target);

const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
world.add(ambLight);

const renderRendererTiles = () => {
  rendererTiles.render(staticWorld, camera);
};

threeJs.addEventListener("viewportResize", () => {
  renderRendererTiles();
});

threeJs.controls.addEventListener("change", () => {
  renderRendererTiles();
});

function stableColorByName(name) {
  // 簡單 hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 60%)`;
}

const geoshapeMat = new THREE.LineBasicMaterial({ color: 0x3b2e16 });

function CreateGeoLine(name: string, latlngs: Array<[number, number]>) {
  const ptsForMeshes = latlngs.map((latlng) => {
    const xy = _geoMercator.project(latlng);
    return new THREE.Vector2(xy[0], xy[1]);
  });

  const color = stableColorByName(name);
  const rgb = new THREE.Color(color);

  const shape = new THREE.ShapeGeometry(new THREE.Shape(ptsForMeshes));

  const geomeshMat = new THREE.ShaderMaterial({
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    // uniform vec3 uColor;
    varying vec2 vUv;

    // GLSL 2D noise 函數（你可以內嵌進 shader 中）
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(
        mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
        u.y);
    }

    float fakeHeight(vec2 uv) {
      float h = sin(uv.x * 10.0) * cos(uv.y * 10.0);
      return h;
    }

    void main() {
      float h = noise(vUv * 60.0);
      // float h = fakeHeight(vUv);
      vec3 baseColor = mix(vec3(${rgb
        .toArray()
        .join(",")}), vec3(0.8, 0.8, 0.6), h * 0.5 + 0.5);
      gl_FragColor = vec4(baseColor, 1);
    }
  `,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(shape, geomeshMat);

  const lineGeo = new THREE.EdgesGeometry(shape);
  const lines = new THREE.LineSegments(lineGeo, geoshapeMat);
  // mesh.frustumCulled = false;
  staticWorld.add(mesh, lines);
}

function CreateCountry(geojsonFile: string) {
  return fetch(`./data/${geojsonFile}.json`)
    .then((r) => r.json())
    .then(
      (json) => {
        // console.log(json.features);
        json.features.forEach((geojson) => {
          const geo = geojson.geometry;
          if (geo.type === "MultiPolygon") {
            const coordinates = geo.coordinates;
            for (const cood of coordinates) {
              CreateGeoLine(geojson.properties["NL_NAME_1"], cood[0]);
            }
          } else {
            console.log(geo.type, geo);
          }
        });
      },
      (ex) => {
        console.log(ex);
      }
    )
    .catch((ex) => {
      console.log(ex);
    });
}

let missiles: Missile[] = [];

function shoot(this: ModelObj, to: LngLat) {
  const missile = new Missile(this.position.clone(), lngLat(...to));
  world.add(missile);
  missiles.push(missile);
}

Promise.all([
  CreateCountry("gadm41_CHN_1"),
  CreateCountry("gadm41_JPN_1"),
  CreateCountry("gadm41_TWN_1"),
]).then(() => {
  renderRendererTiles();
});

const rendererTiles = threeJs.addWebGLRenderer("tile", threejsContainer, {
  animated: false,
  antialias: true,
  zIndex: 1,
});

function createDebugBall(radius = 0.1, color = 0xff0000) {
  const geometry = new THREE.SphereGeometry(radius, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  world.add(sphere);
  return sphere;
}

function moveTo(this: ModelObj, _lngLat: LngLat) {
  const pos = lngLat(..._lngLat);
  const ref = this.position;
  const dx = pos.x - ref.x;
  const dy = pos.y - ref.y;

  const mainTl = gsap.timeline();

  const dist = Math.sqrt(dx * dx + dy * dy);

  const theta = Math.atan2(dy, dx);

  mainTl.to(this.rotation, {
    z: theta,
    duration: 2,
  });

  // this.faceTo(pos);
  // mainTl.to(this.position, {
  //   x: pos.x,
  //   y: pos.y,
  //   duration: dist,
  // });
}

const tanks: ModelObj[] = [];

/**
 * tank: {
        scaleFactor: 0.1,
        rotation: [1, -1, 0],
      }
 */

const buildTank = (layout: Array<[string, number, number]>, target: LngLat) => {
  layout.forEach((geoCenter, $i) => {
    const modelObj = new ModelObj(
      quickdemoAssets.quickdemo_military_data_t_90sm_main_battle_tank_glb,
      "./data/tank.png",
      "grey",
      {
        scaleFactor: 0.3,
        rotation: [1, -1, 0],
      }
      // {
      //   scaleFactor: 0.001,
      //   rotation: [1, 0, 0],
      // }
    );

    modelObj.position.copy(lngLat(geoCenter[2], geoCenter[1]));

    tanks.push(modelObj);
    world.add(modelObj);

    modelObj.shootTarget = target;

    moveTo.call(modelObj, target);
  });

  threeJs.onAnimate((delta, elapse) => {
    for (const missile of missiles) {
      missile.update(delta);
    }
  });
};

const beijingGeoCenter: LngLat = [116.4074, 39.9042]; // [緯度, 經度]
const japanGeoCenter: LngLat = [136.7567, 35.4875]; // [緯度, 經度]

buildTank(
  [
    ["武漢", 30.545, 114.342],
    ["西藏", 31.91, 89.15],
    ["新疆", 42.0, 86.0],
    ["青海", 35.5, 96.8],
    ["福建", 26.2, 117.8],
  ],
  japanGeoCenter
);

buildTank([["japan", 35.4875, 136.7567]], beijingGeoCenter);

threeJs.startAnimation();

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement(Sidebar, {
    onSetup: (totals) => {
      tanks.forEach((tank) => {
        shoot.call(tank, tank.shootTarget);
      });
    },
  })
);
