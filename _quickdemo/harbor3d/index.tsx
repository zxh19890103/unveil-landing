import { ModelObj, ThreeJsSetup } from "@/_shared/index.js";
import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { Water } from "three/addons/objects/Water.js";
// import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Land } from "./Land.class.js";
import { Cargo } from "./Cargo.class.js";
import { Dock } from "./Dock.class.js";
import Panel from "./Panel.js";
import { Label } from "@/_shared/Label.class.js";
import { Road } from "./Road.class.js";
import { KmlGisMap } from "@/_shared/kml.js";

const DEG2RAD = THREE.MathUtils.DEG2RAD;

const threejsContainer = document.querySelector(
  "#threejs-container"
) as HTMLElement;

const threeJs = new ThreeJsSetup(threejsContainer, 75);
threeJs.setupControls();
threeJs.addCSS2DRenderer();

const { scene, camera } = threeJs;

camera.position.set(-1, 16, 3);
camera.position.setLength(700);

/*
{
  const group = new THREE.Group();

  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 10; y++) {
      const cargo = new Cargo(0 ^ (Math.random() * 0xffffff));
      cargo.position.set(
        x * (cargo.size.x + 0.6),
        cargo.size.y / 2,
        y * (cargo.size.z + 0.2)
      );
      group.add(cargo);
    }
  }

  group.position.y = 3;
  scene.add(group);
}*/

scene.add(new THREE.DirectionalLight("white", 1.2));
scene.add(new THREE.AmbientLight("white", 0.8));

//#region  sky
// Create and configure Sky
const sky = new Sky();
sky.scale.setScalar(100); // Large scale to encompass the scene
scene.add(sky);

// Set sky uniforms
const uniforms = sky.material.uniforms;
uniforms["turbidity"].value = 1;
uniforms["rayleigh"].value = 2;
uniforms["mieCoefficient"].value = 0.0001;
uniforms["mieDirectionalG"].value = 0.5;

// Set sun position
const sun = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(86); // Near horizon for sunset
const theta = THREE.MathUtils.degToRad(-180);
sun.setFromSphericalCoords(1, phi, theta);
uniforms["sunPosition"].value.copy(sun);
//#endregion

//#region  water
/*
{
  const waterGeometry = new THREE.PlaneGeometry(80, 80);
  // 创建水面
  const water = new Water(waterGeometry, {
    textureWidth: 1000,
    textureHeight: 1000,
    waterNormals: new THREE.TextureLoader().load(
      "./waternormals.jpg", // 法线贴图
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(0, 1, 0), // 光照方向
    sunColor: 0xffffff, // 阳光颜色
    waterColor: 0x1240ff, // 水体颜色
    distortionScale: 0.01, // 波纹强度
    fog: scene.fog !== undefined, // 是否跟随场景雾
  });

  // 旋转到水平
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;
  scene.add(water);

  threeJs.onAnimate((delta) => {
    // 驱动波浪时间
    water.material.uniforms["time"].value += delta;
  });
}
*/

{
  const waterGeometry = new THREE.PlaneGeometry(200, 200);

  const water = new THREE.Mesh(
    waterGeometry,
    new THREE.MeshBasicMaterial({
      color: 0x126ad1,
      side: THREE.DoubleSide,
    })
  );

  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.2;

  scene.add(water);
}

//#endregion

{
  // const road = new ModelObj("./road/scene.gltf", "road", 0xfe9102, {
  //   rotation: [0, 1, 0],
  //   scaleFactor: 0.2,
  //   offset: [0, -50, 0],
  // });
  // road.repeat(6, "z");
  // scene.add(road);
}

// truck
const map = new KmlGisMap("./大連港.kml", {
  center: "38.92186, 121.62554",
  scale: 100,
  onCenter: (center) => {
    camera.position.set(center.x, 5, center.y);
    threeJs.controls["target"].copy(center);
  },
  onReady: () => {},
});

scene.add(map);

const Labels: React.ReactPortal[] = [];

{
  const truck = new ModelObj("./generic_truck/scene.gltf", "ship", 0xffffff, {
    offset: [0, 0, 0],
    rotation: [0, -1, 0],
    scaleFactor: 0.0008,
  });

  truck.traverse((child) => {
    if (Object.hasOwn(child, "isMesh")) {
      if (child["material"]) {
        child["material"].depthWrite = true;
      }
    }
  });

  truck.userData.licenseNo = "川A91001";
  truck.userData.cargos = [1, 1, 1, 1];
  truck.userData.distance = 9;

  const label = new Label(({ obj, distance, licenseNo, cargos }) => {
    return (
      <div className=" bg-slate-200/70 text-sm p-1 rounded-sm">
        <ul>
          <li>車牌號: {licenseNo}</li>
          <li>集裝箱: {cargos?.length}, 1ton/1, 1x1x2 (m)</li>
          <li>距離港口: {distance}km</li>
          <li>預計達到: {new Date().toTimeString()}</li>
        </ul>
      </div>
    );
  });

  Labels.push(label.portal);
  label.$for(truck);

  map.add(truck);

  map.onReady(() => {
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();
    let u = 0;

    const road = map.roads[0];

    threeJs.onAnimate((delta) => {
      if (u >= 1) return;

      road.getPointAt(u, pos);

      truck.position.copy(pos);

      road.getTangentAt(u, dir);
      pos.add(dir);
      truck.lookAt(pos);

      u += 0.0001;

      label.updatePlace(camera, threeJs.getWebGLRenderer("default"));
    });
  });
}

{
  const ship = new ModelObj("./cargo_ship/scene.gltf", "ship", 0xffffff, {
    offset: [0, -1.5, 0],
    rotation: [0, 1, 0],
    scaleFactor: 0.05,
  });

  map.add(ship);

  map.onReady(() => {
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();
    let u = 0;

    const waterway = map.waterways[1];

    threeJs.onAnimate((_, elapse) => {
      if (u >= 1) return;

      waterway.getPointAt(u, pos);
      ship.position.copy(pos);

      waterway.getTangentAt(u, dir);
      pos.add(dir);
      ship.lookAt(pos);

      u += 0.0001;
      // ship.rotation.x = 0.03 * Math.sin(elapse);
    });
  });
}

threeJs.startAnimation();

const Crs = new THREE.AxesHelper(1);
// Crs.position.y = 15;
map.add(Crs);

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement(Panel, { children: Labels })
);

export {};
