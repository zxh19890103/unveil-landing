import * as THREE from "three";
// import GeoJsonGeometry from "three-geojson-geometry";
import { geoMercator, type XY } from "./geo-mercator.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { MapControls } from "three/addons/controls/MapControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Missile } from "./Missile.class.js";

import { gsap } from "gsap";

// 基本場景與相機
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 40);
camera.lookAt(0, 0, 0);

// const aspect = window.innerWidth / window.innerHeight;
// const frustumSize = 60;
// const camera = new THREE.OrthographicCamera(
//   (-frustumSize * aspect) / 2, // left
//   (frustumSize * aspect) / 2, // right
//   frustumSize / 2, // top
//   -frustumSize / 2, // bottom
//   0.1, // near
//   1000 // far
// );
// camera.position.z = 600;

const renderer2d = new CSS2DRenderer({});

const ren = new THREE.WebGLRenderer({ antialias: true });
ren.setSize(innerWidth, innerHeight);
ren.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(ren.domElement);

renderer2d.domElement.style.position = "absolute";
renderer2d.domElement.style.pointerEvents = "none";
renderer2d.domElement.style.top = "0px";
renderer2d.domElement.style.left = "0px";
// renderer2d.domElement.style.zIndex = "120";

renderer2d.setSize(innerWidth, innerHeight);

document.body.appendChild(renderer2d.domElement);

const controls = new OrbitControls(camera, ren.domElement);
controls.enableDamping = true; // Smooth motion
controls.dampingFactor = 0.05;

// const controls = new MapControls(camera, ren.domElement);
// controls.enableDamping = true; // Smooth motion
// controls.dampingFactor = 0.05;

window.addEventListener("resize", () => {
  // cam.aspect = innerWidth / innerHeight;
  // cam.updateProjectionMatrix();
  // ohrcam.updateProjectionMatrix();
  controls.update();
  ren.setSize(innerWidth, innerHeight);
  renderer2d.setSize(innerWidth, innerHeight);
});

ren.setClearColor(0xffffff);
ren.setClearAlpha(0);

// 燈光
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);

const _geoMercator = geoMercator();

function stableColorByName(name) {
  // 簡單 hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 60%)`;
}

const geoshapeMat = new THREE.LineBasicMaterial({ color: 0x000000 });

function CreateGeoLine(name: string, latlngs: Array<[number, number]>) {
  const ptsForMeshes = latlngs.map((latlng) => {
    const xy = _geoMercator.project2d(latlng);
    return new THREE.Vector2(xy[0], xy[1]);
  });

  const color = stableColorByName(name);

  const shape = new THREE.ShapeGeometry(new THREE.Shape(ptsForMeshes));

  const mesh = new THREE.Mesh(shape, new THREE.MeshBasicMaterial({ color }));

  const lineGeo = new THREE.EdgesGeometry(shape);
  const lines = new THREE.LineSegments(lineGeo, geoshapeMat);
  // mesh.frustumCulled = false;
  scene.add(mesh, lines);
}

function CreateCountry(geojsonFile: string) {
  fetch(`./data/${geojsonFile}.json`)
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

// CreateCountry("gadm41_CHN_1");
// CreateCountry("gadm41_JPN_1");
CreateCountry("gadm41_TWN_1");

function CreateQQ(pic: string, size: number, position: XY) {
  const tankDiv = document.createElement("div");
  tankDiv.style.width = `${size}px`;
  tankDiv.style.height = `${size}px`;
  tankDiv.innerHTML = `<img src="./data/${pic}" />`;
  const tank = new CSS2DObject(tankDiv);
  tank.position.set(position[0], position[1], 0);
  scene.add(tank);

  gsap.to(tank.position, {
    x: position[0] - 10,
    y: position[1] - 10,
    duration: 10,
  });
}

// for (let i = 0; i < 30; i++) {
//   CreateQQ("tank.png", 40, [(2 * i) / 5, (4 * i) % 5]);
// }

for (let j = 0; j < 10; j++) {
  CreateQQ("warship.png", 50, [(5 * j) / 5, (6 * j) % 5]);
}

const missile = new Missile(
  scene,
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(20, 0, 0),
  {
    midHeight: 30,
    speed: 1,
    missileColor: 0xff4444,
    tailColor: 0xffdd00,
  }
);

const clock = new THREE.Clock();

const loader = new GLTFLoader();
loader.load(
  "./data/t-90sm_main_battle_tank.glb", // 模型路徑
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    scene.add(model);
  },
  (xhr) => {
    console.log(`Loading: ${((xhr.loaded / xhr.total) * 100).toFixed(1)}%`);
  },
  (error) => {
    console.error("Failed to load GLTF model:", error);
  }
);

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta() * 0.1;
  missile.update(dt);
  controls.update(); // required for damping
  ren.render(scene, camera);
  renderer2d.render(scene, camera);
}

animate();
