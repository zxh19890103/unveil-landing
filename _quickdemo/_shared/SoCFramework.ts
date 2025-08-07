import * as THREE from "three";

type Lights = {
  dir: THREE.DirectionalLight;
  amb: THREE.AmbientLight;
};

export const __lights__: Lights = {
  dir: null,
  amb: null,
};

export type ReadyFn = (
  world: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) => void;

export type AnimationLoopFn = (
  delta: number,
  elapsed: number,
  world: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) => void;

export const readyFns: ReadyFn[] = [];

export const whenReady = (fn: ReadyFn) => {
  if (readyFns["__args"]) {
    const params = readyFns["__args"] as any[];
    fn(params[0], params[1], params[2]);
  } else {
    readyFns.push(fn);
  }
};

export const animationLoopFns: AnimationLoopFn[] = [];
export const animationLoop = (fn: AnimationLoopFn) => {
  animationLoopFns.push(fn);
};
