import * as THREE from "three";
import { setPopupObject } from "./tooltip.js";

export const createInteractive = (
  camera: THREE.Camera,
  world: THREE.Scene,
  docElement: HTMLDivElement
) => {
  const coords = new THREE.Vector2();
  const caster = new THREE.Raycaster();

  caster.params.Line.threshold = 0.01;

  const sorter = (a: THREE.Intersection, b: THREE.Intersection) =>
    a.distance - b.distance;

  const onCurrentTargetSet = (target: THREE.Object3D) => {
    currentTarget = target;
    setPopupObject(target);
  };

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
        fire(currentTarget, "mouseOut");
        docElement.style.cursor = "default";
      } else {
        if (currentTarget === null) {
          fire(nextTarget, "mouseIn");
        } else {
          fire(currentTarget, "mouseOut");
          fire(nextTarget, "mouseIn");
        }

        docElement.style.cursor = "pointer";
      }

      onCurrentTargetSet(nextTarget);
    }
  };

  const enter = () => {
    docElement.addEventListener("pointermove", move);
    docElement.addEventListener("pointerleave", leave);
    docElement.addEventListener("pointerdown", down);
    docElement.addEventListener("pointerup", up);
  };

  const leave = () => {
    isDown = false;
    ennabled = false;
    docElement.style.cursor = "default";
    onCurrentTargetSet(null);

    docElement.removeEventListener("pointermove", move);
    docElement.removeEventListener("pointerleave", leave);
    docElement.removeEventListener("pointerdown", down);
    docElement.removeEventListener("pointerup", up);
  };

  const move = (e: PointerEvent) => {
    const w = docElement.clientWidth;
    const h = docElement.clientHeight;

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

  const enable = () => {
    enter();
    docElement.addEventListener("pointerenter", enter);
    ennabled = true;
  };

  const disable = () => {
    leave();
    docElement.removeEventListener("pointerenter", enter);
    ennabled = false;
  };

  let currentTarget: THREE.Object3D = null;
  let isDown = false;
  let ennabled = false;

  return {
    enable,
    disable,
  };
};

export const createFollowing = (context: WithActiveCamera) => {
  const currentCamera = context.camera;

  const camera = new THREE.PerspectiveCamera(
    currentCamera.fov,
    currentCamera.aspect,
    currentCamera.near,
    currentCamera.far
  );

  const pos = new THREE.Vector3();
  const lookat = new THREE.Vector3();

  return {
    follow: (target: THREE.Object3D) => {
      camera.position.set(0, 3, 0);
      camera.lookAt(lookat);
      target.add(camera);

      context.activeCamera = camera;
      context.controls.enabled = false;
    },
    unfollow: () => {
      context.controls.enabled = true;
      context.activeCamera = currentCamera;
    },
  };
};
