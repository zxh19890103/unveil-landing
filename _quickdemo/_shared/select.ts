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

  caster.params.Line.threshold = 0.01;

  const sorter = (a: THREE.Intersection, b: THREE.Intersection) =>
    a.distance - b.distance;

  const findTarget = (hit: THREE.Object3D, instanceId: number) => {
    let target = hit;

    while (target && target.__$interactive !== true) {
      target = target.parent;
    }

    return target ?? null;
  };

  const cast = () => {
    const intersections = caster.intersectObject(world, true);
    intersections.sort(sorter);
    const intersection = intersections[0];
    if (intersection === undefined) {
    } else {
      const target = findTarget(intersection.object, intersection.instanceId);
      console.log(target?.name);
    }
  };

  const enter = () => {};
  const leave = () => {};
  const move = (e: PointerEvent) => {
    const w = domElement.clientWidth;
    const h = domElement.clientHeight;

    const x = 2 * (e.pageX / w) - 1;
    const y = 1 - 2 * (e.pageY / h);
    coords.set(x, y);
    caster.setFromCamera(coords, camera);
    cast();
  };

  domElement.addEventListener("pointerenter", enter);
  domElement.addEventListener("pointermove", move);
  domElement.addEventListener("pointerleave", leave);

  return {
    onClick: (obj: THREE.Object3D) => {},
    onSelect: (obj: THREE.Object3D) => {},
    onHover: () => {},
  };
};
