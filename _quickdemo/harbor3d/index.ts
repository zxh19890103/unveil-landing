import { ModelObj, ThreeJsSetup } from "@/_shared/index.js";
import React from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";

const threejsContainer = document.querySelector(
  "#threejs-container"
) as HTMLElement;

const threeJs = new ThreeJsSetup(threejsContainer);
threeJs.setupControls();

const { scene, camera } = threeJs;

camera.position.set(0, 5, 10);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2, 1, 1),
  new THREE.MeshPhysicalMaterial({ color: "#0069af" })
);

const loader = new THREE.TextureLoader(new THREE.LoadingManager());

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(0.666666, 1),
  new THREE.MeshPhongMaterial({
    color: "grey",
    map: loader.load("./close-up-bright-glitter.jpg"),
  })
);

road.rotateX(-90 * THREE.MathUtils.DEG2RAD);
road.position.set(0, 0.1, 0);
road.scale.setScalar(100);

plane.scale.setScalar(1000);
plane.rotateX(-90 * THREE.MathUtils.DEG2RAD);

const truck = new ModelObj("./3d_truck__model.glb", "truck", "#ffffff", {
  scaleFactor: 5,
  rotation: [0, 0, 0],
});

scene.add(plane, road, truck);

threeJs.onAnimate(() => {
  truck.position.z += 0.01;
});

scene.add(new THREE.DirectionalLight("white", 1.2));
scene.add(new THREE.AmbientLight("white", 0.8));

// Create and configure Sky
const sky = new Sky();
sky.scale.setScalar(1000); // Large scale to encompass the scene
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
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
uniforms["sunPosition"].value.copy(sun);

threeJs.startAnimation();

scene.add(new THREE.AxesHelper(10));

ReactDOM.createRoot(document.querySelector(".App"), {}).render(
  React.createElement("div", {
    children: "hello",
    style: {
      background: "#fff",
    },
  })
);

export {};
