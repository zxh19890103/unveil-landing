import * as THREE from "three";

export const createInteractive = (
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

  const fire = (
    obj: THREE.Object3D,
    event: InteractiveEventType,
    payload: any = null
  ) => {
    obj.dispatchEvent({ type: event, payload });
  };

  const hover = (obj: THREE.Object3D) => {
    if (obj.__$hoverStyle) {
    }
  };

  const cast = () => {
    const intersections = caster.intersectObject(world, true);
    intersections.sort(sorter);
    const intersection = intersections[0];

    const nextTarget =
      intersection === undefined
        ? null
        : (findTarget(
            intersection.object,
            intersection.instanceId
          ) as THREE.Object3D);

    if (currentTarget === nextTarget) {
      // keep
    } else {
      // mutation
      if (nextTarget === null) {
        fire(currentTarget, "mouseout");
        domElement.style.cursor = "default";
      } else {
        if (currentTarget === null) {
          fire(nextTarget, "mousein");
        } else {
          fire(currentTarget, "mouseout");
          fire(nextTarget, "mousein");
        }

        domElement.style.cursor = "pointer";
      }

      currentTarget = nextTarget;
    }
  };

  const enter = () => {
    domElement.addEventListener("pointermove", move);
    domElement.addEventListener("pointerleave", leave);
    domElement.addEventListener("pointerdown", down);
    domElement.addEventListener("pointerup", up);
  };

  const leave = () => {
    isDown = false;
    currentTarget = null;

    domElement.removeEventListener("pointermove", move);
    domElement.removeEventListener("pointerleave", leave);
    domElement.removeEventListener("pointerdown", down);
    domElement.removeEventListener("pointerup", up);
  };

  const move = (e: PointerEvent) => {
    const w = domElement.clientWidth;
    const h = domElement.clientHeight;

    const x = 2 * (e.pageX / w) - 1;
    const y = 1 - 2 * (e.pageY / h);
    coords.set(x, y);
    caster.setFromCamera(coords, camera);
    cast();
  };

  const down = () => {
    isDown = true;
  };

  const up = () => {
    if (isDown) {
      if (currentTarget) {
        fire(currentTarget, "click");
      }

      isDown = false;
    }
  };

  let currentTarget: THREE.Object3D = null;
  let isDown = false;

  domElement.addEventListener("pointerenter", enter);
  return {};
};

/***
 * @todo considering animation
 */
