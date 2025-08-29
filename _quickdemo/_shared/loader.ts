import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loaderManager = new THREE.LoadingManager(
  (...args) => {},
  (url, loaded, total) => {
    for (const fn of progressFns) fn(loaded, total);
  },
  () => {}
);

type OnProgressFn = (loaded: number, total: number) => void;

const progressFns: OnProgressFn[] = [];

function onLoading(fn: OnProgressFn) {
  progressFns.push(fn);
}

function onLoadingDelete(fn: OnProgressFn) {
  const index = progressFns.indexOf(fn);
  progressFns.slice(index, 1);
}

const textLoader = new THREE.TextureLoader(loaderManager);
const gltfLoader = new GLTFLoader(loaderManager);
const audioLoader = new THREE.AudioLoader(loaderManager);

export { textLoader, gltfLoader, audioLoader, onLoading, onLoadingDelete };
