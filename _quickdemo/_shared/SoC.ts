import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

import {
  __lights__,
  animationLoopFns,
  readyFns,
  type ReadyFn,
} from "./SoCFramework.js";

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x282c34); // Set a dark background color

// 2. Camera Setup
// PerspectiveCamera( fov, aspect, near, far )
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 5, 5); // Set initial camera position

const css2DRenderer = new CSS2DRenderer();

// 3. Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing for smoother edges
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

document.body.appendChild(renderer.domElement);

css2DRenderer.setSize(window.innerWidth, window.innerHeight);

css2DRenderer.domElement.style.position = "absolute";
css2DRenderer.domElement.style.top = "0px";
css2DRenderer.domElement.style.zIndex = 120 + "";
css2DRenderer.domElement.style.pointerEvents = "none"; // Allow clicking through

document.body.appendChild(css2DRenderer.domElement);

// 4. Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // Directional light for shadows
directionalLight.position.set(0, 1, 0).normalize();
scene.add(directionalLight);

// 6. OrbitControls Setup
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia) for a smoother experience
controls.dampingFactor = 0.05; // How much damping to apply
// controls.screenSpacePanning = false; // Prevents panning in screen space
controls.minDistance = 2; // Minimum zoom distance
// controls.maxDistance = 100; // Maximum zoom distance
controls.maxPolarAngle = Math.PI; // Limit vertical rotation to avoid going below the "ground"
controls.minPolarAngle = 0; // Limit vertical rotation to avoid going below the "ground"
controls.maxAzimuthAngle = Math.PI; // Limit vertical rotation to avoid going below the "ground"
controls.minAzimuthAngle = -Math.PI; // Limit vertical rotation to avoid going below the "ground"

const clock = new THREE.Clock();
// 7. Animation Loop
function animate() {
  requestAnimationFrame(animate); // Request the next frame

  for (const animationLoopFn of animationLoopFns) {
    animationLoopFn(
      clock.getDelta(),
      clock.getElapsedTime(),
      scene,
      camera,
      renderer
    );
  }

  controls.update(); // Only required if controls.enableDamping or controls.autoRotate are set to true
  renderer.render(scene, camera); // Render the scene
  css2DRenderer.render(scene, camera);
}

animate();

// 8. Handle Window Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // Update camera's projection matrix
  renderer.setSize(window.innerWidth, window.innerHeight);
  css2DRenderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens
});

__lights__.dir = directionalLight;
__lights__.amb = ambientLight;

{
  let fn: ReadyFn = null;
  while ((fn = readyFns.shift())) {
    fn(scene, camera, renderer, controls);
  }

  readyFns["__args"] = [scene, camera, renderer, controls];
}

const urlS = new URLSearchParams(location.search);
const urlPath = urlS.get("main");
const mainUrl = `${__quickdemoJsHost__}${urlPath}.soc.js`;

import(mainUrl);
