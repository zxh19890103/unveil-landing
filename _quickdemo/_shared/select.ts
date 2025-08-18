import * as THREE from "three";

export interface Clickable {
  clickable: true;
}

export type Object3DClickable = THREE.Object3D & Clickable;

export const createSelector = (
  camera: THREE.Camera,
  world: THREE.Scene,
  domElement: HTMLDivElement
) => {
  const coords = new THREE.Vector2();
  const caster = new THREE.Raycaster();

  const w = domElement.clientWidth;
  const h = domElement.clientHeight;

  const cast = () => {
    const intersections = caster.intersectObject(world, true);
    console.log(intersections);
  };

  const enter = () => {};
  const leave = () => {};
  const move = (e: PointerEvent) => {
    const x = 2 * (e.pageX / w) - 1;
    const y = 1 - 2 * (e.pageY / h);
    coords.set(x, y);
    console.log(x, y);
    caster.setFromCamera(coords, camera);
    cast();
  };

  domElement.addEventListener("pointerenter", enter);
  domElement.addEventListener("pointermove", move);
  domElement.addEventListener("pointerleave", leave);

  return {
    cast: () => {},
  };
};
