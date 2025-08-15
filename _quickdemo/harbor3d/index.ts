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

const DEG2RAD = THREE.MathUtils.DEG2RAD;

const threejsContainer = document.querySelector(
  "#threejs-container"
) as HTMLElement;

const threeJs = new ThreeJsSetup(threejsContainer, 75);
threeJs.setupControls();

const { scene, camera } = threeJs;

camera.position.set(-1, 2, 3);
camera.position.setLength(300);

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
}

// const truck = new ModelObj("./3d_truck__model.glb", "truck", "#ffffff", {
//   scaleFactor: 5,
//   rotation: [0, 0, 0],
// });

// scene.add(plane);

// threeJs.onAnimate(() => {
//   truck.position.z += 0.01;
// });

scene.add(new THREE.DirectionalLight("white", 1.2));
scene.add(new THREE.AmbientLight("white", 0.8));

// Create and configure Sky
const sky = new Sky();
sky.scale.setScalar(1000); // Large scale to encompass the scene
scene.add(sky);

// water
{
  const waterGeometry = new THREE.PlaneGeometry(5000, 5000);
  // 创建水面
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/waternormals.jpg", // 法线贴图
      (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(0, 1, 0), // 光照方向
    sunColor: 0xffffff, // 阳光颜色
    waterColor: 0x001e0f, // 水体颜色
    distortionScale: 3.7, // 波纹强度
    fog: scene.fog !== undefined, // 是否跟随场景雾
  });

  // 旋转到水平
  water.rotation.x = -Math.PI / 2;

  scene.add(water);

  threeJs.onAnimate((delta) => {
    // 驱动波浪时间
    water.material.uniforms["time"].value += delta;
  });
}

{
  const ship = new ModelObj("./cargo_ship/scene.gltf", "ship", 0xffffff, {
    rotation: [0, 1, 0],
    scaleFactor: 20,
  });

  scene.add(ship);

  ship.position.set(600, 10, 0);

  threeJs.onAnimate((_, elapse) => {
    ship.rotation.x = 0.03 * Math.sin(elapse);
  });
}

{
  const road = new ModelObj("./road/scene.gltf", "road", 0xfe9102, {
    rotation: [0, 0, 0],
    scaleFactor: 0.5,
    offset: [0, -100, 0],
    count: 5,
  });

  scene.add(road);
}

/*
{
  const ship = new ModelObj("./low_poly_truck_tank/scene.gltf", "ship", 0xffffff, {
    rotation: [0, 0, 0],
    scaleFactor: 0.08,
  });

  scene.add(ship);
}*/

{
  const land = new Land();
  const dock = new Dock();

  dock.position.set(land.size.x / 2 + dock.size.x / 2, 0, 0);

  land.add(dock);

  scene.add(land);
}

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

threeJs.startAnimation();

/*
{
  const svgLoader = new SVGLoader(new THREE.LoadingManager());

  svgLoader.load("./map.svg", (data) => {
    console.log(data);
    const paths = data.paths;
    const group = new THREE.Group();

    const extrudeSettings = {
      steps: 2,
      depth: 4,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 1,
    };

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];

      const material = new THREE.MeshBasicMaterial({
        color: path.color,
        side: THREE.FrontSide,
        depthWrite: false,
      });

      if (i === 2) {
        // road
        // material.map = loader.load("./close-up-bright-glitter.jpg")
      }

      console.log(material.color.getHexString());

      const shapes = SVGLoader.createShapes(path);

      // const geometry = new THREE.ExtrudeGeometry(shapes, extrudeSettings);
      // const mesh = new THREE.Mesh(geometry, material);
      // group.add(mesh);

      for (let j = 0; j < shapes.length; j++) {
        const shape = shapes[j];
        const geometry = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
      }
    }

    const scale = 5.5;
    group.scale.setScalar(scale);
    const Offset = new THREE.Vector3(600, 0, 400).multiplyScalar(scale);
    // group.position.set(-Offset.x / 2, 1, Offset.z / 2);
    group.rotateX(-90 * DEG2RAD);

    scene.add(group);
  });
}
  */

const Crs = new THREE.AxesHelper(50);
Crs.position.y = 15;

scene.add(Crs);

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement(Panel)
);

export {};
